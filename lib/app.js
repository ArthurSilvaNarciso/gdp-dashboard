// API do Memory — um único roteador (cabe numa função serverless da Vercel).
import crypto from 'node:crypto';
import { q, q1, hasDatabase, ensureSchema } from './db.js';
import { HttpError, bad, send, readJson, checkOrigin, isEmail, isUuid, ms, clientIp } from './http.js';
import { hashPassword, checkPassword, validatePassword, issueSession, clearSession, currentUser, requireUser, publicUser, rateLimit, audit, isAdmin } from './auth.js';
import { aiEnabled, chargeAi, streamCompletion } from './ai.js';
import { sanitizeState, mergeState, sanitizeDeck, sanitizeQuestion, summarize, finalizeSummary, deckProgress, tutorSystem, variationPrompt, buildPrompt } from './shared.js';
import { BUILTIN } from './builtin.js';
import { EXTRA_ROUTES, leagueTouch } from './extra.js';

export const VERSION = '3.2.0';
const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const code6 = () => Array.from({ length: 6 }, () => CODE_ABC[crypto.randomInt(CODE_ABC.length)]).join('');
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
const cleanName = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 60);
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'Aluno';
const isUnique = (e) => e && (e.code === '23505' || /duplicate key|unique/i.test(String(e.message)));

async function withUniqueCode(fn) {
  for (let i = 0; i < 6; i++) { try { return await fn(code6()); } catch (e) { if (!isUnique(e)) throw e; } }
  throw new HttpError(500, 'code_exhausted', 'Não foi possível gerar um código agora.');
}

/* ================= Conta ================= */
async function signup(req, res) {
  const b = await readJson(req);
  await rateLimit('signup:' + clientIp(req), 8, 3600);
  const email = String(b.email || '').trim().toLowerCase();
  const name = cleanName(b.name);
  if (!name) throw bad('name_required', 'Informe seu nome.');
  if (!isEmail(email)) throw bad('invalid_email', 'Informe um e-mail válido.');
  validatePassword(b.password, email);
  if (b.terms !== true) throw bad('terms_required', 'Para criar a conta, aceite os Termos de uso e a Política de privacidade.');
  const hash = await hashPassword(b.password);
  let u;
  try { u = await q1('INSERT INTO users(email, name, password_hash, terms_at) VALUES ($1, $2, $3, now()) RETURNING id, email, name, token_version, created_at', [email, name, hash]); }
  catch (e) { if (isUnique(e)) throw new HttpError(409, 'email_taken', 'Já existe uma conta com este e-mail. Entre com sua senha.'); throw e; }
  await issueSession(req, res, u);
  await audit(req, u.id, 'signup');
  send(res, 201, { user: publicUser(u) });
}

async function login(req, res) {
  const b = await readJson(req);
  const email = String(b.email || '').trim().toLowerCase();
  const ip = clientIp(req);
  await rateLimit('login-ip:' + ip, 60, 900);
  await rateLimit('login:' + email, 10, 900);
  const u = isEmail(email) ? await q1('SELECT id, email, name, token_version, created_at, password_hash FROM users WHERE email = $1', [email]) : null;
  const ok = await checkPassword(b.password, u && u.password_hash);
  if (!u || !ok) { await audit(req, u ? u.id : null, 'login_failed', { email: email.slice(0, 80) }); throw new HttpError(401, 'bad_credentials', 'E-mail ou senha incorretos.'); }
  await issueSession(req, res, u);
  await q('UPDATE users SET last_seen = now() WHERE id = $1', [u.id]);
  await audit(req, u.id, 'login');
  send(res, 200, { user: publicUser(u) });
}

async function logout(req, res) { clearSession(req, res); send(res, 200, { ok: true }); }

async function me(req, res) {
  const u = await currentUser(req, res);
  send(res, 200, { user: u ? publicUser(u) : null });
}

async function updateProfile(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req);
  const name = cleanName(b.name);
  if (!name) throw bad('name_required', 'Informe seu nome.');
  const r = await q1('UPDATE users SET name = $2 WHERE id = $1 RETURNING id, email, name, created_at', [u.id, name]);
  send(res, 200, { user: publicUser(r) });
}

async function changePassword(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req);
  await rateLimit('pw:' + u.id, 10, 3600);
  const row = await q1('SELECT password_hash FROM users WHERE id = $1', [u.id]);
  if (!(await checkPassword(b.current, row.password_hash))) throw new HttpError(401, 'bad_credentials', 'A senha atual está incorreta.');
  validatePassword(b.next, u.email);
  const r = await q1('UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1 RETURNING id, email, name, token_version, created_at', [u.id, await hashPassword(b.next)]);
  await issueSession(req, res, r); // as outras sessões (outros aparelhos) são encerradas
  await audit(req, u.id, 'password_changed');
  send(res, 200, { ok: true });
}

async function logoutAll(req, res) {
  const u = await requireUser(req, res);
  const r = await q1('UPDATE users SET token_version = token_version + 1 WHERE id = $1 RETURNING id, email, name, token_version, created_at', [u.id]);
  await issueSession(req, res, r);
  await audit(req, u.id, 'logout_all');
  send(res, 200, { ok: true });
}

async function deleteAccount(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req);
  const row = await q1('SELECT password_hash FROM users WHERE id = $1', [u.id]);
  if (!(await checkPassword(b.password, row.password_hash))) throw new HttpError(401, 'bad_credentials', 'Senha incorreta.');
  await q('DELETE FROM users WHERE id = $1', [u.id]); // apaga em cascata estado, trilhas, turmas e vínculos
  await audit(req, null, 'account_deleted', { id: u.id });
  clearSession(req, res);
  send(res, 200, { ok: true });
}

// LGPD: portabilidade — tudo o que o servidor guarda sobre a pessoa.
async function exportData(req, res) {
  const u = await requireUser(req, res);
  const [st, decks, classes, log] = await Promise.all([
    q1('SELECT data, updated_at FROM states WHERE user_id = $1', [u.id]),
    q('SELECT id, data, updated_at FROM decks WHERE owner_id = $1 AND NOT deleted', [u.id]),
    q('SELECT c.id, c.name, m.role, m.joined_at FROM class_members m JOIN classes c ON c.id = m.class_id WHERE m.user_id = $1', [u.id]),
    q('SELECT action, ip, at FROM audit_log WHERE user_id = $1 ORDER BY at DESC LIMIT 200', [u.id])
  ]);
  send(res, 200, { exportedAt: new Date().toISOString(), user: publicUser(u), progress: st ? st.data : null, decks: decks.map((d) => d.data), classes, activity: log },
    { 'Content-Disposition': 'attachment; filename="memory-meus-dados.json"' });
}

/* ================= Progresso ================= */
async function getState(req, res) {
  const u = await requireUser(req, res);
  const r = await q1('SELECT data, version, updated_at FROM states WHERE user_id = $1', [u.id]);
  send(res, 200, r ? { state: r.data, version: r.version, updatedAt: ms(r.updated_at) } : { state: null, version: 0 });
}

async function putState(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req, 2 * 1024 * 1024);
  const incoming = sanitizeState(b.state);
  if (!incoming) throw bad('invalid_state', 'Progresso inválido.');
  // Concorrência otimista: lê, mescla e grava só se ninguém gravou no meio. Tenta de novo se precisar.
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 20 + Math.random() * 60 * attempt));
    const cur = await q1('SELECT data, version FROM states WHERE user_id = $1', [u.id]);
    const merged = cur ? mergeState(sanitizeState(cur.data), incoming) : incoming;
    const json = JSON.stringify(merged), summary = JSON.stringify(summarize(merged));
    if (json.length > 2 * 1024 * 1024) throw new HttpError(413, 'too_large', 'Progresso grande demais.');
    let r;
    if (!cur) {
      r = await q1(`INSERT INTO states(user_id, data, summary, version) VALUES ($1, $2::jsonb, $3::jsonb, 1) ON CONFLICT (user_id) DO NOTHING RETURNING version`, [u.id, json, summary]);
    } else {
      r = await q1(`UPDATE states SET data = $2::jsonb, summary = $3::jsonb, version = version + 1, updated_at = now() WHERE user_id = $1 AND version = $4 RETURNING version`, [u.id, json, summary, cur.version]);
    }
    if (r) { await leagueTouch(u.id, JSON.parse(summary)).catch(() => {}); return send(res, 200, { state: merged, version: r.version }); }
  }
  throw new HttpError(409, 'conflict', 'Muitas gravações ao mesmo tempo. Tente de novo.');
}

/* ================= Trilhas próprias ================= */
async function listDecks(req, res) {
  const u = await requireUser(req, res);
  const rows = await q('SELECT id, data, deleted FROM decks WHERE owner_id = $1 ORDER BY updated_at DESC', [u.id]);
  send(res, 200, { decks: rows.filter((r) => !r.deleted).map((r) => r.data), deleted: rows.filter((r) => r.deleted).map((r) => r.id) });
}

async function putDeck(req, res, { id }) {
  const u = await requireUser(req, res);
  const b = await readJson(req, 1024 * 1024);
  const deck = sanitizeDeck(b.deck, { id });
  if (!deck) throw bad('invalid_deck', 'Trilha inválida.');
  const existing = await q1('SELECT deleted FROM decks WHERE owner_id = $1 AND id = $2', [u.id, id]);
  if (existing && existing.deleted) throw new HttpError(410, 'deleted', 'Esta trilha foi excluída em outro aparelho.');
  if (!existing) {
    const c = await q1('SELECT count(*)::int AS n FROM decks WHERE owner_id = $1 AND NOT deleted', [u.id]);
    if (c.n >= 150) throw bad('too_many_decks', 'Você chegou ao limite de 150 trilhas.');
  }
  await q(`INSERT INTO decks(owner_id, id, data) VALUES ($1, $2, $3::jsonb)
           ON CONFLICT (owner_id, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now() WHERE decks.deleted = false`, [u.id, id, JSON.stringify(deck)]);
  send(res, 200, { deck });
}

async function deleteDeck(req, res, { id }) {
  const u = await requireUser(req, res);
  if (!/^u[A-Za-z0-9_]{1,48}$/.test(id)) throw bad('invalid_deck', 'Trilha inválida.');
  await q(`INSERT INTO decks(owner_id, id, data, deleted) VALUES ($1, $2, NULL, true)
           ON CONFLICT (owner_id, id) DO UPDATE SET data = NULL, deleted = true, updated_at = now()`, [u.id, id]);
  send(res, 200, { ok: true });
}

/* ================= Compartilhar por código curto ================= */
async function createShare(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req, 1024 * 1024);
  await rateLimit('share:' + u.id, 40, 3600);
  const deck = sanitizeDeck(Object.assign({}, b.deck, { id: 'ushare' }), { id: 'ushare', renumber: true });
  if (!deck) throw bad('invalid_deck', 'Trilha inválida.');
  const payload = { title: deck.title, blurb: deck.blurb, questions: deck.questions.map(({ id, ...rest }) => rest), by: firstName(u.name) };
  const code = await withUniqueCode(async (c) => { await q('INSERT INTO shares(code, owner_id, deck) VALUES ($1, $2, $3::jsonb)', [c, u.id, JSON.stringify(payload)]); return c; });
  await audit(req, u.id, 'share_created', { code });
  send(res, 201, { code });
}

async function getShare(req, res, { code }) {
  await rateLimit('share-get:' + clientIp(req), 60, 60);
  const r = await q1('UPDATE shares SET uses = uses + 1 WHERE code = $1 RETURNING deck, created_at', [normCode(code)]);
  if (!r) throw new HttpError(404, 'not_found', 'Código não encontrado. Confira as letras e números.');
  send(res, 200, { deck: r.deck });
}

/* ================= Turmas ================= */
async function membership(classId, userId) {
  if (!isUuid(classId)) throw new HttpError(404, 'not_found', 'Turma não encontrada.');
  const r = await q1(`SELECT c.id, c.name, c.owner_id, c.join_code, c.created_at, m.role FROM classes c JOIN class_members m ON m.class_id = c.id AND m.user_id = $2 WHERE c.id = $1`, [classId, userId]);
  if (!r) throw new HttpError(404, 'not_found', 'Turma não encontrada.');
  return r;
}
const ownerOnly = (m) => { if (m.role !== 'owner') throw new HttpError(403, 'forbidden', 'Só quem criou a turma pode fazer isso.'); };
const deckQids = (d) => (d.builtin ? (BUILTIN[d.id] ? BUILTIN[d.id].qids : []) : (d.questions || []).map((x) => x.id));

async function listClasses(req, res) {
  const u = await requireUser(req, res);
  const rows = await q(`
    SELECT c.id, c.name, c.created_at, m.role, o.name AS owner_name,
      (SELECT count(*)::int FROM class_members x WHERE x.class_id = c.id AND x.role <> 'owner') AS members,
      CASE WHEN m.role = 'owner' THEN c.join_code END AS join_code
    FROM class_members m JOIN classes c ON c.id = m.class_id JOIN users o ON o.id = c.owner_id
    WHERE m.user_id = $1 ORDER BY m.joined_at DESC`, [u.id]);
  const ids = rows.map((r) => r.id);
  const decks = ids.length ? await q('SELECT class_id, deck_id, deck, added_at FROM class_decks WHERE class_id = ANY($1::uuid[]) ORDER BY added_at', [ids]) : [];
  send(res, 200, {
    classes: rows.map((r) => ({
      id: r.id, name: r.name, role: r.role, owner: r.owner_name, members: r.members, joinCode: r.join_code || undefined, createdAt: ms(r.created_at),
      decks: decks.filter((d) => d.class_id === r.id).map((d) => d.deck)
    }))
  });
}

async function createClass(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req);
  const name = cleanName(b.name);
  if (name.length < 2) throw bad('name_required', 'Dê um nome à turma.');
  await rateLimit('class-create:' + u.id, 20, 3600);
  const c = await q1('SELECT count(*)::int AS n FROM classes WHERE owner_id = $1', [u.id]);
  if (c.n >= 30) throw bad('too_many_classes', 'Você chegou ao limite de 30 turmas.');
  const cls = await withUniqueCode((code) => q1('INSERT INTO classes(name, owner_id, join_code) VALUES ($1, $2, $3) RETURNING id, name, join_code, created_at', [name, u.id, code]));
  await q(`INSERT INTO class_members(class_id, user_id, role) VALUES ($1, $2, 'owner')`, [cls.id, u.id]);
  await audit(req, u.id, 'class_created', { id: cls.id });
  send(res, 201, { class: { id: cls.id, name: cls.name, role: 'owner', joinCode: cls.join_code, members: 0, decks: [], createdAt: ms(cls.created_at) } });
}

async function joinClass(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req);
  await rateLimit('class-join:' + u.id, 20, 3600);
  const cls = await q1('SELECT id, name, owner_id FROM classes WHERE join_code = $1', [normCode(b.code)]);
  if (!cls) throw new HttpError(404, 'not_found', 'Código de turma não encontrado.');
  const n = await q1(`SELECT count(*)::int AS n FROM class_members WHERE class_id = $1`, [cls.id]);
  if (n.n >= 500) throw bad('class_full', 'Esta turma está cheia.');
  const r = await q1(`INSERT INTO class_members(class_id, user_id, role) VALUES ($1, $2, 'student') ON CONFLICT DO NOTHING RETURNING role`, [cls.id, u.id]);
  if (r) await audit(req, u.id, 'class_joined', { id: cls.id });
  send(res, 200, { class: { id: cls.id, name: cls.name }, already: !r });
}

async function getClass(req, res, { id }) {
  const u = await requireUser(req, res);
  const m = await membership(id, u.id);
  const isOwner = m.role === 'owner';
  const decks = (await q('SELECT deck FROM class_decks WHERE class_id = $1 ORDER BY added_at', [id])).map((r) => r.deck);
  const rows = await q(`
    SELECT u.id, u.name, u.email, m.role, m.joined_at, u.last_seen, s.summary ${isOwner ? ', s.data' : ''}
    FROM class_members m JOIN users u ON u.id = m.user_id LEFT JOIN states s ON s.user_id = u.id
    WHERE m.class_id = $1 AND m.role <> 'owner'`, [id]);
  const now = Date.now();
  const students = rows.map((r) => ({ r, sm: finalizeSummary(r.summary, now) }));
  const ranking = students
    .map(({ r, sm }) => ({ name: firstName(r.name), avatar: sm.avatar, me: r.id === u.id, week: sm.week, weekOk: sm.weekOk, streak: sm.streak }))
    .sort((a, b) => b.weekOk - a.weekOk || b.week - a.week || b.streak - a.streak).slice(0, 50);
  const out = { id: m.id, name: m.name, role: m.role, createdAt: ms(m.created_at), decks, ranking, members: students.length };
  if (isOwner) {
    out.joinCode = m.join_code;
    const qidsByDeck = decks.map((d) => [d.id, deckQids(d)]);
    out.students = students.map(({ r, sm }) => ({
      id: r.id, name: r.name, email: r.email, joinedAt: ms(r.joined_at), lastSeen: ms(r.last_seen),
      summary: sm,
      decks: Object.fromEntries(qidsByDeck.map(([did, qids]) => [did, deckProgress(r.data, qids, now)]))
    })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const active = out.students.filter((s) => s.summary.week > 0);
    const withAcc = out.students.filter((s) => s.summary.accuracy != null);
    const withMem = out.students.filter((s) => s.summary.memory != null);
    out.overview = {
      students: out.students.length, activeWeek: active.length,
      weekAnswers: out.students.reduce((a, s) => a + s.summary.week, 0),
      accuracy: withAcc.length ? Math.round(withAcc.reduce((a, s) => a + s.summary.accuracy, 0) / withAcc.length) : null,
      memory: withMem.length ? Math.round(withMem.reduce((a, s) => a + s.summary.memory, 0) / withMem.length) : null,
      traps: Object.entries(out.students.reduce((acc, s) => { for (const [k, v] of s.summary.traps) acc[k] = (acc[k] || 0) + v; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3)
    };
  }
  send(res, 200, { class: out });
}

async function renameClass(req, res, { id }) {
  const u = await requireUser(req, res);
  ownerOnly(await membership(id, u.id));
  const name = cleanName((await readJson(req)).name);
  if (name.length < 2) throw bad('name_required', 'Dê um nome à turma.');
  await q('UPDATE classes SET name = $2 WHERE id = $1', [id, name]);
  send(res, 200, { ok: true, name });
}

async function deleteClass(req, res, { id }) {
  const u = await requireUser(req, res);
  ownerOnly(await membership(id, u.id));
  await q('DELETE FROM classes WHERE id = $1', [id]);
  await audit(req, u.id, 'class_deleted', { id });
  send(res, 200, { ok: true });
}

async function newJoinCode(req, res, { id }) {
  const u = await requireUser(req, res);
  ownerOnly(await membership(id, u.id));
  const code = await withUniqueCode(async (c) => { await q('UPDATE classes SET join_code = $2 WHERE id = $1', [id, c]); return c; });
  send(res, 200, { joinCode: code });
}

async function addClassDeck(req, res, { id }) {
  const u = await requireUser(req, res);
  ownerOnly(await membership(id, u.id));
  const b = await readJson(req, 1024 * 1024);
  let deck;
  if (b.builtin) {
    const bi = BUILTIN[b.builtin];
    if (!bi) throw bad('invalid_deck', 'Trilha não encontrada.');
    deck = { id: b.builtin, builtin: true, title: bi.title };
  } else {
    deck = sanitizeDeck(b.deck);
    if (!deck) throw bad('invalid_deck', 'Trilha inválida.');
    deck.tag = 'Turma'; deck.subtitle = 'Trilha da turma';
  }
  const n = await q1('SELECT count(*)::int AS n FROM class_decks WHERE class_id = $1', [id]);
  if (n.n >= 40) throw bad('too_many_decks', 'Limite de 40 trilhas por turma.');
  await q(`INSERT INTO class_decks(class_id, deck_id, deck) VALUES ($1, $2, $3::jsonb) ON CONFLICT (class_id, deck_id) DO UPDATE SET deck = EXCLUDED.deck`, [id, deck.id, JSON.stringify(deck)]);
  send(res, 200, { deck });
}

async function removeClassDeck(req, res, { id, deckId }) {
  const u = await requireUser(req, res);
  ownerOnly(await membership(id, u.id));
  await q('DELETE FROM class_decks WHERE class_id = $1 AND deck_id = $2', [id, deckId]);
  send(res, 200, { ok: true });
}

async function removeMember(req, res, { id, userId }) {
  const u = await requireUser(req, res);
  ownerOnly(await membership(id, u.id));
  if (!isUuid(userId)) throw new HttpError(404, 'not_found', 'Aluno não encontrado.');
  await q(`DELETE FROM class_members WHERE class_id = $1 AND user_id = $2 AND role <> 'owner'`, [id, userId]);
  await audit(req, u.id, 'class_member_removed', { id, userId });
  send(res, 200, { ok: true });
}

async function leaveClass(req, res, { id }) {
  const u = await requireUser(req, res);
  const m = await membership(id, u.id);
  if (m.role === 'owner') throw bad('owner_cannot_leave', 'Quem criou a turma não pode sair; exclua a turma se quiser.');
  await q('DELETE FROM class_members WHERE class_id = $1 AND user_id = $2', [id, u.id]);
  await audit(req, u.id, 'class_left', { id });
  send(res, 200, { ok: true });
}


/* ================= Relatório da turma (CSV para Excel) ================= */
const csvCell = (v) => { const t = v == null ? '' : String(v); return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
const fmtDate = (d) => (d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : '');
async function classReport(req, res, { id }) {
  const u = await requireUser(req, res);
  const m = await membership(id, u.id); ownerOnly(m);
  const decks = (await q('SELECT deck FROM class_decks WHERE class_id = $1 ORDER BY added_at', [id])).map((r) => r.deck);
  const rows = await q(`SELECT u.name, u.email, m.joined_at, u.last_seen, s.summary, s.data FROM class_members m JOIN users u ON u.id = m.user_id
    LEFT JOIN states s ON s.user_id = u.id WHERE m.class_id = $1 AND m.role <> 'owner' ORDER BY u.name`, [id]);
  const now = Date.now();
  const head = ['Aluno', 'E-mail', 'Entrou em', 'Última atividade', 'Respostas na semana', 'Acertos na semana', 'Respostas no total', 'Acerto geral (%)', 'Memória estimada (%)', 'Dias seguidos', 'Questões firmes', 'Pegadinha mais frequente', ...decks.map((d) => 'Trilha: ' + d.title + ' (%)')];
  const lines = [head.map(csvCell).join(';')];
  for (const r of rows) {
    const sm = finalizeSummary(r.summary, now);
    const trap = sm.traps[0] ? sm.traps[0][0] : '';
    lines.push([r.name, r.email, fmtDate(r.joined_at), fmtDate(sm.lastActive || r.last_seen), sm.week, sm.weekOk, sm.answered, sm.accuracy ?? '', sm.memory ?? '', sm.streak, sm.firm, trap,
      ...decks.map((d) => deckProgress(r.data, deckQids(d), now).pct)].map(csvCell).join(';'));
  }
  await audit(req, u.id, 'class_report', { id });
  const name = String(m.name).normalize('NFD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 40) || 'turma';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Disposition', `attachment; filename="memory-${name}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.end('﻿' + lines.join('\r\n') + '\r\n');
}

/* ================= Administração (e-mails em ADMIN_EMAILS) ================= */
async function requireAdmin(req, res) {
  const u = await requireUser(req, res);
  if (!isAdmin(u)) throw new HttpError(403, 'forbidden', 'Área restrita à administração.');
  return u;
}
async function adminOverview(req, res) {
  await requireAdmin(req, res);
  const [tot, signups, sums, cls, misc, ai] = await Promise.all([
    q1(`SELECT count(*)::int AS users,
          count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new7,
          count(*) FILTER (WHERE last_seen > now() - interval '7 days')::int AS active7,
          count(*) FILTER (WHERE last_seen > now() - interval '1 day')::int AS active1 FROM users`),
    q(`SELECT to_char((created_at AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS d, count(*)::int AS n FROM users
        WHERE created_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1`),
    q(`SELECT summary FROM states ORDER BY updated_at DESC LIMIT 5000`),
    q1(`SELECT count(*)::int AS classes, (SELECT count(*)::int FROM class_members WHERE role <> 'owner') AS students FROM classes`),
    q1(`SELECT (SELECT count(*)::int FROM decks WHERE NOT deleted) AS decks, (SELECT count(*)::int FROM shares) AS shares, (SELECT coalesce(sum(uses), 0)::int FROM shares) AS share_uses`),
    q1(`SELECT coalesce(sum(units), 0)::int AS units, count(*)::int AS users FROM ai_usage WHERE day = (now() AT TIME ZONE 'America/Sao_Paulo')::date`)
  ]);
  const now = Date.now(); let week = 0, weekOk = 0, answered = 0; const traps = {};
  const daily = {};
  for (const r of sums) {
    const sm = finalizeSummary(r.summary, now); week += sm.week; weekOk += sm.weekOk; answered += sm.answered;
    for (const [k, v] of sm.traps) traps[k] = (traps[k] || 0) + v;
    for (const k in (r.summary && r.summary.days) || {}) daily[k] = (daily[k] || 0) + r.summary.days[k][0];
  }
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const k = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(now - i * 864e5));
    days.push({ d: k, signups: (signups.find((x) => x.d === k) || {}).n || 0, answers: daily[k] || 0 });
  }
  send(res, 200, {
    users: tot, days, answers: { week, weekOk, total: answered, accuracy: week ? Math.round((weekOk / week) * 100) : null },
    classes: cls, content: misc, ai: Object.assign({ enabled: aiEnabled() }, ai),
    traps: Object.entries(traps).sort((a, b) => b[1] - a[1]).slice(0, 5), version: VERSION
  });
}
async function adminUsers(req, res) {
  await requireAdmin(req, res);
  const qs = new URL(req.url, 'http://x').searchParams.get('q') || '';
  const term = String(qs).trim().slice(0, 80);
  const rows = await q(`SELECT u.id, u.name, u.email, u.created_at, u.last_seen, s.summary,
      (SELECT count(*)::int FROM class_members m WHERE m.user_id = u.id AND m.role <> 'owner') AS joined,
      (SELECT count(*)::int FROM classes c WHERE c.owner_id = u.id) AS owned
    FROM users u LEFT JOIN states s ON s.user_id = u.id
    WHERE $1 = '' OR u.email ILIKE $2 OR u.name ILIKE $2
    ORDER BY u.last_seen DESC LIMIT 100`, [term, '%' + term.replace(/[%_]/g, '') + '%']);
  const now = Date.now();
  send(res, 200, { users: rows.map((r) => { const sm = finalizeSummary(r.summary, now); return { id: r.id, name: r.name, email: r.email, createdAt: ms(r.created_at), lastSeen: ms(r.last_seen), answered: sm.answered, week: sm.week, accuracy: sm.accuracy, streak: sm.streak, joined: r.joined, owned: r.owned }; }) });
}
async function adminAudit(req, res) {
  await requireAdmin(req, res);
  const action = String(new URL(req.url, 'http://x').searchParams.get('action') || '').slice(0, 40);
  const rows = await q(`SELECT a.id, a.action, a.meta, a.ip, a.at, u.email FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
    WHERE $1 = '' OR a.action = $1 ORDER BY a.at DESC LIMIT 100`, [action]);
  send(res, 200, { events: rows.map((r) => ({ id: String(r.id), action: r.action, email: r.email || (r.meta && r.meta.email) || null, ip: r.ip ? r.ip.replace(/(\d+\.\d+)\.\d+\.\d+$/, '$1.x.x') : null, at: ms(r.at) })) });
}


/* ================= Recuperação de senha ================= */
// Link de uso único, válido por 1 hora. Só o hash do token fica no banco.
// Com RESEND_API_KEY + EMAIL_FROM, o link vai por e-mail; sem isso, a administração gera o link no painel.
const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const emailEnabled = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
function appOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = String(req.headers['x-forwarded-proto'] || (process.env.VERCEL ? 'https' : 'http')).split(',')[0];
  return proto + '://' + host;
}
async function createResetLink(req, userId, createdBy) {
  const token = crypto.randomBytes(32).toString('base64url');
  await q(`UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`, [userId]); // só o link mais novo vale
  await q(`INSERT INTO password_resets(token_hash, user_id, created_by, expires_at) VALUES ($1, $2, $3, now() + interval '1 hour')`, [sha256(token), userId, createdBy]);
  return appOrigin(req) + '/?redefinir=' + token;
}
async function sendResetEmail(to, name, link) {
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#141A33">
    <h2 style="color:#1F2A6B">Redefinir sua senha do Memory</h2>
    <p>Olá, ${String(name).replace(/[<>&]/g, '')}. Recebemos um pedido para trocar a senha da sua conta.</p>
    <p><a href="${link}" style="display:inline-block;background:#FF7A22;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Criar nova senha</a></p>
    <p style="color:#596080;font-size:13px">O link vale por 1 hora e pode ser usado uma vez. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p></div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject: 'Redefinir senha · Memory', html })
  });
  if (!r.ok) throw new Error('email_failed_' + r.status);
}
async function forgotPassword(req, res) {
  const b = await readJson(req);
  const email = String(b.email || '').trim().toLowerCase();
  await rateLimit('forgot-ip:' + clientIp(req), 10, 3600);
  await rateLimit('forgot:' + email, 3, 3600);
  const u = isEmail(email) ? await q1('SELECT id, name, email FROM users WHERE email = $1', [email]) : null;
  if (u && emailEnabled()) {
    try { await sendResetEmail(u.email, u.name, await createResetLink(req, u.id, null)); await audit(req, u.id, 'reset_requested'); }
    catch (e) { console.error('[memory api] e-mail de redefinição', e.message); }
  } else if (u) await audit(req, u.id, 'reset_requested', { email: false });
  // Resposta igual exista ou não a conta (não revela quem é cadastrado).
  send(res, 200, { ok: true, email: emailEnabled() });
}
async function resetPassword(req, res) {
  const b = await readJson(req);
  await rateLimit('reset-ip:' + clientIp(req), 20, 3600);
  const token = String(b.token || '');
  if (!/^[A-Za-z0-9_-]{30,80}$/.test(token)) throw bad('invalid_token', 'Link inválido. Peça um novo.');
  const r = await q1(`SELECT p.user_id, p.expires_at, p.used_at, u.email FROM password_resets p JOIN users u ON u.id = p.user_id WHERE p.token_hash = $1`, [sha256(token)]);
  if (!r || r.used_at) throw new HttpError(400, 'invalid_token', 'Este link já foi usado ou não vale mais. Peça um novo.');
  if (new Date(r.expires_at).getTime() < Date.now()) throw new HttpError(400, 'expired_token', 'Este link expirou. Peça um novo.');
  if (b.check) return send(res, 200, { ok: true, email: r.email });
  validatePassword(b.password, r.email);
  const used = await q1(`UPDATE password_resets SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL RETURNING user_id`, [sha256(token)]);
  if (!used) throw new HttpError(400, 'invalid_token', 'Este link já foi usado. Peça um novo.');
  const u = await q1('UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1 RETURNING id, email, name, token_version, created_at', [r.user_id, await hashPassword(b.password)]);
  await issueSession(req, res, u);
  await audit(req, u.id, 'password_reset');
  send(res, 200, { user: publicUser(u) });
}
async function adminResetLink(req, res, { id }) {
  const a = await requireAdmin(req, res);
  if (!isUuid(id)) throw new HttpError(404, 'not_found', 'Usuário não encontrado.');
  const u = await q1('SELECT id, email FROM users WHERE id = $1', [id]);
  if (!u) throw new HttpError(404, 'not_found', 'Usuário não encontrado.');
  const url = await createResetLink(req, u.id, a.id);
  await audit(req, a.id, 'reset_link_created', { user: u.email });
  send(res, 200, { url, expiresIn: 3600 });
}

/* ================= IA ================= */
function cleanQuestion(x) { const qq = sanitizeQuestion(x, 'q'); if (!qq) throw bad('invalid_question', 'Questão inválida.'); return qq; }

async function aiTutor(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req, 64 * 1024);
  const qq = cleanQuestion(b.question);
  const pick = Number.isInteger(b.pick) && b.pick >= 0 && b.pick < qq.o.length ? b.pick : null;
  const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-12)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user' || msgs[0].role !== 'user') throw bad('invalid_messages', 'Mensagem inválida.');
  await rateLimit('ai-min:' + u.id, 12, 60);
  await chargeAi(u.id, 1);
  await streamCompletion(res, { system: tutorSystem(qq, pick, String(b.deckTitle || 'Memory').slice(0, 80)), messages: msgs, maxTokens: 400 });
}

async function aiVariations(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req, 64 * 1024);
  const qq = cleanQuestion(b.question);
  const n = Math.min(5, Math.max(1, Number(b.n) || 3));
  await rateLimit('ai-min:' + u.id, 12, 60);
  await chargeAi(u.id, 3);
  await streamCompletion(res, { messages: [{ role: 'user', content: variationPrompt(qq, String(b.deckTitle || 'Memory').slice(0, 80), n) }], maxTokens: 900 * n });
}

async function aiQuestions(req, res) {
  const u = await requireUser(req, res);
  const b = await readJson(req, 400 * 1024);
  const material = String(b.material || '').trim().slice(0, 60000);
  if (material.length < 80) throw bad('material_short', 'O material está curto demais para gerar questões.');
  const n = Math.min(15, Math.max(3, Number(b.n) || 10));
  await rateLimit('ai-gen:' + u.id, 4, 300);
  await chargeAi(u.id, 4 + Math.ceil(n / 3));
  await streamCompletion(res, { messages: [{ role: 'user', content: buildPrompt(material, n, String(b.title || 'Meu material').slice(0, 60), String(b.focus || '').slice(0, 200)) }], maxTokens: Math.min(16000, 600 * n + 400) });
}

/* ================= Saúde ================= */
async function health(req, res) {
  let db = false;
  if (hasDatabase()) { try { await ensureSchema(); await q('SELECT 1'); db = true; } catch (e) { db = false; } }
  send(res, 200, { ok: true, service: 'memory', version: VERSION, db, ai: aiEnabled(), email: emailEnabled(), time: Date.now() });
}

/* ================= Roteador ================= */
const R = (method, path, fn) => {
  const keys = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  return { method, re, keys, fn };
};
const ROUTES = [
  R('GET', 'health', health),
  R('POST', 'auth/signup', signup),
  R('POST', 'auth/login', login),
  R('POST', 'auth/logout', logout),
  R('POST', 'auth/logout-all', logoutAll),
  R('GET', 'auth/me', me),
  R('PATCH', 'auth/me', updateProfile),
  R('DELETE', 'auth/me', deleteAccount),
  R('POST', 'auth/password', changePassword),
  R('POST', 'auth/forgot', forgotPassword),
  R('POST', 'auth/reset', resetPassword),
  R('POST', 'admin/users/:id/reset-link', adminResetLink),
  R('GET', 'export', exportData),
  R('GET', 'state', getState),
  R('PUT', 'state', putState),
  R('GET', 'decks', listDecks),
  R('PUT', 'decks/:id', putDeck),
  R('DELETE', 'decks/:id', deleteDeck),
  R('POST', 'share', createShare),
  R('GET', 'share/:code', getShare),
  R('GET', 'classes', listClasses),
  R('POST', 'classes', createClass),
  R('POST', 'classes/join', joinClass),
  R('GET', 'classes/:id', getClass),
  R('PATCH', 'classes/:id', renameClass),
  R('DELETE', 'classes/:id', deleteClass),
  R('POST', 'classes/:id/code', newJoinCode),
  R('POST', 'classes/:id/decks', addClassDeck),
  R('DELETE', 'classes/:id/decks/:deckId', removeClassDeck),
  R('DELETE', 'classes/:id/members/:userId', removeMember),
  R('POST', 'classes/:id/leave', leaveClass),
  R('GET', 'classes/:id/report', classReport),
  R('GET', 'admin/overview', adminOverview),
  R('GET', 'admin/users', adminUsers),
  R('GET', 'admin/audit', adminAudit),
  R('POST', 'ai/tutor', aiTutor),
  R('POST', 'ai/variations', aiVariations),
  R('POST', 'ai/questions', aiQuestions),
  ...EXTRA_ROUTES.map(([m, p, fn]) => R(m, p, fn))
];

export async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const path = (url.searchParams.get('route') || url.pathname.replace(/^\/api\/?/, '')).replace(/^\/+|\/+$/g, '');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const rid = crypto.randomBytes(5).toString('hex'); res.setHeader('X-Request-Id', rid);
  try {
    let allowed = false;
    for (const r of ROUTES) {
      const m = r.re.exec(path);
      if (!m) continue;
      allowed = true;
      if (r.method !== req.method) continue;
      const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]).slice(0, 80); });
      checkOrigin(req);
      if (r.fn !== health && !hasDatabase()) throw new HttpError(503, 'no_database', 'O banco de dados ainda não foi configurado.');
      return await r.fn(req, res, params);
    }
    throw allowed ? new HttpError(405, 'method_not_allowed', 'Método não permitido.') : new HttpError(404, 'not_found', 'Rota não encontrada.');
  } catch (e) {
    if (e instanceof HttpError || e.status) {
      const headers = e.extra && e.extra.retryAfter ? { 'Retry-After': String(e.extra.retryAfter) } : {};
      if (res.headersSent) { try { res.end(); } catch (x) { /* fechado */ } return; }
      return send(res, e.status, { error: e.code, message: e.message }, headers);
    }
    console.error(JSON.stringify({ level: 'error', rid, method: req.method, path, error: String((e && e.stack) || e).slice(0, 2000) }));
    if (res.headersSent) { try { res.end(); } catch (x) { /* fechado */ } return; }
    send(res, 500, { error: 'server_error', message: 'Algo deu errado no servidor. Tente de novo. (código ' + rid + ')', requestId: rid });
  }
}
