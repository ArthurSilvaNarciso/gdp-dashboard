// Código compartilhado entre o servidor (import ESM) e o app (embutido no build dentro de um IIFE).
// Sem dependências: só funções puras.

const S_DAY = 864e5;
const S_FACTOR = 19 / 81, S_DECAY = -0.5, S_FIRM = 10;
const S_PATTERNS = ['correta', 'inversao', 'generalizacao', 'restricao', 'extrapolacao', 'troca', 'calculo'];
const S_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DAYKEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const num = (v, min, max, def = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const int = (v, min, max, def = 0) => Math.round(num(v, min, max, def));
const str = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/* ---------- Saneamento do estado (o que chega do cliente nunca é confiável) ---------- */
function sanitizeState(s) {
  if (!isObj(s)) return null;
  const MAXT = 4102444800000; // 2100
  const out = { v: 2, resetAt: int(s.resetAt, 0, MAXT), cards: {}, log: {}, xp: int(s.xp, 0, 1e9), streak: { count: 0, last: null }, freezes: int(s.freezes, 0, 2), calib: {}, traps: {}, badges: {}, sims: [], totals: {}, updatedAt: int(s.updatedAt, 0, MAXT) };
  const u = isObj(s.user) ? s.user : {};
  out.user = {
    name: str(u.name, 60), persona: typeof u.persona === 'string' ? str(u.persona, 20) : null, goal: int(u.goal, 1, 100, 10),
    retrieval: u.retrieval !== false, fx: u.fx !== false, onboarded: !!u.onboarded, retention: num(u.retention, 0.8, 0.97, 0.9)
  };
  const av = sanitizeAvatar(u.avatar); if (av) out.user.avatar = av;
  if (u.avSeen) out.user.avSeen = 1;
  if (isObj(u.exam) && typeof u.exam.date === 'string' && DAYKEY_RE.test(u.exam.date)) out.user.exam = { name: str(u.exam.name, 40), date: u.exam.date };
  if (typeof u.remind === 'string' && /^\d{2}:\d{2}$/.test(u.remind)) out.user.remind = u.remind;
  if (u.push) out.user.push = 1;
  if (typeof u.uf === 'string' && /^[A-Z]{2}$/.test(u.uf)) out.user.uf = u.uf;
  const pl = sanitizePlan(u.plan); if (pl) out.user.plan = pl;
  if (isObj(u.diag) && typeof u.diag.at === 'number') out.user.diag = { at: int(u.diag.at, 0, MAXT), ok: int(u.diag.ok, 0, 50), n: int(u.diag.n, 0, 50), start: typeof u.diag.start === 'string' && ID_RE.test(u.diag.start) ? u.diag.start : null };
  const co = isObj(s.coins) ? s.coins : {}; out.coins = { earned: int(co.earned, 0, 1e9), spent: int(co.spent, 0, 1e9) };
  out.owned = {}; if (isObj(s.owned)) { let k = 0; for (const key in s.owned) if (/^[a-z]{1,12}:[a-z]{1,12}$/.test(key) && ++k <= 300) out.owned[key] = int(s.owned[key], 1, MAXT, 1); }
  if (typeof s.chest === 'string' && DAYKEY_RE.test(s.chest)) out.chest = s.chest;
  let n = 0;
  if (isObj(s.cards)) for (const id in s.cards) {
    if (!ID_RE.test(id) || ++n > 20000) continue;
    const c = s.cards[id]; if (!isObj(c)) continue;
    out.cards[id] = { n: int(c.n, 0, 1e6), ok: int(c.ok, 0, 1e6), lapses: int(c.lapses, 0, 1e6), s: num(c.s, 0, 36500), d: num(c.d, 1, 10, 5), last: int(c.last, 0, MAXT), g: int(c.g, 1, 4, 3), due: int(c.due, 0, MAXT) };
  }
  const LOGF = ['n', 'ok', 'cert', 'fixed', 'rev', 'cycles', 'tutor', 'units'];
  if (isObj(s.log)) for (const k in s.log) {
    if (!DAYKEY_RE.test(k)) continue;
    const l = s.log[k]; if (!isObj(l)) continue;
    const o = { mx: {} }; for (const f of LOGF) o[f] = int(l[f], 0, 1e6);
    if (isObj(l.mx)) for (const m in l.mx) if (ID_RE.test(m)) o.mx[m] = 1;
    out.log[k] = o;
  }
  if (isObj(s.streak)) out.streak = { count: int(s.streak.count, 0, 1e5), last: typeof s.streak.last === 'string' && DAYKEY_RE.test(s.streak.last) ? s.streak.last : null };
  for (const k of ['chute', 'acho', 'certeza']) { const c = isObj(s.calib) && isObj(s.calib[k]) ? s.calib[k] : {}; const nn = int(c.n, 0, 1e7); out.calib[k] = { n: nn, ok: int(c.ok, 0, nn) }; }
  if (isObj(s.traps)) for (const k of S_PATTERNS) if (s.traps[k] != null) out.traps[k] = int(s.traps[k], 0, 1e7);
  if (isObj(s.badges)) for (const k in s.badges) if (ID_RE.test(k)) out.badges[k] = int(s.badges[k], 1, MAXT, 1);
  if (Array.isArray(s.sims)) out.sims = s.sims.filter(isObj).slice(-50).map((x) => ({ at: int(x.at, 0, MAXT), title: str(x.title, 80), score: int(x.score, 0, 100), n: int(x.n, 0, 1000) }));
  const t = isObj(s.totals) ? s.totals : {}; out.totals = { fixed: int(t.fixed, 0, 1e7), cycles: int(t.cycles, 0, 1e7) };
  out.read = {}; if (isObj(s.read)) { let k = 0; for (const key in s.read) if (/^[A-Za-z0-9_-]{2,60}$/.test(key) && ++k <= 2000) out.read[key] = int(s.read[key], 1, MAXT, 1); }
  return out;
}
// Plano de estudo para um concurso escolhido na aba Concursos.
function sanitizePlan(p) {
  if (!isObj(p) || typeof p.cid !== 'string' || !/^[a-z0-9-]{3,60}$/.test(p.cid)) return null;
  const subjects = (Array.isArray(p.subjects) ? p.subjects : []).filter(isObj).slice(0, 20).map((x) => ({
    nome: str(x.nome, 60), topicos: (Array.isArray(x.topicos) ? x.topicos : []).filter((y) => typeof y === 'string').slice(0, 12).map((y) => str(y, 80)),
    deck: typeof x.deck === 'string' && /^[A-Za-z0-9_]{2,50}$/.test(x.deck) ? x.deck : null
  })).filter((x) => x.nome);
  return { cid: p.cid, titulo: str(p.titulo, 120), orgao: str(p.orgao, 120), sigla: str(p.sigla, 20), banca: str(p.banca, 40), uf: str(p.uf, 2),
    prova: typeof p.prova === 'string' && DAYKEY_RE.test(p.prova) ? p.prova : null, at: int(p.at, 0, 4102444800000), subjects };
}

// Avatar: só chaves conhecidas e valores curtos (o desenho é feito no app).
function sanitizeAvatar(a) {
  if (!isObj(a)) return null;
  const out = { v: 2 };
  for (const k of ['skin', 'hc', 'tc', 'bg', 'hatc', 'gc']) if (a[k] != null) out[k] = int(a[k], 0, 31);
  for (const k of ['hair', 'eyes', 'brows', 'mouth', 'beard', 'glasses', 'acc', 'top', 'hat', 'face', 'bgp']) if (typeof a[k] === 'string' && /^[a-z]{1,12}$/.test(a[k])) out[k] = a[k];
  out.blush = a.blush !== false;
  return out;
}

/* ---------- Mesclagem entre aparelhos (comutativa: a ordem não importa) ---------- */
function mergeState(a, b) {
  if (!a) return b; if (!b) return a;
  // "Zerar progresso" em um aparelho vence o que os outros ainda tinham guardado de antes.
  const ra = a.resetAt || 0, rb = b.resetAt || 0;
  if (ra !== rb) {
    const stale = ra > rb ? b : a, R = Math.max(ra, rb);
    const cards = {}; for (const id in stale.cards || {}) if ((stale.cards[id].last || 0) > R) cards[id] = stale.cards[id];
    const clean = { user: stale.user, updatedAt: stale.updatedAt, resetAt: R, cards, log: {}, coins: { earned: 0, spent: 0 }, owned: stale.owned || {}, xp: 0, streak: { count: 0, last: null }, freezes: 0, calib: {}, traps: {}, badges: {}, sims: [], totals: { fixed: 0, cycles: 0 } };
    if (ra > rb) b = clean; else a = clean;
  }
  const newer = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  const out = { v: 2 };
  out.user = Object.assign({}, newer.user, { onboarded: !!((a.user || {}).onboarded || (b.user || {}).onboarded) });
  if (!out.user.name) out.user.name = (a.user || {}).name || (b.user || {}).name || '';
  if (!out.user.persona) out.user.persona = (a.user || {}).persona || (b.user || {}).persona || null;
  out.cards = Object.assign({}, a.cards);
  for (const id in b.cards || {}) {
    const x = out.cards[id], y = b.cards[id];
    if (!x || (y.last || 0) > (x.last || 0) || ((y.last || 0) === (x.last || 0) && (y.n || 0) > (x.n || 0))) out.cards[id] = y;
  }
  out.log = {};
  for (const k of new Set([...Object.keys(a.log || {}), ...Object.keys(b.log || {})])) {
    const x = (a.log || {})[k] || {}, y = (b.log || {})[k] || {};
    const o = {}; for (const f of ['n', 'ok', 'cert', 'fixed', 'rev', 'cycles', 'tutor', 'units']) o[f] = Math.max(x[f] || 0, y[f] || 0);
    o.mx = Object.assign({}, x.mx, y.mx); out.log[k] = o;
  }
  out.xp = Math.max(a.xp || 0, b.xp || 0);
  const sa = a.streak || {}, sb = b.streak || {};
  out.streak = (sa.last || '') > (sb.last || '') ? sa : (sb.last || '') > (sa.last || '') ? sb : ((sa.count || 0) >= (sb.count || 0) ? sa : sb);
  out.streak = Object.assign({ count: 0, last: null }, out.streak);
  out.freezes = newer.freezes || 0;
  out.calib = {};
  for (const k of ['chute', 'acho', 'certeza']) { const x = (a.calib || {})[k] || { n: 0, ok: 0 }, y = (b.calib || {})[k] || { n: 0, ok: 0 }; out.calib[k] = Object.assign({}, (y.n || 0) > (x.n || 0) ? y : x); }
  out.traps = {}; for (const k of new Set([...Object.keys(a.traps || {}), ...Object.keys(b.traps || {})])) out.traps[k] = Math.max((a.traps || {})[k] || 0, (b.traps || {})[k] || 0);
  out.badges = Object.assign({}, b.badges); for (const k in a.badges || {}) out.badges[k] = out.badges[k] ? Math.min(out.badges[k], a.badges[k]) : a.badges[k];
  const sims = new Map(); for (const x of [...(a.sims || []), ...(b.sims || [])]) sims.set(x.at + '|' + x.title, x);
  out.sims = [...sims.values()].sort((x, y) => x.at - y.at).slice(-50);
  const ta = a.totals || {}, tb = b.totals || {}; out.totals = { fixed: Math.max(ta.fixed || 0, tb.fixed || 0), cycles: Math.max(ta.cycles || 0, tb.cycles || 0) };
  out.read = Object.assign({}, a.read, b.read);
  const ca = a.coins || {}, cb = b.coins || {}; out.coins = { earned: Math.max(ca.earned || 0, cb.earned || 0), spent: Math.max(ca.spent || 0, cb.spent || 0) };
  out.owned = Object.assign({}, a.owned, b.owned);
  const ch = [a.chest || '', b.chest || ''].sort()[1]; if (ch) out.chest = ch;
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  out.resetAt = Math.max(a.resetAt || 0, b.resetAt || 0);
  return out;
}

/* ---------- Saneamento de trilhas ---------- */
function sanitizeQuestion(x, id) {
  if (!isObj(x) || typeof x.q !== 'string' || !Array.isArray(x.o)) return null;
  if (x.type === 'ce') {
    const o = x.o.slice(0, 2).map((y, j) => ({ t: j ? 'Errado' : 'Certo', p: isObj(y) && S_PATTERNS.includes(y.p) ? y.p : 'troca', w: str(isObj(y) ? y.w : '', 600) }));
    const a = x.a === 0 || x.a === 1 ? x.a : -1; if (o.length !== 2 || a < 0) return null;
    o.forEach((y, j) => { if (j === a) y.p = 'correta'; else if (y.p === 'correta') y.p = 'troca'; });
    return { id, type: 'ce', topic: str(x.topic || 'Seu material', 40), c: str(x.c, 800), q: str(x.q, 500), a, src: str(x.src, 80), o };
  }
  const o = x.o.filter((y) => isObj(y) && typeof y.t === 'string' && y.t.trim()).slice(0, 5).map((y) => ({ t: str(y.t, 400), p: S_PATTERNS.includes(y.p) ? y.p : 'troca', w: str(y.w, 600) }));
  if (o.length < 3) return null;
  let a = Number.isInteger(x.a) && x.a >= 0 && x.a < o.length ? x.a : o.findIndex((y) => y.p === 'correta');
  if (a < 0) return null;
  o.forEach((y, j) => { if (j === a) y.p = 'correta'; else if (y.p === 'correta') y.p = 'troca'; });
  return { id, topic: str(x.topic || 'Seu material', 40), c: str(x.c, 800), q: str(x.q, 500), a, src: str(x.src, 80), o };
}
function sanitizeDeck(d, opts = {}) {
  if (!isObj(d)) return null;
  const id = opts.id || d.id;
  if (typeof id !== 'string' || !/^u[A-Za-z0-9_]{1,48}$/.test(id)) return null;
  const qs = [];
  const seen = new Set();
  for (const x of Array.isArray(d.questions) ? d.questions.slice(0, 400) : []) {
    const qid = opts.renumber ? id + '_' + qs.length : x && x.id;
    if (typeof qid !== 'string' || !ID_RE.test(qid) || seen.has(qid)) continue;
    const q = sanitizeQuestion(x, qid); if (q) { qs.push(q); seen.add(qid); }
  }
  if (!qs.length) return null;
  const colors = ['navy', 'orange', 'green', 'pink', 'blue', 'yellow', 'purple'];
  return {
    id, title: str(d.title, 60).trim() || 'Trilha', subtitle: str(d.subtitle, 60), blurb: str(d.blurb, 300), color: colors.includes(d.color) ? d.color : 'navy',
    tag: str(d.tag, 24), custom: true, createdAt: int(d.createdAt, 0, 4102444800000, Date.now()), source: str(d.source, 120), questions: qs, lessons: sanitizeLessons(d.lessons, id)
  };
}

/* ---------- Métricas ---------- */
function s_retr(c, at) { if (!c || !c.s) return 0; const t = Math.max(0, (at - c.last) / S_DAY); return Math.pow(1 + S_FACTOR * t / c.s, S_DECAY); }
function s_dayNum(k) { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / S_DAY); }
function s_today(tz = 'America/Sao_Paulo', at = Date.now()) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at)); } catch (e) { return new Date(at).toISOString().slice(0, 10); }
}
// Resumo compacto salvo junto do estado (usado em turmas e ranking).
function summarize(s, at = Date.now()) {
  const cards = (s && s.cards) || {}, log = (s && s.log) || {};
  let seen = 0, firm = 0, rsum = 0, last = 0, due = 0;
  for (const id in cards) { const c = cards[id]; if (!c.s) continue; seen++; rsum += s_retr(c, at); if (c.s >= S_FIRM && c.g > 1) firm++; if (c.last > last) last = c.last; if (c.due <= at) due++; }
  let answered = 0, ok = 0; const days = {};
  const keys = Object.keys(log).sort();
  for (const k of keys) { answered += log[k].n || 0; ok += log[k].ok || 0; }
  for (const k of keys.slice(-35)) if (log[k].n) days[k] = [log[k].n || 0, log[k].ok || 0];
  const traps = Object.entries((s && s.traps) || {}).filter(([k]) => k !== 'correta').sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => [k, v]);
  return { avatar: (s && s.user && s.user.avatar) || null, seen, firm, due, memory: seen ? Math.round((rsum / seen) * 100) : null, answered, ok, xp: (s && s.xp) || 0, streak: (s && s.streak) || { count: 0, last: null }, freezes: (s && s.freezes) || 0, lastActive: last || null, days, traps, sims: ((s && s.sims) || []).slice(-5), at };
}
// Finaliza o resumo para "agora" (sequência viva, últimos 7 dias, memória estimada no momento da coleta).
function finalizeSummary(sm, at = Date.now()) {
  if (!sm || !sm.at) return { answered: 0, ok: 0, accuracy: null, streak: 0, week: 0, weekOk: 0, xp: 0, level: 1, memory: null, firm: 0, seen: 0, due: 0, lastActive: null, traps: [] };
  const today = s_dayNum(s_today(undefined, at));
  let week = 0, weekOk = 0;
  for (const k in sm.days || {}) if (today - s_dayNum(k) < 7) { week += sm.days[k][0]; weekOk += sm.days[k][1]; }
  let streak = 0; const st = sm.streak || {};
  if (st.last) { const gap = today - s_dayNum(st.last); streak = gap <= 1 || gap - 1 <= (sm.freezes || 0) ? st.count || 0 : 0; }
  return {
    answered: sm.answered, ok: sm.ok, accuracy: sm.answered ? Math.round((sm.ok / sm.answered) * 100) : null, streak, week, weekOk,
    avatar: sm.avatar || null, xp: sm.xp, level: Math.floor(Math.sqrt(sm.xp / 40)) + 1, memory: sm.memory, firm: sm.firm, seen: sm.seen, due: sm.due, lastActive: sm.lastActive, traps: sm.traps || [], sims: sm.sims || []
  };
}
function deckProgress(s, qids, at = Date.now()) {
  const cards = (s && s.cards) || {}; let m = 0, l = 0, rsum = 0, n = 0, ok = 0;
  for (const id of qids) { const c = cards[id]; if (!c || !c.s) continue; if (c.s >= S_FIRM && c.g > 1) m++; else l++; rsum += s_retr(c, at); n += c.n || 0; ok += c.ok || 0; }
  const t = qids.length, seenN = m + l;
  return { t, seen: seenN, firm: m, mem: seenN ? Math.round((rsum / seenN) * 100) : null, pct: t ? Math.round(((m + l * 0.4) / t) * 100) : 0, accuracy: n ? Math.round((ok / n) * 100) : null };
}

/* ---------- Prompts da IA (mesmo texto no servidor e no modo Claude) ---------- */
function questionContext(q, pick) {
  return `Caso: ${q.c}\nPergunta: ${q.q}\n` + q.o.map((o, i) => `${S_LETTERS[i]}) ${o.t}${i === q.a ? ' [CORRETA]' : ''} — explicação: ${o.w}`).join('\n') +
    (pick != null ? `\nO aluno marcou: ${S_LETTERS[pick]}${pick === q.a ? ' (acertou)' : ' (errou)'}` : '');
}
function tutorSystem(q, pick, deckTitle) {
  return `Você é o tutor do Memory, um app de estudo. Ajude o aluno a entender esta questão da trilha "${deckTitle}".\n${questionContext(q, pick)}\n\nRegras: responda em português do Brasil, em no máximo 110 palavras, com linguagem simples e direta, como um professor paciente. Sem títulos nem listas longas. Use **negrito** só no ponto-chave. Se o aluno pedir um macete, crie um curto e memorável. Não invente fatos fora do conteúdo da questão.`;
}
function variationPrompt(q, deckTitle, n) {
  return `Você é o motor de questões do Memory. O aluno errou a questão abaixo, da trilha "${deckTitle}". Crie ${n} novas questões que treinem EXATAMENTE o mesmo conceito, cada uma com um caso diferente e realista, para fixar o ponto por outros ângulos. Não repita o caso original.\n\nQUESTÃO ORIGINAL:\n${questionContext(q, null)}\n\nRegras: português do Brasil; 4 alternativas; exatamente uma com "p":"correta"; as erradas usam um destes padrões: "inversao", "generalizacao", "restricao", "extrapolacao", "troca", "calculo"; "w" explica em 1 a 2 frases por que a alternativa está certa ou errada; "a" é o índice da correta (varie a posição); "topic" com até 4 palavras; "src" igual ou semelhante ao da original (${q.src || 'trilha ' + deckTitle}).\n\nResponda SOMENTE com um array JSON:\n[{"topic":"...","c":"...","q":"...","a":0,"src":"...","o":[{"t":"...","p":"correta","w":"..."},{"t":"...","p":"troca","w":"..."},{"t":"...","p":"generalizacao","w":"..."},{"t":"...","p":"inversao","w":"..."}]}]`;
}
function buildPrompt(material, n, title, focus) {
  return `Você é o motor de questões do Memory, um app de estudo baseado em prática de recuperação, feedback imediato e engenharia reversa de pegadinhas.

Com base EXCLUSIVAMENTE no material abaixo, crie ${n} questões de múltipla escolha em português do Brasil.

Regras:
- Cada questão começa com um caso curto e realista (campo "c", 1 a 3 frases) que aplica o conteúdo a uma situação prática. Depois vem a pergunta (campo "q").
- Exatamente 4 alternativas (campo "o"). Cada uma tem "t" (texto, até 160 caracteres), "p" (padrão) e "w" (por que está certa ou errada, 1 a 2 frases, apoiadas no material).
- Exatamente uma alternativa correta, com "p": "correta". As erradas devem ser plausíveis e usar um destes padrões de pegadinha: "inversao" (troca o sentido ou a ordem), "generalizacao" (transforma regra com exceção em absoluta), "restricao" (acrescenta condição que não existe), "extrapolacao" (vai além do que o material diz), "troca" (usa conceito vizinho no lugar do correto), "calculo" (erro de procedimento ou de conta).
- "a" é o índice (0 a 3) da alternativa correta. Varie a posição da correta entre as questões.
- "topic": assunto em até 4 palavras. "src": onde está no material, por exemplo "p. 12" quando houver marcação [p. N]; senão, o nome da seção.
- Cubra partes diferentes do material e priorize conceitos que costumam ser cobrados. Não pergunte sobre detalhes irrelevantes, como números de página ou dados de capa.
- Não invente fatos que não estejam no material.${focus ? '\n- Foco pedido pelo aluno: ' + focus : ''}

Responda SOMENTE com um array JSON, sem texto antes ou depois, neste formato:
[{"topic":"...","c":"...","q":"...","a":0,"src":"p. 3","o":[{"t":"...","p":"correta","w":"..."},{"t":"...","p":"troca","w":"..."},{"t":"...","p":"generalizacao","w":"..."},{"t":"...","p":"inversao","w":"..."}]}]

MATERIAL: ${title}
<<<
${material}
>>>`;
}
// Extrai o array JSON de uma resposta de texto (tolerante a texto antes/depois e a cercas de código).
function extractJsonArray(text) {
  const t = String(text || '');
  const i = t.indexOf('['), j = t.lastIndexOf(']');
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
}

// Aulas (texto curto e estruturado) de trilhas próprias ou geradas para um concurso.
function sanitizeLessons(L, deckId) {
  if (!Array.isArray(L)) return [];
  const sl = (a, n, len) => (Array.isArray(a) ? a : []).filter((y) => typeof y === 'string' && y.trim()).slice(0, n).map((y) => str(y, len));
  return L.filter(isObj).slice(0, 12).map((l, i) => ({
    id: deckId + '-a' + (i + 1), title: str(l.title, 70) || 'Aula ' + (i + 1), mins: int(l.mins, 2, 20, 6), qids: sl(l.qids, 12, 60), intro: str(l.intro, 400),
    sections: (Array.isArray(l.sections) ? l.sections : []).filter(isObj).slice(0, 7).map((x) => ({ h: str(x.h, 90), p: sl(x.p, 5, 600), list: sl(x.list, 8, 200) })).filter((x) => x.h && x.p.length),
    example: isObj(l.example) ? { c: str(l.example.c, 500), q: str(l.example.q, 300), a: str(l.example.a, 600) } : null,
    traps: sl(l.traps, 5, 300), summary: sl(l.summary, 5, 220), src: str(l.src, 160)
  })).filter((l) => l.sections.length);
}
// Material completo de uma matéria de edital: aulas + questões no formato do Memory.
function disciplinePrompt({ concurso, cargo, banca, disciplina, topicos, nAulas = 4, nQ = 12, ce = false }) {
  return `Você é professor especialista em concursos e autor do Memory, um app de estudo por prática de recuperação.

Monte o material de estudo da disciplina "${disciplina}" para o concurso "${concurso}"${cargo ? `, cargo ${cargo}` : ''}${banca ? `, banca ${banca}` : ''}.
${topicos && topicos.length ? `Conteúdo do edital: ${topicos.join('; ')}.` : 'Use o conteúdo que essa banca costuma cobrar nessa disciplina para esse tipo de cargo.'}

Entregue:
1. "aulas": ${nAulas} aulas curtas, na ordem ideal de estudo. Cada aula: "title" (até 60 caracteres), "mins" (4 a 8), "intro" (1 frase com o que a pessoa vai dominar), "sections" (3 a 4 seções com "h" e "p" = 1 a 3 parágrafos curtos, e "list" opcional com itens), "example" ({"c": situação, "q": pergunta, "a": resposta comentada}), "traps" (2 pegadinhas típicas da banca e como desarmar), "summary" (3 ideias-chave), "src" (lei com artigos, norma ou referência).
2. "questoes": ${nQ} questões inéditas no estilo da banca, cobrindo as aulas. Cada questão: "topic" (até 4 palavras), "c" (caso realista de 1 a 3 frases), "q" (pergunta), "src" (fonte exata), "a" (índice da correta), "o" (alternativas com "t", "p" e "w").
${ce ? `   - Faça ${Math.round(nQ / 2)} delas no formato Certo/Errado: "type": "ce", "q" é uma afirmação terminada em ponto, "o" tem exatamente 2 itens [{"t":"Certo",...},{"t":"Errado",...}] e "a" é 0 (certo) ou 1 (errado). As demais com 4 alternativas.\n` : '   - Todas com exatamente 4 alternativas.\n'}   - "p" da correta é "correta"; as erradas usam um padrão de pegadinha: "inversao", "generalizacao", "restricao", "extrapolacao", "troca" ou "calculo". "w" explica em 1 a 2 frases por que a alternativa está certa ou errada. Varie a posição da correta.

Regras: português do Brasil; precisão absoluta (cite a lei e o artigo exato quando for direito; nada de jurisprudência controversa); nada de emojis. Responda SOMENTE com um objeto JSON: {"aulas":[...],"questoes":[...]}`;
}
function extractJsonObject(text) {
  const t = String(text || ''); const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
}

export { sanitizeAvatar, sanitizeState, mergeState, sanitizeQuestion, sanitizeDeck, summarize, finalizeSummary, deckProgress, questionContext, tutorSystem, variationPrompt, buildPrompt, extractJsonArray, s_today, sanitizeLessons, sanitizePlan, disciplinePrompt, extractJsonObject };
