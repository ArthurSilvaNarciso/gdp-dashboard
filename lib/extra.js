// Recursos de engajamento e qualidade: reporte de questões, notificações push, liga semanal e amigos, rotina diária.
import crypto from 'node:crypto';
import { q, q1 } from './db.js';
import { HttpError, bad, send, readJson, isUuid, ms, clientIp } from './http.js';
import { requireUser, currentUser, rateLimit, isAdmin, audit } from './auth.js';
import { finalizeSummary, s_today, disciplinePrompt } from './shared.js';
import { aiEnabled, chargeAi, streamCompletion } from './ai.js';

const QID_RE = /^[a-z0-9][a-z0-9_-]{0,60}$/i;
async function requireAdmin(req, res) {
  const u = await requireUser(req, res);
  if (!isAdmin(u)) throw new HttpError(403, 'forbidden', 'Área restrita à administração.');
  return u;
}

/* ================= Reporte de problemas em questões ================= */
const REPORT_KINDS = { gabarito: 'Gabarito errado', enunciado: 'Enunciado confuso', explicacao: 'Explicação errada', portugues: 'Erro de português', outro: 'Outro' };
async function postReport(req, res) {
  const b = await readJson(req);
  await rateLimit('report:' + clientIp(req), 30, 3600);
  const qid = String(b.questionId || ''); const deck = String(b.deckId || '').slice(0, 64);
  if (!QID_RE.test(qid)) throw bad('invalid_question', 'Questão inválida.');
  if (!REPORT_KINDS[b.kind]) throw bad('invalid_kind', 'Escolha o tipo de problema.');
  const note = String(b.note || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  const u = await currentUser(req, res).catch(() => null);
  const dup = u ? await q1(`SELECT id FROM question_reports WHERE user_id = $1 AND question_id = $2 AND status = 'open'`, [u.id, qid]) : null;
  if (dup) { await q(`UPDATE question_reports SET kind = $2, note = $3, created_at = now() WHERE id = $1`, [dup.id, b.kind, note]); return send(res, 200, { ok: true, updated: true }); }
  await q(`INSERT INTO question_reports(question_id, deck_id, user_id, kind, note) VALUES ($1, $2, $3, $4, $5)`, [qid, deck || null, u ? u.id : null, b.kind, note || null]);
  send(res, 201, { ok: true });
}
async function adminReports(req, res) {
  await requireAdmin(req, res);
  const status = new URL(req.url, 'http://x').searchParams.get('status') === 'all' ? 'all' : 'open';
  const rows = await q(`SELECT r.id, r.question_id, r.deck_id, r.kind, r.note, r.status, r.created_at, u.name FROM question_reports r LEFT JOIN users u ON u.id = r.user_id
    WHERE $1 = 'all' OR r.status = 'open' ORDER BY r.created_at DESC LIMIT 200`, [status]);
  const counts = await q(`SELECT question_id, count(*)::int AS n FROM question_reports WHERE status = 'open' GROUP BY 1`);
  const cmap = Object.fromEntries(counts.map((c) => [c.question_id, c.n]));
  send(res, 200, { kinds: REPORT_KINDS, reports: rows.map((r) => ({ id: String(r.id), questionId: r.question_id, deckId: r.deck_id, kind: r.kind, note: r.note, status: r.status, at: ms(r.created_at), by: r.name ? r.name.split(' ')[0] : null, same: cmap[r.question_id] || 1 })) });
}
async function adminReportUpdate(req, res, p) {
  const a = await requireAdmin(req, res); const b = await readJson(req);
  if (!['resolved', 'dismissed', 'open'].includes(b.status)) throw bad('invalid_status', 'Status inválido.');
  const r = await q1(`SELECT question_id FROM question_reports WHERE id = $1`, [String(p.id).replace(/\D/g, '') || '0']);
  if (!r) throw new HttpError(404, 'not_found', 'Reporte não encontrado.');
  // Resolver um reporte fecha todos os abertos da mesma questão.
  await q(`UPDATE question_reports SET status = $2, resolved_at = CASE WHEN $2 = 'open' THEN NULL ELSE now() END WHERE question_id = $1 AND status = 'open'`, [r.question_id, b.status]);
  await audit(req, a.id, 'report_' + b.status, { question: r.question_id });
  send(res, 200, { ok: true });
}

/* ================= Notificações push (Web Push com VAPID) ================= */
// As chaves VAPID são geradas no primeiro uso e guardadas no banco: não precisa configurar nada na Vercel.
let vapid = null;
const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function getVapid() {
  if (vapid) return vapid;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return (vapid = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY });
  const row = await q1(`SELECT value FROM app_config WHERE key = 'vapid'`);
  if (row) return (vapid = JSON.parse(row.value));
  const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
  const keys = { publicKey: b64u(ec.getPublicKey()), privateKey: b64u(ec.getPrivateKey()) };
  await q(`INSERT INTO app_config(key, value) VALUES ('vapid', $1) ON CONFLICT (key) DO NOTHING`, [JSON.stringify(keys)]);
  const again = await q1(`SELECT value FROM app_config WHERE key = 'vapid'`);
  return (vapid = JSON.parse(again.value));
}
async function pushKey(req, res) { const k = await getVapid(); send(res, 200, { publicKey: k.publicKey }); }
async function pushSubscribe(req, res) {
  const u = await requireUser(req, res); const b = await readJson(req);
  const s = b.subscription || {}; const keys = s.keys || {};
  if (typeof s.endpoint !== 'string' || !/^https:\/\/[^\s]{10,800}$/.test(s.endpoint) || !keys.p256dh || !keys.auth) throw bad('invalid_subscription', 'Inscrição de notificação inválida.');
  const hour = Number.isInteger(b.hour) && b.hour >= 6 && b.hour <= 23 ? b.hour : 19;
  await q(`INSERT INTO push_subs(endpoint, user_id, p256dh, auth, hour) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, hour = EXCLUDED.hour, fails = 0`,
  [s.endpoint, u.id, String(keys.p256dh).slice(0, 200), String(keys.auth).slice(0, 100), hour]);
  send(res, 200, { ok: true });
}
async function pushUnsubscribe(req, res) {
  const u = await requireUser(req, res); const b = await readJson(req);
  if (b.endpoint) await q(`DELETE FROM push_subs WHERE endpoint = $1 AND user_id = $2`, [String(b.endpoint), u.id]);
  else await q(`DELETE FROM push_subs WHERE user_id = $1`, [u.id]);
  send(res, 200, { ok: true });
}
async function sendPush(sub, payload) {
  if (globalThis.__MEMORY_FAKE_PUSH) return globalThis.__MEMORY_FAKE_PUSH(sub, payload);
  const webpush = (await import('web-push')).default;
  const k = await getVapid();
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload),
    { vapidDetails: { subject: process.env.PUSH_SUBJECT || 'mailto:contato@memory.app', publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 6 * 3600, urgency: 'normal' });
}
function reminderFor(name, sm) {
  const first = (name || '').split(' ')[0];
  if (sm.streak >= 2) return { title: `Sua sequência de ${sm.streak} dias acaba hoje`, body: `${first ? first + ', ' : ''}um ciclo de 5 minutos salva a sequência. Bora?`, tag: 'streak' };
  if (sm.due > 0) return { title: `${sm.due} ${sm.due === 1 ? 'questão está' : 'questões estão'} sendo esquecidas`, body: 'Revise agora, antes que a memória caia abaixo da meta.', tag: 'due' };
  return { title: 'Hora do seu ciclo de hoje', body: `${first ? first + ', ' : ''}10 questões e seu cérebro agradece amanhã.`, tag: 'daily' };
}
async function pushTest(req, res) {
  const u = await requireUser(req, res);
  await rateLimit('pushtest:' + u.id, 5, 3600);
  const subs = await q(`SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = $1`, [u.id]);
  if (!subs.length) throw bad('no_subscription', 'Ative as notificações neste aparelho primeiro.');
  let sent = 0; for (const s of subs) { try { await sendPush(s, { title: 'Notificações ativadas', body: 'É assim que o Memory vai te lembrar de estudar.', tag: 'test', url: '/' }); sent++; } catch (e) { /* aparelho indisponível */ } }
  send(res, 200, { sent });
}

/* ================= Rotina diária (Vercel Cron) ================= */
// Envia lembretes a quem ainda não estudou hoje e faz a limpeza prevista na política de privacidade.
async function cronDaily(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) { if ((req.headers.authorization || '') !== 'Bearer ' + secret) throw new HttpError(401, 'unauthorized', 'Não autorizado.'); }
  else await rateLimit('cron:daily', 2, 3600);
  const today = s_today();
  const rows = await q(`SELECT p.endpoint, p.p256dh, p.auth, p.user_id, u.name, s.summary FROM push_subs p JOIN users u ON u.id = p.user_id LEFT JOIN states s ON s.user_id = p.user_id
    WHERE p.last_sent IS DISTINCT FROM $1::date AND p.fails < 3`, [today]);
  let sent = 0, skipped = 0, failed = 0;
  for (const r of rows) {
    const raw = r.summary || {}; const sm = finalizeSummary(raw);
    if (raw.days && raw.days[today]) { skipped++; continue; }
    try { await sendPush(r, Object.assign({ url: '/' }, reminderFor(r.name, sm))); sent++; await q(`UPDATE push_subs SET last_sent = $2::date, fails = 0 WHERE endpoint = $1`, [r.endpoint, today]); }
    catch (e) { failed++; const gone = e && (e.statusCode === 404 || e.statusCode === 410); await q(gone ? `DELETE FROM push_subs WHERE endpoint = $1` : `UPDATE push_subs SET fails = fails + 1 WHERE endpoint = $1`, [r.endpoint]); }
  }
  let concursos = null; try { concursos = await refreshConcursos(); } catch (e) { concursos = { error: String(e.message || e).slice(0, 80) }; }
  await q(`DELETE FROM audit_log WHERE at < now() - interval '12 months'`);
  await q(`DELETE FROM password_resets WHERE expires_at < now() - interval '7 days'`);
  await q(`DELETE FROM rate_limits WHERE window_start < $1`, [Math.floor(Date.now() / 1000) - 86400 * 2]);
  await q(`DELETE FROM league_members WHERE week < $1`, [weekKey(Date.now() - 70 * 864e5)]);
  send(res, 200, { ok: true, sent, skipped, failed, concursos });
}


/* ================= Concursos abertos e material por disciplina ================= */
// A lista vem do arquivo publicado com o app (data/concursos.json) e é atualizada aqui, uma região por dia,
// pela IA com busca na web. Cada item é saneado; inscrições encerradas saem da lista.
const UFS = 'BR AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const DK = /^\d{4}-\d{2}-\d{2}$/;
const cs = (v, n) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
function sanitizeConcurso(c) {
  if (!c || typeof c !== 'object') return null;
  const id = cs(c.id, 60).toLowerCase(); if (!/^[a-z0-9-]{4,60}$/.test(id)) return null;
  const fim = c.inscricoes && DK.test(c.inscricoes.fim || '') ? c.inscricoes.fim : null; if (!fim || fim < s_today()) return null;
  const url = (u) => (typeof u === 'string' && /^https?:\/\/[^\s]{4,500}$/.test(u) ? u : null);
  const esc = (Array.isArray(c.escolaridade) ? c.escolaridade : []).filter((x) => ['fundamental', 'medio', 'superior'].includes(x));
  if (!cs(c.orgao, 120) || !cs(c.titulo, 140) || !url(c.edital) || !esc.length) return null;
  return {
    id, orgao: cs(c.orgao, 120), sigla: cs(c.sigla, 20), titulo: cs(c.titulo, 140), esfera: ['federal', 'estadual', 'municipal'].includes(c.esfera) ? c.esfera : 'estadual',
    uf: UFS.includes(c.uf) ? c.uf : 'BR', local: cs(c.local, 120), area: cs(c.area, 40), banca: cs(c.banca, 40), escolaridade: esc,
    vagas: Number.isInteger(c.vagas) && c.vagas >= 0 && c.vagas < 1e6 ? c.vagas : null, cr: !!c.cr, salario: typeof c.salario === 'number' && c.salario > 0 && c.salario < 1e6 ? Math.round(c.salario * 100) / 100 : null,
    inscricoes: { inicio: c.inscricoes && DK.test(c.inscricoes.inicio || '') ? c.inscricoes.inicio : null, fim }, prova: DK.test(c.prova || '') ? c.prova : null,
    taxa: typeof c.taxa === 'number' && c.taxa >= 0 && c.taxa < 1e4 ? c.taxa : null, status: c.status === 'em breve' ? 'em breve' : 'abertas',
    cargos: (Array.isArray(c.cargos) ? c.cargos : []).slice(0, 12).map((x) => ({ nome: cs(x && x.nome, 100), escolaridade: cs(x && x.escolaridade, 12), vagas: Number.isInteger(x && x.vagas) ? x.vagas : null, salario: typeof (x && x.salario) === 'number' ? x.salario : null })).filter((x) => x.nome),
    disciplinas: (Array.isArray(c.disciplinas) ? c.disciplinas : []).slice(0, 16).map((x) => ({ nome: cs(x && x.nome, 60), topicos: (Array.isArray(x && x.topicos) ? x.topicos : []).slice(0, 10).map((t) => cs(t, 80)).filter(Boolean) })).filter((x) => x.nome),
    edital: url(c.edital), fonte: url(c.fonte) || url(c.edital)
  };
}
async function getConcursos(req, res) {
  const row = await q1(`SELECT value FROM app_config WHERE key = 'concursos'`).catch(() => null);
  if (!row) return send(res, 404, { error: 'not_found', message: 'Use a lista publicada com o app.' });
  const d = JSON.parse(row.value); const today = s_today();
  d.items = (d.items || []).filter((c) => c.inscricoes && c.inscricoes.fim >= today);
  res.setHeader('Cache-Control', 'public, max-age=600');
  send(res, 200, d);
}
const REGIONS = [['federal', 'concursos federais (qualquer lotação no Brasil)'], ['SE', 'concursos estaduais e municipais de SP, RJ, MG e ES'], ['S', 'concursos estaduais e municipais de PR, SC e RS'],
  ['NE', 'concursos estaduais e municipais de BA, PE, CE, MA, PB, RN, AL, SE e PI'], ['N', 'concursos estaduais e municipais de PA, AM, RO, AC, AP, RR e TO'], ['CO', 'concursos estaduais e municipais de DF, GO, MT e MS']];
async function anthropicJson(body) {
  if (globalThis.__MEMORY_FAKE_SEARCH) return globalThis.__MEMORY_FAKE_SEARCH(body);
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('anthropic ' + r.status);
  return r.json();
}
async function refreshConcursos(seed) {
  if (!globalThis.__MEMORY_FAKE_SEARCH && !process.env.ANTHROPIC_API_KEY) return { skipped: 'ai_disabled' };
  const st = await q1(`SELECT value FROM app_config WHERE key = 'concursos'`);
  const cur = st ? JSON.parse(st.value) : { updated: null, items: Array.isArray(seed) ? seed : [], turn: 0 };
  const turn = (cur.turn || 0) % REGIONS.length; const [rk, rdesc] = REGIONS[turn]; const today = s_today();
  const prompt = `Hoje é ${today}. Pesquise na web ${rdesc} com edital publicado e inscrições abertas hoje ou que ainda vão abrir. Confira datas, vagas, salário, banca e o link oficial do edital em fontes confiáveis. Liste até 10, priorizando os mais relevantes.
Responda SOMENTE com um array JSON; cada item: {"id":"slug-unico","orgao":"","sigla":"","titulo":"cargo principal","esfera":"federal|estadual|municipal","uf":"UF ou BR","local":"","area":"","banca":"","escolaridade":["fundamental"|"medio"|"superior"],"vagas":numero|null,"cr":bool,"salario":numero|null,"inscricoes":{"inicio":"AAAA-MM-DD"|null,"fim":"AAAA-MM-DD"},"prova":"AAAA-MM-DD"|null,"taxa":numero|null,"status":"abertas"|"em breve","cargos":[{"nome":"","escolaridade":"","vagas":numero|null,"salario":numero|null}],"disciplinas":[{"nome":"","topicos":[""]}],"edital":"https://...","fonte":"https://..."}. Nunca invente números: use null quando não confirmar.`;
  const out = await anthropicJson({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5', max_tokens: 8000, tools: [{ type: process.env.WEB_SEARCH_TOOL || 'web_search_20250305', name: 'web_search', max_uses: 6, user_location: { type: 'approximate', country: 'BR', timezone: 'America/Sao_Paulo' } }], messages: [{ role: 'user', content: prompt }] });
  const text = (out.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const i = text.indexOf('['), j = text.lastIndexOf(']'); let arr = [];
  try { arr = JSON.parse(text.slice(i, j + 1)); } catch (e) { arr = []; }
  const map = new Map((cur.items || []).map((c) => [c.id, c])); let added = 0;
  for (const raw of Array.isArray(arr) ? arr : []) { const c = sanitizeConcurso(raw); if (!c) continue; if (!map.has(c.id)) added++; map.set(c.id, Object.assign({}, map.get(c.id), c)); }
  const items = [...map.values()].map(sanitizeConcurso).filter(Boolean).sort((a, b) => a.inscricoes.fim.localeCompare(b.inscricoes.fim));
  const val = { updated: today, turn: turn + 1, items };
  await q(`INSERT INTO app_config(key, value) VALUES ('concursos', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [JSON.stringify(val)]);
  return { region: rk, added, total: items.length };
}
async function adminRefreshConcursos(req, res) {
  const a = await requireAdmin(req, res); const b = await readJson(req).catch(() => ({}));
  await rateLimit('concursos-refresh', 6, 3600);
  const r = await refreshConcursos(Array.isArray(b.seed) ? b.seed : null);
  await audit(req, a.id, 'concursos_refresh', r);
  send(res, 200, r);
}
async function aiDiscipline(req, res) {
  const u = await requireUser(req, res); const b = await readJson(req, 64 * 1024);
  const disciplina = cs(b.disciplina, 60); if (!disciplina) throw bad('invalid_discipline', 'Informe a disciplina.');
  await rateLimit('ai-disc:' + u.id, 6, 600);
  await chargeAi(u.id, 10);
  const prompt = disciplinePrompt({ concurso: cs(b.concurso, 140), cargo: cs(b.cargo, 100), banca: cs(b.banca, 40), disciplina, topicos: (Array.isArray(b.topicos) ? b.topicos : []).slice(0, 12).map((t) => cs(t, 80)), nAulas: 4, nQ: 12, ce: /cebraspe|cespe/i.test(b.banca || '') });
  await streamCompletion(res, { messages: [{ role: 'user', content: prompt }], maxTokens: 16000 });
}

/* ================= Liga semanal ================= */
// Semana começa na segunda-feira (horário de Brasília). Pontos = 10 por acerto + 2 por resposta.
const TIERS = ['Bronze', 'Prata', 'Ouro', 'Safira', 'Diamante'];
const LEAGUE_SIZE = 30, MOVE = 5;
function weekKey(at = Date.now()) {
  const d = s_today(undefined, at); const dt = new Date(d + 'T12:00:00Z'); const dow = (dt.getUTCDay() + 6) % 7;
  return new Date(dt.getTime() - dow * 864e5).toISOString().slice(0, 10);
}
function weekPoints(summary, wk) {
  let p = 0; const days = (summary && summary.days) || {};
  const end = new Date(new Date(wk + 'T12:00:00Z').getTime() + 7 * 864e5).toISOString().slice(0, 10);
  for (const k in days) if (k >= wk && k < end) p += (days[k][1] || 0) * 10 + (days[k][0] || 0) * 2;
  return p;
}
const weekEnds = (wk) => new Date(new Date(wk + 'T03:00:00Z').getTime() + 7 * 864e5).getTime(); // segunda 00h em Brasília
async function leagueTouch(userId, summary) {
  const wk = weekKey(); await q(`UPDATE league_members SET xp = $3 WHERE week = $1 AND user_id = $2`, [wk, userId, weekPoints(summary, wk)]);
}
async function joinLeague(u) {
  const wk = weekKey();
  let me = await q1(`SELECT league, tier, xp FROM league_members WHERE week = $1 AND user_id = $2`, [wk, u.id]);
  if (me) return me;
  // Promoção e rebaixamento a partir da última semana em que participou.
  const last = await q1(`SELECT week, league, tier FROM league_members WHERE user_id = $1 AND week < $2 ORDER BY week DESC LIMIT 1`, [u.id, wk]);
  let tier = 1;
  if (last) {
    tier = last.tier;
    if (last.week === weekKey(Date.now() - 7 * 864e5)) {
      const rank = await q(`SELECT user_id FROM league_members WHERE week = $1 AND league = $2 ORDER BY xp DESC, joined_at ASC`, [last.week, last.league]);
      const pos = rank.findIndex((r) => r.user_id === u.id); const n = rank.length; const mine = await q1(`SELECT xp FROM league_members WHERE week = $1 AND user_id = $2`, [last.week, u.id]);
      if (pos >= 0 && pos < MOVE && n > 1 && mine && mine.xp > 0) tier = Math.min(TIERS.length, tier + 1);
      else if (pos >= 0 && n > MOVE * 2 && pos >= n - MOVE) tier = Math.max(1, tier - 1);
    }
  }
  const open = await q1(`SELECT league FROM league_members WHERE week = $1 AND tier = $2 GROUP BY league HAVING count(*) < $3 ORDER BY count(*) DESC LIMIT 1`, [wk, tier, LEAGUE_SIZE]);
  const league = open ? open.league : wk + '-' + tier + '-' + crypto.randomBytes(4).toString('hex');
  const st = await q1(`SELECT summary FROM states WHERE user_id = $1`, [u.id]);
  await q(`INSERT INTO league_members(week, user_id, league, tier, xp) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [wk, u.id, league, tier, weekPoints(st && st.summary, wk)]);
  return q1(`SELECT league, tier, xp FROM league_members WHERE week = $1 AND user_id = $2`, [wk, u.id]);
}
async function getLeague(req, res) {
  const u = await requireUser(req, res);
  const me = await joinLeague(u); const wk = weekKey();
  const rows = await q(`SELECT m.user_id, m.xp, u.name, s.summary->'avatar' AS avatar FROM league_members m JOIN users u ON u.id = m.user_id LEFT JOIN states s ON s.user_id = m.user_id
    WHERE m.week = $1 AND m.league = $2 ORDER BY m.xp DESC, m.joined_at ASC`, [wk, me.league]);
  const n = rows.length;
  send(res, 200, {
    week: wk, endsAt: weekEnds(wk), tier: me.tier, tierName: TIERS[me.tier - 1], tiers: TIERS, size: n, promote: me.tier < TIERS.length ? Math.min(MOVE, Math.max(1, n - 1)) : 0, demote: n > MOVE * 2 && me.tier > 1 ? MOVE : 0,
    members: rows.map((r, i) => ({ pos: i + 1, me: r.user_id === u.id, name: (r.name || '').split(' ')[0], avatar: r.avatar || null, points: r.xp }))
  });
}

/* ================= Amigos (convite por link) ================= */
async function inviteCode(u) {
  const row = await q1(`SELECT invite_code FROM users WHERE id = $1`, [u.id]);
  if (row && row.invite_code) return row.invite_code;
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(5).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
    if (code.length < 6) continue;
    try { await q(`UPDATE users SET invite_code = $2 WHERE id = $1 AND invite_code IS NULL`, [u.id, code]); const again = await q1(`SELECT invite_code FROM users WHERE id = $1`, [u.id]); if (again.invite_code) return again.invite_code; } catch (e) { /* colisão, tenta outro */ }
  }
  throw new HttpError(500, 'code_exhausted', 'Não foi possível gerar o convite agora.');
}
async function getFriends(req, res) {
  const u = await requireUser(req, res); const code = await inviteCode(u); const wk = weekKey();
  const rows = await q(`SELECT u.id, u.name, s.summary FROM friends f JOIN users u ON u.id = f.friend_id LEFT JOIN states s ON s.user_id = u.id WHERE f.user_id = $1`, [u.id]);
  const mine = await q1(`SELECT summary FROM states WHERE user_id = $1`, [u.id]);
  const list = [{ id: u.id, name: u.name, summary: mine && mine.summary, me: true }, ...rows].map((r) => { const sm = finalizeSummary(r.summary || {}); return { me: !!r.me, id: r.me ? null : r.id, name: (r.name || '').split(' ')[0], avatar: (r.summary && r.summary.avatar) || null, points: weekPoints(r.summary, wk), streak: sm.streak }; })
    .sort((a, b) => b.points - a.points).map((x, i) => Object.assign(x, { pos: i + 1 }));
  send(res, 200, { code, friends: list });
}
async function addFriend(req, res) {
  const u = await requireUser(req, res); const b = await readJson(req);
  await rateLimit('friend:' + u.id, 30, 3600);
  const code = String(b.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw bad('invalid_code', 'Código de convite inválido.');
  const f = await q1(`SELECT id, name FROM users WHERE invite_code = $1`, [code]);
  if (!f) throw new HttpError(404, 'invite_not_found', 'Convite não encontrado. Confira o link.');
  if (f.id === u.id) throw bad('self_invite', 'Esse é o seu próprio convite.');
  await q(`INSERT INTO friends(user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING`, [u.id, f.id]);
  await audit(req, u.id, 'friend_added');
  send(res, 200, { ok: true, friend: { name: f.name.split(' ')[0] } });
}
async function removeFriend(req, res, p) {
  const u = await requireUser(req, res); if (!isUuid(p.id)) throw bad('invalid_id', 'Amigo inválido.');
  await q(`DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`, [u.id, p.id]);
  send(res, 200, { ok: true });
}

export const EXTRA_ROUTES = [
  ['POST', 'reports', postReport],
  ['GET', 'admin/reports', adminReports],
  ['PATCH', 'admin/reports/:id', adminReportUpdate],
  ['GET', 'push/key', pushKey],
  ['POST', 'push/subscribe', pushSubscribe],
  ['DELETE', 'push/subscribe', pushUnsubscribe],
  ['POST', 'push/test', pushTest],
  ['GET', 'cron/daily', cronDaily],
  ['GET', 'concursos', getConcursos],
  ['POST', 'admin/concursos/refresh', adminRefreshConcursos],
  ['POST', 'ai/discipline', aiDiscipline],
  ['GET', 'league', getLeague],
  ['GET', 'friends', getFriends],
  ['POST', 'friends', addFriend],
  ['DELETE', 'friends/:id', removeFriend]
];
export { leagueTouch, weekKey, weekPoints, REPORT_KINDS, sanitizeConcurso, refreshConcursos };
