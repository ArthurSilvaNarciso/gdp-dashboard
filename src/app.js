/* ================= Utilidades ================= */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dayNum = (k) => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const plural = (n, s, p) => n + ' ' + (n === 1 ? s : p);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mmss = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); return Math.floor(t / 60) + ':' + pad(t % 60); };
const richText = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');

const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  decks: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chart: '<path d="M5 20v-8M12 20V5M19 20v-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.2 1.5 1.8 2.5 2 .2-2.5-.3-4.8.5-7Z"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  upload: '<path d="M12 16V4m0 0-5 5m5-5 5 5M4 20h16"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  x: '<path d="M7 7l10 10M17 7 7 17"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  alert: '<path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6"/>'
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const logo = () => `<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="7" fill="var(--navy-2)"/><circle cx="15" cy="12" r="7" fill="var(--orange)"/><circle cx="9" cy="12" r="7" fill="var(--logo-mid)" clip-path="url(#lgB)"/></svg>`;

/* ================= Motor de memória (inspirado no FSRS, o algoritmo do Anki) ================= */
const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5, FACTOR = 19 / 81, FIRM = 10;
const GRADE = { chute: 2, acho: 3, certeza: 4 };
const D0 = (g) => clamp(W[4] - (g - 3) * W[5], 1, 10);
function retr(c, at = Date.now()) {
  if (!c || !c.s) return 0;
  const t = Math.max(0, (at - c.last) / DAY);
  return Math.pow(1 + FACTOR * t / c.s, DECAY);
}
function ivlDays(s) { const r = S.user.retention || 0.9; return (s / FACTOR) * (Math.pow(r, 1 / DECAY) - 1); }
function schedule(id, g) {
  const now = Date.now();
  let c = S.cards[id];
  if (!c || !c.s) {
    c = { n: 0, ok: 0, lapses: 0, s: W[g - 1], d: D0(g) };
  } else {
    const r = retr(c, now), d = c.d;
    const nd = clamp(W[7] * D0(4) + (1 - W[7]) * (d - W[6] * (g - 3)), 1, 10);
    let ns;
    if (g === 1) { ns = Math.min(c.s, W[11] * Math.pow(d, -W[12]) * (Math.pow(c.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))); }
    else { ns = c.s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(c.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1)); }
    c.s = Math.max(0.1, ns); c.d = nd;
  }
  if (g === 1) c.lapses = (c.lapses || 0) + 1;
  c.n++; if (g > 1) c.ok++;
  c.last = now; c.g = g;
  const days = g === 1 ? Math.min(ivlDays(c.s), 0.5) : Math.max(1, Math.round(ivlDays(c.s)));
  c.due = now + days * DAY;
  S.cards[id] = c;
  return { c, days };
}

/* ================= Estado ================= */
const LS_STATE = 'memory.state.v1';
const LS_DECKS = 'memory.decks.v1';
function blankState() {
  return {
    v: 2,
    user: { name: '', persona: null, goal: 10, retrieval: true, fx: true, onboarded: false, retention: 0.9 },
    cards: {}, log: {}, xp: 0, streak: { count: 0, last: null }, freezes: 0,
    calib: { chute: { n: 0, ok: 0 }, acho: { n: 0, ok: 0 }, certeza: { n: 0, ok: 0 } },
    traps: {}, badges: {}, sims: [], totals: { fixed: 0, cycles: 0 }, updatedAt: 0
  };
}
function migrate(s) {
  const b = blankState();
  const out = Object.assign(b, s, { user: Object.assign(b.user, s.user || {}), totals: Object.assign(b.totals, s.totals || {}) });
  if ((s.v || 1) < 2) {
    const OLD = [0, 1, 3, 7, 16, 35, 90];
    for (const id in out.cards) {
      const c = out.cards[id];
      if (c.s) continue;
      c.s = Math.max(0.5, OLD[c.b] || 0.5); c.d = 5; c.lapses = c.n - c.ok > 0 ? 1 : 0;
      c.last = c.last || Date.now(); c.g = c.b === 0 ? 1 : 3; delete c.b;
    }
    out.v = 2;
  }
  return out;
}
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) {
  try { localStorage.setItem(k, v); }
  catch (e) {
    // Armazenamento cheio ou bloqueado (aba anônima): avisa uma vez, sem travar o app.
    if (!lsSet.warned && e && /quota|exceeded/i.test(String(e.name) + String(e.message))) { lsSet.warned = true; setTimeout(() => notify('O armazenamento deste aparelho está cheio. Crie uma conta para não perder o progresso.'), 0); }
  }
}
function loadState() { try { const raw = lsGet(LS_STATE); if (raw) return migrate(JSON.parse(raw)); } catch (e) {} return blankState(); }
function loadDecks() { try { const raw = lsGet(LS_DECKS); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }

var API = null, CLASS_DECKS = []; // definidos em server.js
let S = loadState();
let CUSTOM = loadDecks();
let QINDEX = {};
function reindex() { QINDEX = {}; for (const d of allDecks()) for (const q of d.questions) QINDEX[q.id] = { q, deck: d }; }
const allDecks = () => [...CUSTOM, ...(CLASS_DECKS || []), ...BUILTIN_DECKS];
const deckById = (id) => allDecks().find((d) => d.id === id);
reindex();

const ui = { tab: 'home', deck: null, onb: 0, session: null, sheet: null, confirmDelete: false, confirmReset: false };
const imp = { file: null, text: '', pages: 0, title: '', qty: 10, focus: '', reading: false, busy: false, progress: 0, error: '', done: null, abort: null, note: '', code: '', codeErr: '' };
let SAMPLE = null, sampleChecked = false;

/* ================= Persistência ================= */
const cloud = { col: null, status: 'local', timer: null, writing: false, again: false };
function persist() {
  S.updatedAt = Date.now();
  lsSet(LS_STATE, JSON.stringify(S));
  if (cloud.col) { clearTimeout(cloud.timer); cloud.timer = setTimeout(pushState, 1200); }
  serverSave();
}
async function pushState() {
  if (!cloud.col) return;
  if (cloud.writing) { cloud.again = true; return; }
  cloud.writing = true;
  try { await cloud.col.doc('state').set({ json: JSON.stringify(S), updatedAt: S.updatedAt }); cloud.status = 'cloud'; } catch (e) { cloud.status = 'local'; }
  cloud.writing = false;
  if (cloud.again) { cloud.again = false; pushState(); }
}
function saveDecksLocal() { lsSet(LS_DECKS, JSON.stringify(CUSTOM)); }
const deckWrites = {};
function pushDeck(deck) {
  serverPutDeck(deck);
  if (!cloud.col) return;
  const prev = deckWrites[deck.id] || Promise.resolve();
  deckWrites[deck.id] = prev.then(() => cloud.col.doc(deck.id).set({ json: JSON.stringify(deck), createdAt: deck.createdAt })).catch(() => {});
}
async function removeDeckRemote(id) { serverDeleteDeck(id); if (!cloud.col) return; try { await cloud.col.doc(id).delete(); } catch (e) {} }
async function initCloud() {
  try {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    const [user, db] = await Promise.all([window.claude.use('user'), window.claude.use('db')]);
    if (!user || !db) return;
    const id = await user.id();
    if (!id) return;
    const col = db.collection('data/users/' + id);
    const snap = await Promise.race([col.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
    let remote = null; const remoteDecks = [];
    for (const d of snap.docs) {
      if (!d.exists) continue;
      const body = d.data() || {};
      try {
        if (d.id === 'state') remote = { s: JSON.parse(body.json), at: body.updatedAt || 0 };
        else if (d.id.startsWith('u')) remoteDecks.push(JSON.parse(body.json));
      } catch (e) {}
    }
    cloud.col = col; cloud.status = 'cloud';
    let changed = false;
    if (remote && remote.at > (S.updatedAt || 0)) { S = migrate(remote.s); lsSet(LS_STATE, JSON.stringify(S)); changed = true; }
    else if (S.updatedAt) pushState();
    const byId = new Map(CUSTOM.map((d) => [d.id, d]));
    for (const d of remoteDecks) {
      const local = byId.get(d.id);
      if (!local) { CUSTOM.push(d); changed = true; }
      else if ((d.questions || []).length > local.questions.length) { Object.assign(local, d); changed = true; }
    }
    const remoteIds = new Set(remoteDecks.map((d) => d.id));
    for (const d of CUSTOM) if (!remoteIds.has(d.id)) pushDeck(d);
    CUSTOM.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (changed) { saveDecksLocal(); reindex(); }
    if (!ui.session) render();
  } catch (e) { cloud.status = 'local'; }
}

/* ================= Métricas ================= */
const cardOf = (id) => S.cards[id];
const seenIds = () => Object.keys(S.cards).filter((id) => QINDEX[id] && S.cards[id].s);
function deckStats(deck) {
  const now = Date.now(); let m = 0, l = 0, f = 0, due = 0, rsum = 0;
  for (const q of deck.questions) {
    const c = cardOf(q.id);
    if (!c || !c.s) { f++; continue; }
    if (c.s >= FIRM && c.g > 1) m++; else l++;
    if (c.due <= now) due++;
    rsum += retr(c, now);
  }
  const t = deck.questions.length, seen = m + l;
  return { t, m, l, f, due, mem: seen ? Math.round((rsum / seen) * 100) : null, pct: t ? Math.round(((m + l * 0.4) / t) * 100) : 0 };
}
function memoryNow(at = Date.now()) { const ids = seenIds(); if (!ids.length) return null; return ids.reduce((a, id) => a + retr(S.cards[id], at), 0) / ids.length; }
function dueIds() { const now = Date.now(); return seenIds().filter((id) => S.cards[id].due <= now).sort((a, b) => retr(S.cards[a]) - retr(S.cards[b])); }
function nextDue() { let min = Infinity; for (const id of seenIds()) min = Math.min(min, S.cards[id].due); return min; }
function errorIds() { return seenIds().filter((id) => S.cards[id].g === 1 || (S.cards[id].lapses > 0 && retr(S.cards[id]) < 0.97)).sort((a, b) => retr(S.cards[a]) - retr(S.cards[b])); }
const LOG0 = () => ({ n: 0, ok: 0, cert: 0, fixed: 0, rev: 0, cycles: 0, tutor: 0, units: 0, mx: {} });
function todayLog() { const k = dayKey(); S.log[k] = Object.assign(LOG0(), S.log[k] || {}); return S.log[k]; }
function peekToday() { return Object.assign(LOG0(), S.log[dayKey()] || {}); }
const totalAnswered = () => Object.values(S.log).reduce((a, x) => a + (x.n || 0), 0);
function level() { return Math.floor(Math.sqrt(S.xp / 40)) + 1; }
function levelRange(lv) { return [40 * (lv - 1) ** 2, 40 * lv ** 2]; }
function personaDecks() { const p = PERSONAS.find((x) => x.id === S.user.persona); return [...new Set([...CUSTOM.map((d) => d.id), ...(API ? classDeckIds() : []), ...(p ? p.decks : ['neuro'])])].filter((id) => deckById(id)); }
function whenText(ts) { if (ts <= Date.now()) return 'agora'; const d = Math.round((ts - Date.now()) / DAY); if (d <= 0) return 'hoje'; if (d === 1) return 'amanhã'; return 'em ' + d + ' dias'; }

/* ---------- Sequência com protetor (inspirado no Duolingo) ---------- */
function bumpStreak() {
  const t = dayKey(); const last = S.streak.last;
  if (last === t) return;
  const gap = last ? dayNum(t) - dayNum(last) : 99;
  if (gap === 1) S.streak.count++;
  else if (gap > 1 && gap - 1 <= (S.freezes || 0) && S.streak.count > 0) { S.freezes -= gap - 1; S.streak.count++; notify('Protetor de sequência usado. Sua sequência continua.'); }
  else S.streak.count = 1;
  S.streak.last = t;
  if (S.streak.count % 7 === 0 && (S.freezes || 0) < 2) { S.freezes = (S.freezes || 0) + 1; notify('Você ganhou um protetor de sequência.'); }
}
function streakNow() {
  if (!S.streak.last) return 0;
  const gap = dayNum(dayKey()) - dayNum(S.streak.last);
  return gap <= 1 || gap - 1 <= (S.freezes || 0) ? S.streak.count : 0;
}

/* ---------- Missões diárias ---------- */
function missions() {
  const L = peekToday(); const g = S.user.goal; const certT = Math.min(5, Math.ceil(g / 2));
  const doy = dayNum(dayKey());
  const pool = [
    { id: 'fix', l: 'Transforme 1 erro em acerto no mesmo ciclo', v: L.fixed, t: 1 },
    { id: 'rev', l: 'Faça 3 revisões pendentes', v: L.rev, t: 3, need: () => dueIds().length + L.rev >= 3 },
    { id: 'cyc', l: 'Conclua 2 ciclos', v: L.cycles, t: 2 },
    { id: 'tut', l: 'Tire uma dúvida com o tutor ou treine um erro', v: L.tutor, t: 1, need: () => aiReady() }
  ].filter((m) => !m.need || m.need());
  const third = pool[doy % pool.length];
  return [
    { id: 'goal', l: 'Responda ' + g + ' questões', v: L.n, t: g },
    { id: 'cert', l: 'Acerte ' + certT + ' com “Tenho certeza”', v: L.cert, t: certT },
    third
  ].map((m) => Object.assign(m, { done: m.v >= m.t }));
}
function checkMissions() {
  const L = todayLog();
  for (const m of missions()) if (m.done && !L.mx[m.id]) { L.mx[m.id] = 1; S.xp += 20; earnCoins(5); notify('Missão concluída · +20 XP · +5 moedas'); }
}

/* ---------- Conquistas ---------- */
const BADGES = [
  { id: 'first', l: 'Primeiro ciclo', d: 'Concluiu o primeiro ciclo de estudo.', ok: () => S.totals.cycles >= 1 },
  { id: 'streak3', l: '3 dias seguidos', d: 'Estudou três dias em sequência.', ok: () => S.streak.count >= 3 },
  { id: 'streak7', l: 'Semana completa', d: 'Sete dias seguidos de estudo.', ok: () => S.streak.count >= 7 },
  { id: 'q100', l: '100 questões', d: 'Respondeu 100 questões.', ok: () => totalAnswered() >= 100 },
  { id: 'fixer', l: 'Corretor', d: 'Transformou 10 erros em acerto no mesmo ciclo.', ok: () => S.totals.fixed >= 10 },
  { id: 'calib', l: 'Bem calibrado', d: '20 respostas “tenho certeza” com 90% de acerto.', ok: () => S.calib.certeza.n >= 20 && S.calib.certeza.ok / S.calib.certeza.n >= 0.9 },
  { id: 'firm25', l: '25 firmes', d: '25 questões com memória firme (10+ dias).', ok: () => seenIds().filter((id) => S.cards[id].s >= FIRM && S.cards[id].g > 1).length >= 25 },
  { id: 'sim70', l: 'Aprovado', d: 'Fez 70% ou mais em um simulado.', ok: () => (S.sims || []).some((x) => x.score >= 70) },
  { id: 'import', l: 'Material próprio', d: 'Criou a primeira trilha com seu material.', ok: () => CUSTOM.some((d) => d.id !== 'ureforco') },
  { id: 'streak30', l: '30 dias', d: 'Um mês inteiro de constância.', ok: () => S.streak.count >= 30 }
];

function badgeProgress(id) {
  const firm = seenIds().filter((x) => S.cards[x].s >= FIRM && S.cards[x].g > 1).length;
  const best = Math.max(0, ...(S.sims || []).map((x) => x.score));
  const m = { first: [S.totals.cycles, 1], streak3: [S.streak.count, 3], streak7: [S.streak.count, 7], q100: [totalAnswered(), 100], fixer: [S.totals.fixed, 10],
    calib: [S.calib.certeza.n, 20], firm25: [firm, 25], sim70: [best, 70], import: [CUSTOM.filter((d) => d.id !== 'ureforco').length, 1], streak30: [S.streak.count, 30] }[id] || [0, 1];
  return { v: m[0] || 0, t: m[1] };
}
function checkBadges() {
  S.badges = S.badges || {};
  for (const b of BADGES) if (!S.badges[b.id] && b.ok()) { S.badges[b.id] = Date.now(); earnCoins(20); notify('Conquista: ' + b.l + ' · +20 moedas'); }
}

/* ================= Efeitos e avisos ================= */
let actx = null;
function tone(ok) {
  if (!S.user.fx) return;
  try { navigator.vibrate && navigator.vibrate(ok ? 18 : [30, 60, 30]); } catch (e) {}
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    (ok ? [660, 990] : [300, 220]).forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t0 = actx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + 0.25);
    });
  } catch (e) {}
}
const toastQ = [];
function notify(msg) { toastQ.push(msg); if (toastQ.length === 1) showToast(); }
function showToast() {
  const old = document.querySelector('.toast'); if (old) old.remove();
  if (!toastQ.length) return;
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = toastQ[0];
  $('#app').appendChild(el);
  setTimeout(() => { toastQ.shift(); showToast(); }, 2200);
}
const toast = notify;

/* ================= Sessões ================= */
function startCycle({ decks = [], ids = null, size = 10, title = 'Ciclo', reviewOnly = false, mode = 'learn', unit = null, diag = false, cespe = false }) {
  let list;
  const now = Date.now();
  if (ids) list = ids.slice(0, size);
  else {
    const pool = [];
    for (const id of decks) { const d = deckById(id); if (d) pool.push(...d.questions); }
    const seen = pool.filter((q) => S.cards[q.id] && S.cards[q.id].s);
    const due = seen.filter((q) => S.cards[q.id].due <= now).sort((a, b) => retr(S.cards[a.id]) - retr(S.cards[b.id]));
    const fresh = shuffle(pool.filter((q) => !(S.cards[q.id] && S.cards[q.id].s)));
    const rest = seen.filter((q) => S.cards[q.id].due > now).sort((a, b) => retr(S.cards[a.id]) - retr(S.cards[b.id]));
    const qs = mode === 'sim' ? shuffle(pool) : reviewOnly ? due : [...due, ...fresh, ...rest];
    list = [...new Set(qs.map((q) => q.id))].slice(0, size);
  }
  if (!list.length) { render(); toast(reviewOnly ? 'Nenhuma revisão pendente agora.' : 'Não há questões para este ciclo.'); return; }
  const dueSet = new Set(list.filter((id) => S.cards[id] && S.cards[id].due <= now));
  ui.session = { mode, title, params: { decks, ids, size, title, reviewOnly, mode, unit, diag, cespe }, queue: list, i: 0, results: [], requeued: {}, xp: 0, dueSet, added: 0, combo: 0, maxCombo: 0, coins: 0, streak0: S.streak.last === dayKey() ? -1 : S.streak.count };
  if (mode === 'sim') { ui.session.answers = {}; ui.session.start = now; ui.session.deadline = now + list.length * (cespe ? 60e3 : 90e3); startSimTimer(); }
  setupQuestion();
  render();
  $('#view').scrollTop = 0;
}
function setupQuestion() {
  const s = ui.session; const q = QINDEX[s.queue[s.i]].q;
  s.phase = s.mode === 'sim' ? 'sim' : (S.user.retrieval ? 'desafio' : 'esforco');
  s.pick = null; s.conf = null; s.order = q.type === 'ce' ? [0, 1] : shuffle(q.o.map((_, i) => i)); s.t0 = Date.now();
  s.tutor = { msgs: [], busy: false, live: '', err: '' }; s.train = { busy: false, done: 0, err: '' };
  clearInterval(s.tick);
  if (s.phase === 'desafio') s.tick = setInterval(() => { const el = document.getElementById('recall-timer'); if (el) el.textContent = Math.round((Date.now() - s.t0) / 1000) + 's pensando'; }, 1000);
}
function answer(conf) {
  const s = ui.session; const id = s.queue[s.i]; const q = QINDEX[id].q;
  if (s.pick == null) return;
  clearInterval(s.tick);
  const correct = s.pick === q.a;
  const second = !!s.requeued[id] && s.results.some((r) => r.id === id);
  const { c, days } = schedule(id, correct ? GRADE[conf] : 1);
  S.calib[conf].n++; if (correct) S.calib[conf].ok++;
  const trap = correct ? null : q.o[s.pick].p;
  if (trap) S.traps[trap] = (S.traps[trap] || 0) + 1;
  const L = todayLog(); L.n++; if (correct) L.ok++; if (correct && conf === 'certeza') L.cert++;
  if (s.dueSet.has(id) && !second) L.rev++;
  if (second && correct) { L.fixed++; S.totals.fixed++; }
  bumpStreak();
  let gain = correct ? (conf === 'certeza' ? 15 : conf === 'acho' ? 12 : 8) : 3;
  if (second) gain = Math.round(gain / 2);
  // Combo: acertos seguidos rendem bônus (recompensa por manter o foco).
  if (correct && !second) { s.combo = (s.combo || 0) + 1; s.maxCombo = Math.max(s.maxCombo || 0, s.combo); } else if (!correct) s.combo = 0;
  s.bonus = correct && s.combo >= 3 ? Math.min(10, (s.combo - 2) * 2) : 0; gain += s.bonus;
  if (correct && !second) { const c0 = conf === 'certeza' ? 2 : 1; earnCoins(c0); s.coins = (s.coins || 0) + c0; }
  S.xp += gain; s.xp += gain;
  let requeue = false;
  if (!correct && !s.requeued[id]) { s.queue.push(id); s.requeued[id] = true; requeue = true; }
  s.results.push({ id, correct, conf, time: Date.now() - s.t0, trap, second });
  Object.assign(s, { conf, correct, gain, requeue, card: c, days, phase: 'feedback' });
  checkMissions(); checkBadges();
  persist(); tone(correct); render();
}
function nextQuestion() {
  const s = ui.session;
  s.i++;
  if (s.i >= s.queue.length) finishCycle();
  else { setupQuestion(); render(); }
  $('#view').scrollTop = 0;
}
function finishCycle() {
  const s = ui.session; clearInterval(s.tick); clearInterval(s.simTick);
  s.phase = 'summary';
  const L = todayLog(); L.cycles++; S.totals.cycles++;
  earnCoins(5); s.coins = (s.coins || 0) + 5;
  checkUnit(s);
  checkMissions(); checkBadges(); persist(); render();
  if (s.streak0 !== -1 && S.streak.last === dayKey()) setTimeout(() => { if (ui.session === s) streakSheet(S.streak.count); }, REDUCED ? 0 : 650);
}

/* ---------- Simulado (inspirado em Qconcursos/TEC) ---------- */
function startSimTimer() {
  const s = ui.session;
  s.simTick = setInterval(() => {
    const left = s.deadline - Date.now();
    const el = document.getElementById('sim-timer');
    if (el) { el.textContent = mmss(left); el.classList.toggle('low', left < 60e3); }
    if (left <= 0) finishSim();
  }, 500);
}
function finishSim() {
  const s = ui.session; if (!s || s.mode !== 'sim' || s.phase === 'summary') return;
  clearInterval(s.simTick);
  const L = todayLog();
  let ok = 0;
  s.queue.forEach((id) => {
    const q = QINDEX[id].q; const a = s.answers[id];
    const correct = a != null && a === q.a;
    if (correct) ok++;
    schedule(id, correct ? 3 : a == null && s.params.cespe ? 2 : 1);
    if (a != null) { L.n++; if (correct) L.ok++; if (!correct) { const p = q.o[a].p; S.traps[p] = (S.traps[p] || 0) + 1; } }
    s.results.push({ id, correct, pick: a, time: 0 });
  });
  const blankN = s.queue.filter((id) => s.answers[id] == null).length;
  const score = s.params.cespe ? Math.max(0, Math.round(((ok - (s.queue.length - ok - blankN)) / s.queue.length) * 100)) : Math.round((ok / s.queue.length) * 100);
  s.score = score; s.used = Date.now() - s.start;
  const gain = ok * 10; S.xp += gain; s.xp = gain;
  S.sims = (S.sims || []).concat([{ at: Date.now(), title: s.title, score, n: s.queue.length }]).slice(-20);
  bumpStreak();
  s.phase = 'summary'; L.cycles++; S.totals.cycles++;
  checkMissions(); checkBadges(); persist(); render(); $('#view').scrollTop = 0;
}

/* ---------- Tutor e treino com IA (inspirado no Khanmigo) ---------- */
function questionContext(q, pick) {
  return `Caso: ${q.c}\nPergunta: ${q.q}\n` + q.o.map((o, i) => `${LETTERS[i]}) ${o.t}${i === q.a ? ' [CORRETA]' : ''} — explicação: ${o.w}`).join('\n') +
    (pick != null ? `\nO aluno marcou: ${LETTERS[pick]}${pick === q.a ? ' (acertou)' : ' (errou)'}` : '');
}
async function askTutor(text) {
  const s = ui.session; if (!aiReady() || !s || s.tutor.busy || !text.trim()) return;
  const { q, deck } = QINDEX[s.queue[s.i]];
  const t = s.tutor;
  t.msgs.push({ role: 'user', content: text.trim() }); t.busy = true; t.live = ''; t.err = '';
  render(); scrollTutor();
  try {
    const reply = await AI.tutor(q, s.pick, deck, t.msgs.map((m) => ({ role: m.role, content: m.content })),
      ({ text: full }) => { t.live = full; const el = document.getElementById('tutor-live'); if (el) { el.innerHTML = '<p>' + richText(full) + '</p>'; scrollTutor(); } });
    t.msgs.push({ role: 'assistant', content: reply });
    const L = todayLog(); L.tutor++; checkMissions(); persist();
  } catch (e) {
    t.msgs.pop();
    t.err = aiError(e, 'O tutor não respondeu agora. Tente de novo.');
  }
  t.busy = false; t.live = '';
  if (ui.session === s) { render(); scrollTutor(); }
}
function scrollTutor() { const el = document.getElementById('tutor'); if (el) el.scrollIntoView({ block: 'end', behavior: 'smooth' }); }

function variationPrompt(q, deck, n) {
  return `Você é o motor de questões do Memory. O aluno errou a questão abaixo, da trilha "${deck.title}". Crie ${n} novas questões que treinem EXATAMENTE o mesmo conceito, cada uma com um caso diferente e realista, para fixar o ponto por outros ângulos. Não repita o caso original.\n\nQUESTÃO ORIGINAL:\n${questionContext(q, null)}\n\nRegras: português do Brasil; 4 alternativas; exatamente uma com "p":"correta"; as erradas usam um destes padrões: "inversao", "generalizacao", "restricao", "extrapolacao", "troca", "calculo"; "w" explica em 1 a 2 frases por que a alternativa está certa ou errada; "a" é o índice da correta (varie a posição); "topic" com até 4 palavras; "src" igual ou semelhante ao da original (${q.src || 'trilha ' + deck.title}).\n\nResponda SOMENTE com um array JSON:\n[{"topic":"...","c":"...","q":"...","a":0,"src":"...","o":[{"t":"...","p":"correta","w":"..."},{"t":"...","p":"troca","w":"..."},{"t":"...","p":"generalizacao","w":"..."},{"t":"...","p":"inversao","w":"..."}]}]`;
}
async function trainPoint() {
  const s = ui.session; if (!aiReady() || !s || s.train.busy) return;
  const { q, deck } = QINDEX[s.queue[s.i]];
  s.train.busy = true; s.train.err = ''; render();
  try {
    const arr = await AI.variations(q, deck, 3);
    let rf = CUSTOM.find((d) => d.id === 'ureforco');
    if (!rf) { rf = { id: 'ureforco', title: 'Reforço dos seus erros', subtitle: 'Gerado pelo tutor', blurb: 'Variações criadas a partir das questões que você errou, para treinar o mesmo ponto por outros ângulos.', color: 'orange', tag: 'Reforço', custom: true, createdAt: Date.now(), questions: [] }; CUSTOM.unshift(rf); }
    const qs = validateQuestions(arr, 'ureforco_' + Date.now().toString(36));
    if (!qs.length) throw { code: 'invalid_json' };
    qs.forEach((x) => { x.topic = q.topic; });
    rf.questions.push(...qs);
    saveDecksLocal(); reindex(); pushDeck(rf);
    if (ui.session === s) { s.queue.splice(s.i + 1, 0, ...qs.map((x) => x.id)); s.added += qs.length; s.train.done = qs.length; }
    const L = todayLog(); L.tutor++; checkMissions(); persist();
  } catch (e) {
    s.train.err = aiError(e, 'Não foi possível criar as variações agora.');
  }
  s.train.busy = false;
  if (ui.session === s) render();
}

/* ================= Visual v4 (referências Figma) ================= */
document.body.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="lgB"><circle cx="15" cy="12" r="7"/></clipPath><clipPath id="artB"><circle cx="196" cy="104" r="62"/></clipPath></defs></svg>');
I.chev = '<path d="m9 6 6 6-6 6"/>';
I.tick = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';
I.search = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>';
I.edit = '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>';
I.layers = I.decks;
I.gear = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>';
const chev = () => `<svg class="ico chev" viewBox="0 0 24 24" aria-hidden="true">${I.chev}</svg>`;
const tickIco = () => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${I.tick}</svg>`;

/* ---------- Imagens (arquivos publicados junto com o app) ---------- */
const PHOTOS = { hero: 'img/hero.webp', neuro: 1, port: 1, dconst: 1, logica: 1, excel: 1, mat: 1, lgpd: 1, bio: 1, hist: 1, dadm: 1, info: 1, seg: 1 };
const REDUCED = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
/* ---------- Capas ilustradas das trilhas ---------- */
const PAL = {
  navy: { bg: '#1F2A6B', a: '#FF7A22', b: '#3E4DB3', fg: '#FFFFFF', dot: 'rgba(255,255,255,.18)' },
  peach: { bg: '#FFE7D4', a: '#FF7A22', b: '#1F2A6B', fg: '#1F2A6B', dot: 'rgba(31,42,107,.14)' },
  blue: { bg: '#DFE8FF', a: '#2E5BDB', b: '#FF7A22', fg: '#1F2A6B', dot: 'rgba(31,42,107,.14)' },
  mint: { bg: '#D6F2E5', a: '#14945A', b: '#1F2A6B', fg: '#0E4F33', dot: 'rgba(14,79,51,.14)' },
  lilac: { bg: '#E7E2FF', a: '#6648D8', b: '#FF7A22', fg: '#2B1C77', dot: 'rgba(43,28,119,.14)' },
  yellow: { bg: '#FFEFBA', a: '#FF7A22', b: '#1F2A6B', fg: '#5E4200', dot: 'rgba(94,66,0,.14)' }
};
const DECK_LOOK = {
  neuro: { pal: 'navy', v: 1, icon: 'mind' }, port: { pal: 'peach', v: 0, glyph: 'Aa' }, dconst: { pal: 'blue', v: 2, glyph: '§' },
  logica: { pal: 'lilac', v: 3, glyph: 'p→q' }, excel: { pal: 'mint', v: 0, glyph: 'fx' }, mat: { pal: 'yellow', v: 2, glyph: 'π' },
  lgpd: { pal: 'navy', v: 3, icon: 'shield' }, ureforco: { pal: 'peach', v: 3, icon: 'target' }
};
const TAG_COLOR = { 'Concursos': 'c-peach', 'Corporativo': 'c-blue', 'Escola': 'c-yellow', 'Recomendado': 'c-mint', 'Seu material': 'c-lilac', 'Reforço': 'c-pink', 'Compartilhada': 'c-blue' };
function hashStr(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function lookOf(d) {
  if (DECK_LOOK[d.id]) return DECK_LOOK[d.id];
  const h = hashStr(d.id); const pals = Object.keys(PAL);
  const ini = d.title.split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || d.title.slice(0, 1).toUpperCase();
  return { pal: pals[h % pals.length], v: h % 4, glyph: ini };
}
function cover(d, h = 150, big = false) {
  if (typeof PHOTOS !== 'undefined' && PHOTOS[d.id]) {
    const L0 = lookOf(d), p0 = PAL[L0.pal];
    return `<div class="pcover"><img class="fade" src="img/${d.id}-640.webp" srcset="img/${d.id}-640.webp 640w, img/${d.id}-1280.webp 1280w" sizes="${big ? '(min-width: 760px) 390px, 100vw' : '(min-width: 760px) 240px, 62vw'}" width="1280" height="720" loading="lazy" decoding="async" alt=""><span class="pbadge" style="background:${p0.bg};color:${p0.fg}">${L0.icon ? ico(L0.icon) : esc(L0.glyph)}</span></div>`;
  }
  const L = lookOf(d), p = PAL[L.pal], W = 320, H = 180;
  const dots = Array.from({ length: 4 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<circle cx="${236 + c * 14}" cy="${20 + r * 14}" r="2.2" fill="${p.dot}"/>`).join('')).join('');
  const shapes = [
    `<circle cx="262" cy="150" r="92" fill="${p.a}"/><circle cx="196" cy="58" r="30" fill="none" stroke="${p.b}" stroke-width="3"/>${dots}`,
    `<circle cx="214" cy="96" r="58" fill="${p.b}"/><circle cx="262" cy="96" r="58" fill="${p.a}" opacity=".92"/><path d="M150 168 290 28" stroke="${p.dot}" stroke-width="2"/>`,
    `<path d="M320 0v120A120 120 0 0 1 200 0Z" fill="${p.a}"/><rect x="186" y="132" width="110" height="10" rx="5" fill="${p.b}"/><rect x="216" y="150" width="80" height="10" rx="5" fill="${p.b}" opacity=".5"/>${dots.replace(/cy="(\d+)"/g, (m, y) => `cy="${+y + 80}"`).replace(/cx="(\d+)"/g, (m, x) => `cx="${+x - 100}"`)}`,
    `<circle cx="250" cy="200" r="110" fill="none" stroke="${p.a}" stroke-width="18"/><circle cx="250" cy="200" r="70" fill="none" stroke="${p.b}" stroke-width="18"/><circle cx="250" cy="200" r="30" fill="${p.a}"/>${dots}`
  ][L.v];
  const mark = L.icon ? `<g transform="translate(26 54) scale(3)" fill="none" stroke="${p.fg}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[L.icon]}</g>` :
    `<text x="26" y="${L.glyph.length > 2 ? 110 : 118}" font-family="Poppins, sans-serif" font-weight="700" font-size="${L.glyph.length > 2 ? 44 : 64}" fill="${p.fg}">${esc(L.glyph)}</text>`;
  return `<svg class="cover" viewBox="0 0 ${W} ${H}" style="max-height:${h}px" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Capa da trilha ${esc(d.title)}"><rect width="${W}" height="${H}" fill="${p.bg}"/>${shapes}${mark}</svg>`;
}
function art() {
  return `<svg viewBox="0 0 340 208" aria-hidden="true">
    <g fill="none" stroke="rgba(255,255,255,.28)" stroke-width=".9"><circle cx="134" cy="104" r="82"/><circle cx="134" cy="104" r="96"/><circle cx="196" cy="104" r="82"/><circle cx="196" cy="104" r="96"/>
    <line x1="10" y1="104" x2="330" y2="104"/><line x1="134" y1="2" x2="134" y2="206"/><line x1="196" y1="2" x2="196" y2="206"/><line x1="150" y1="150" x2="262" y2="38"/><path d="M246 38h16v16"/></g>
    <circle cx="134" cy="104" r="62" fill="#4A5BD6"/><circle cx="196" cy="104" r="62" fill="#FF7A22"/><circle cx="134" cy="104" r="62" fill="#B4482A" clip-path="url(#artB)"/></svg>`;
}

/* ---------- Render ---------- */
function render() {
  const v = $('#view'), tabbar = $('#tabbar'), sb = $('#statusbar');
  let navyTop = false;
  if (!S.user.onboarded) { tabbar.hidden = true; v.innerHTML = viewOnboarding(); navyTop = true; }
  else if (ui.session) { tabbar.hidden = true; v.innerHTML = viewSession(); navyTop = ui.session.phase === 'summary'; }
  else {
    tabbar.hidden = ui.tab === 'avatar'; tabbar.innerHTML = viewTabbar();
    const views = { home: viewHome, trilhas: viewTrilhas, importar: viewImport, progresso: viewProgress, perfil: viewProfile, conta: viewConta, turmas: viewTurmas, admin: viewAdmin, avatar: viewAvatar, liga: viewLiga };
    v.innerHTML = (views[ui.tab] || viewHome)();
    navyTop = ui.tab === 'home';
  }
  if (sb) sb.classList.toggle('on-navy', navyTop);
  const key = !S.user.onboarded ? 'onb' + ui.onb : ui.session ? 'ses' + ui.session.mode + ui.session.i + (ui.session.phase === 'summary' ? 'sum' : '') : ui.tab + (ui.deck || '') + (imp.done || '') + (ui.tab === 'turmas' && API && API.cls ? API.cls.id + (API.cls.name ? '1' : '0') : '');
  if (key !== render.last) {
    render.last = key;
    v.classList.remove('screen-in');
    if (!REDUCED) { void v.offsetWidth; v.classList.add('screen-in'); clearTimeout(render.t); render.t = setTimeout(() => v.classList.remove('screen-in'), 950); runCounters(v); }
    const pip = tabbar.querySelector('[aria-current] .pip'); if (pip) pip.classList.add('pop');
  }
  if (ui.session) ui.session.justRevealed = false;
  markImgs(v);
  renderSheet();
}
function renderSheet() {
  const old = document.querySelector('.scrim'); if (old) old.remove();
  if (!ui.sheet) return;
  const el = document.createElement('div'); el.className = 'scrim'; el.dataset.act = 'sheet-close';
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" data-stop="1">${ui.sheet}</div>`;
  if (!old) renderSheet.back = document.activeElement;
  $('#app').appendChild(el);
  // Acessibilidade: o foco entra no painel e volta para onde estava quando ele fecha.
  setTimeout(() => { const sh = document.querySelector('.sheet'); if (sh && !sh.contains(document.activeElement)) { const f = sh.querySelector('input:not([type=hidden]), textarea, button:not([disabled])'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); else { sh.tabIndex = -1; sh.focus({ preventScroll: true }); } } }, 30);
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !ui.sheet) return;
  const sh = document.querySelector('.sheet'); if (!sh) return;
  const f = [...sh.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, summary, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || !sh.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
new MutationObserver(() => { if (!document.querySelector('.scrim') && renderSheet.back && document.contains(renderSheet.back)) { try { renderSheet.back.focus({ preventScroll: true }); } catch (e) { /* ok */ } renderSheet.back = null; } }).observe(document.getElementById('app'), { childList: true });
function viewTabbar() {
  const cur = ui.tab === 'importar' ? 'trilhas' : ui.tab === 'liga' ? 'progresso' : ui.tab === 'conta' || ui.tab === 'turmas' || ui.tab === 'admin' || ui.tab === 'avatar' ? 'perfil' : ui.tab;
  const t = (id, label, icon) => `<button class="tab" data-act="tab" data-tab="${id}" ${cur === id ? 'aria-current="page"' : ''}><span class="pip">${ico(icon)}</span><span>${label}</span></button>`;
  return t('home', 'Início', 'home') + t('trilhas', 'Trilhas', 'decks') + t('progresso', 'Progresso', 'chart') + t('perfil', 'Perfil', 'user');
}
const initials = () => (S.user.name || 'M').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ---------- Onboarding ---------- */
function viewOnboarding() {
  const step = ui.onb;
  const dots = `<div class="steps" aria-hidden="true">${[0, 1, 2].map((i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`;
  if (step === 0) return `<div class="onb"><div class="onb-art">${typeof PHOTOS !== 'undefined' ? `<div class="onb-hero"><span class="ring"></span><img class="fade" src="${PHOTOS.hero}" width="760" height="1020" decoding="async" alt="Estudante sorrindo com celular e caderno"><div class="glass fc fc1"><b class="num">87%</b><span>memória estimada</span></div><div class="glass fc fc2"><span class="tile" style="width:30px;height:30px;border-radius:10px;background:var(--ok);color:#fff">${ico('check')}</span><span><b>Na mosca!</b><br>+15 XP</span></div></div>` : art()}</div><div class="onb-body">
      <div class="blk" style="gap:12px"><span class="tiny" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--orange-ink)">Projeto Memory</span>
        <h1>Você sabe o que estudar. O Memory resolve <em>o como</em>.</h1>
        <p class="muted">Ciclos curtos de estudo ativo que trocam a dopamina do scroll pela dopamina do acerto.</p></div>
      <div class="list">${[['c-blue', 'target', 'Desafio', 'Um caso real abre cada questão'], ['c-peach', 'bolt', 'Esforço', 'Você lembra antes de ver as opções'], ['c-mint', 'check', 'Recompensa', 'Feedback na hora'], ['c-lilac', 'book', 'Consolidação', 'O porquê de cada alternativa']]
        .map(([c, i, t, s]) => `<div class="item"><span class="tile ${c}">${ico(i)}</span><div class="main"><b>${t}</b><span>${s}</span></div></div>`).join('')}</div>
      <div class="blk" style="gap:12px">${dots}<button class="btn btn-orange btn-block" data-act="onb-next">Começar</button>${API && API.on && API.db ? `<button class="btn btn-text btn-block" data-act="auth-open" data-m="login">Já tenho conta · <b style="color:var(--orange-ink)">Entrar</b></button>` : ''}</div></div></div>`;
  if (step === 1) return `<div class="onb"><div class="onb-body">
      <div class="blk" style="gap:20px"><div class="blk" style="gap:6px"><span class="tiny" style="font-weight:700">Passo 2 de 3</span><h1>Vamos nos conhecer</h1></div>
        <div class="field"><label for="onb-name">Seu nome</label><input id="onb-name" class="input" autocomplete="given-name" placeholder="Como quer ser chamado" value="${esc(S.user.name)}" maxlength="40"></div>
        <div class="field"><span class="flabel">Para que você vai estudar?</span><div class="choice-list">${PERSONAS.map((p, i) => `<button class="choice pick" data-act="persona" data-id="${p.id}" aria-pressed="${S.user.persona === p.id}"><span class="tile ${['c-peach', 'c-blue', 'c-yellow', 'c-mint'][i]}">${ico(['exam', 'read', 'school', 'work'][i])}</span><div class="main"><b>${p.l}</b><span>${p.d}</span></div><i class="radio"></i></button>`).join('')}</div></div></div>
      <div class="blk" style="gap:16px">${dots}<button class="btn btn-orange btn-block" data-act="onb-next" ${S.user.persona ? '' : 'disabled'}>Continuar</button></div></div></div>`;
  const goals = [[5, 'Leve', '5 min por dia', 'c-mint'], [10, 'Constante', '10 min por dia', 'c-blue'], [20, 'Intenso', '20 min por dia', 'c-peach'], [30, 'Reta final', '30 min por dia', 'c-pink']];
  return `<div class="onb"><div class="onb-body">
      <div class="blk" style="gap:20px"><div class="blk" style="gap:6px"><span class="tiny" style="font-weight:700">Passo 3 de 3</span><h1>Sua meta diária</h1><p class="muted">Pouco e todo dia vence muito e de vez em quando.</p></div>
        <div class="choice-list">${goals.map(([n, l, t, c]) => `<button class="choice pick" data-act="goal" data-n="${n}" aria-pressed="${S.user.goal === n}"><span class="tile ${c} num">${n}</span><div class="main"><b>${l}</b><span>${n} questões · ${t}</span></div><i class="radio"></i></button>`).join('')}</div></div>
      <div class="blk" style="gap:16px">${dots}<button class="btn btn-orange btn-block" data-act="onb-finish">Criar meu plano</button></div></div></div>`;
}

/* ---------- Início ---------- */
function deckCard(d) {
  const st = deckStats(d);
  return `<button class="ccard" data-act="open-deck" data-id="${esc(d.id)}">${cover(d, 120)}
    <div class="cb"><span class="tag ${TAG_COLOR[d.tag] || 'c-blue'}">${esc(d.tag || 'Trilha')}</span><h3>${esc(d.title)}</h3>
    <div class="bar"><i class="o" style="width:${st.pct}%"></i></div>
    <div class="meta"><span>${st.m + st.l} de ${st.t} estudadas</span><span class="num">${st.pct}%</span></div></div></button>`;
}
function viewHome() {
  const h = new Date().getHours();
  const hi = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const first = S.user.name ? esc(S.user.name.split(' ')[0]) : 'estudante';
  const due = dueIds().length, nd = nextDue(), mem = memoryNow();
  const errs = errorIds().length, st = streakNow(), ms = missions(), L = peekToday();
  const size = Math.max(5, Math.min(10, S.user.goal));
  const decks = personaDecks().map(deckById).filter(Boolean).sort((a, b) => (deckStats(b).t - deckStats(b).f > 0) - (deckStats(a).t - deckStats(a).f > 0));
  const tiles = ['c-blue', 'c-mint', 'c-lilac'], icons = ['target', 'check', 'recall'];
  return `<div class="hdr">${typeof PHOTOS !== 'undefined' ? `<img class="hero-girl fade" src="${PHOTOS.hero}" width="760" height="1020" decoding="async" alt="">` : ''}
      <div class="top"><div class="hello"><button class="avatar avbtn" data-act="tab" data-tab="perfil" aria-label="Abrir seu perfil">${avatarSVG(avatarConfig())}</button><div><small>${hi},</small><b>${first}</b></div></div>
        <div class="chips-r"><span class="glass gchip num" title="Moedas">${coinIco()}${coinsBal()}</span><span class="glass gchip num" title="Dias seguidos">${ico('flame')}${st} ${st === 1 ? 'dia' : 'dias'}</span></div></div>
      <h1>${todayPlan().every((x) => x.done) ? 'Dia <em>completo</em>. Seu cérebro agradece' : due ? 'Hora de <em>revisar</em> o que você aprendeu' : 'Pronto para a <em>próxima sessão</em>?'}</h1>
      <div class="memrow">
        <div class="glass"><b class="num">${mem == null ? '–' : Math.round(mem * 100) + '%'}</b><span>memória</span></div>
        <div class="glass"><b class="num">${due}</b><span>revisões</span></div>
        <div class="glass"><b class="num">${Math.min(L.n, S.user.goal)}/${S.user.goal}</b><span>meta hoje</span></div>
      </div>
    </div>
    <div class="cta-float">${planCard()}</div>
    <div class="page" style="padding-top:22px">
      ${examCard()}
      ${!S.user.avatar && !S.user.avSeen ? `<div class="avnudge"><span class="av md">${avatarSVG(avatarConfig())}</span><div><b>Monte seu personagem</b><span>Escolha rosto, cabelo, roupa e estilo. Ele aparece no ranking da turma.</span></div><div class="avnudge-act"><button class="btn btn-orange btn-sm" data-act="av-open">Montar</button><button class="icon-btn flat" data-act="av-later" aria-label="Agora não">${ico('close')}</button></div></div>` : ''}
      ${weekStrip()}
      ${homeLeagueCard()}
      <div class="blk"><div class="sec"><h2>Continue estudando</h2><button class="link" data-act="tab" data-tab="trilhas">Ver todas</button></div>
        <div class="hscroll">${decks.map(deckCard).join('')}</div></div>
      ${homeClassBlock()}
      <div class="card pad" style="flex-direction:row;align-items:center;background:var(--t-peach);box-shadow:none">
        <span class="tile" style="background:var(--orange);color:#fff">${ico('bolt')}</span>
        <div style="flex:1;min-width:0"><b class="d" style="font-weight:600;display:block">Sem vontade de começar?</b><span class="small muted">3 questões em menos de 2 minutos</span></div>
        <button class="btn btn-primary btn-sm" data-act="quick">Destravar</button>
      </div>
      ${errs ? `<div class="list"><button class="item" data-act="errors"><span class="tile c-pink">${ico('book')}</span><div class="main"><b>Caderno de erros</b><span>${plural(errs, 'questão para virar acerto', 'questões para virar acerto')}</span></div>${chev()}</button></div>` : ''}
      <div class="blk"><div class="sec"><h2>Missões de hoje</h2><span class="tiny num" style="font-weight:700">${ms.filter((m) => m.done).length}/3 · +20 XP</span></div>
        <div class="list">${ms.map((m, i) => `<div class="item"><span class="tile ${tiles[i]}">${ico(icons[i])}</span><div class="main"><b>${esc(m.l)}</b><div class="bar" style="margin-top:6px"><i class="${m.done ? 'g' : 'o'}" style="width:${Math.min(100, (m.v / m.t) * 100)}%"></i></div></div>${m.done ? `<span class="check on">${tickIco()}</span>` : `<span class="end num">${Math.min(m.v, m.t)}/${m.t}</span>`}</div>`).join('')}</div></div>
    </div>`;
}

/* ---------- Trilhas ---------- */
const CATS0 = [['all', 'Todas'], ['Concursos', 'Concursos'], ['Escola', 'Escola'], ['Corporativo', 'Corporativo'], ['mine', 'Seu material']];
const catsNow = () => (API && classDeckIds().length ? [CATS0[0], ['turma', 'Da turma'], ...CATS0.slice(1)] : CATS0);
function filteredDecks() {
  const q = (ui.q || '').trim().toLowerCase(); const cat = ui.cat || 'all';
  const tids = cat === 'turma' && API ? classDeckIds() : [];
  return allDecks().filter((d) => (cat === 'all' || (cat === 'turma' ? tids.includes(d.id) : cat === 'mine' ? d.custom : d.tag === cat || (cat === 'Concursos' && d.tag === 'Recomendado'))) && (!q || (d.title + ' ' + d.subtitle + ' ' + (d.blurb || '')).toLowerCase().includes(q)));
}
function deckGrid() { const list = filteredDecks(); return list.length ? `<div class="grid2">${list.map(deckCard).join('')}</div>` : `<div class="empty-illo">${illo('search')}<b>Nenhuma trilha encontrada</b><span>Tente outra palavra ou crie uma trilha com o seu PDF.</span></div>`; }
function viewTrilhas() {
  if (ui.deck) return viewDeck(deckById(ui.deck));
  const errs = errorIds().length;
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><h1 style="font-size:26px">Trilhas</h1><button class="icon-btn" data-act="tab" data-tab="importar" aria-label="Criar trilha">${ico('plus')}</button></div>
    <label class="search">${ico('search')}<input id="deck-q" placeholder="Buscar trilha" value="${esc(ui.q || '')}" autocomplete="off" aria-label="Buscar trilha"></label>
    <div class="chips" role="group" aria-label="Categorias">${catsNow().map(([id, l]) => `<button class="fchip" data-act="cat" data-id="${id}" aria-pressed="${(ui.cat || 'all') === id}">${l}</button>`).join('')}</div>
    <div class="list">
      <button class="item" data-act="tab" data-tab="importar"><span class="tile c-peach">${ico('upload')}</span><div class="main"><b>Criar trilha com seu PDF</b><span>Apostila, edital, manual ou código</span></div>${chev()}</button>
      <button class="item" data-act="sim-pick"><span class="tile c-blue">${ico('clock')}</span><div class="main"><b>Simulado</b><span>Cronometrado, gabarito no final</span></div>${chev()}</button>
      ${errs ? `<button class="item" data-act="errors"><span class="tile c-pink">${ico('book')}</span><div class="main"><b>Caderno de erros</b><span>${plural(errs, 'questão', 'questões')}</span></div>${chev()}</button>` : ''}
    </div>
    <div id="deck-grid">${deckGrid()}</div>
  </div>`;
}
function viewDeck(d) {
  if (!d) { ui.deck = null; return viewTrilhas(); }
  const st = deckStats(d); const now = Date.now(); const simN = Math.min(10, st.t);
  return `<div class="dhead">${cover(d, 200, true).replace('class="cover"', 'class="cover" style="border-radius:0 0 28px 28px;max-height:200px"')}
      <div class="bar-top"><button class="icon-btn" data-act="close-deck" aria-label="Voltar">${ico('back')}</button>${d.custom ? `<button class="icon-btn" data-act="share-deck" data-id="${esc(d.id)}" aria-label="Compartilhar">${ico('share')}</button>` : ''}</div></div>
    <div class="page">
      <div class="blk" style="gap:8px"><span class="tag ${TAG_COLOR[d.tag] || 'c-blue'}">${esc(d.tag || 'Trilha')}</span><h1 style="font-size:24px">${esc(d.title)}</h1><p class="muted small">${esc(d.blurb || d.subtitle)}</p></div>
      <div class="stats4">
        <div class="st c-blue"><b class="num">${st.f}</b><span>Novas</span></div>
        <div class="st c-peach"><b class="num">${st.l}</b><span>Aprendendo</span></div>
        <div class="st c-mint"><b class="num">${st.m}</b><span>Firmes</span></div>
        <div class="st c-lilac"><b class="num">${st.mem == null ? '–' : st.mem + '%'}</b><span>Memória</span></div>
      </div>
      <div class="blk" style="gap:10px">
        <button class="btn btn-orange btn-block" data-act="${st.due ? 'review-deck' : 'cycle-deck'}" data-id="${esc(d.id)}">${st.due ? 'Revisar ' + plural(st.due, 'questão', 'questões') : 'Estudar agora · ' + Math.min(10, st.t) + ' questões'}</button>
        <div class="duo">${st.due ? `<button class="btn btn-soft btn-sm" data-act="cycle-deck" data-id="${esc(d.id)}">Ciclo completo</button>` : `<button class="btn btn-soft btn-sm" data-act="quick-deck" data-id="${esc(d.id)}">3 rápidas</button>`}
          <button class="btn btn-soft btn-sm" data-act="sim-deck" data-id="${esc(d.id)}">Simulado · ${Math.round(simN * 1.5)} min</button></div>
        ${(() => { const n = d.questions.filter((q) => q.type === 'ce').length; return n >= 4 ? `<div class="duo ce-duo"><button class="btn btn-ghost btn-sm ce-btn" data-act="ce-deck" data-id="${esc(d.id)}"><b>C</b><b>E</b> Treino · ${n}</button>${n >= 10 ? `<button class="btn btn-ghost btn-sm" data-act="sim-cespe" data-id="${esc(d.id)}">Simulado Cebraspe</button>` : ''}</div>` : ''; })()}
      </div>
      ${journeyHTML(d)}
      <div class="blk"><div class="sec"><h2>Conteúdo</h2><div class="legend"><span><i class="dot m"></i>Firme</span><span><i class="dot l"></i>Aprendendo</span></div></div>
        ${(() => {
          const f = ui.qf || 'todas'; const ceN = d.questions.filter((q) => q.type === 'ce').length;
          const weak = new Set(weakCards().filter((x) => x.deck.id === d.id).map((x) => x.id));
          const pass = (q) => { const c = cardOf(q.id); return f === 'todas' ? true : f === 'revisar' ? c && c.s && c.due <= now : f === 'fracas' ? weak.has(q.id) : f === 'novas' ? !c || !c.s : f === 'ce' ? q.type === 'ce' : true; };
          const all = d.questions.map((q, i) => [q, i]).filter(([q]) => pass(q)); const lim = ui.qmore === d.id ? all.length : 12;
          const chip = (k, l, n) => (n === 0 && k !== 'todas' ? '' : `<button class="fchip" data-act="qf" data-f="${k}" aria-pressed="${f === k}">${l}${n != null ? ' · ' + n : ''}</button>`);
          const nRev = d.questions.filter((q) => { const c = cardOf(q.id); return c && c.s && c.due <= now; }).length;
          const nNew = d.questions.filter((q) => { const c = cardOf(q.id); return !c || !c.s; }).length;
          return `<div class="chips qfilters" role="group" aria-label="Filtrar questões">${chip('todas', 'Todas', d.questions.length)}${chip('revisar', 'Revisar agora', nRev)}${chip('fracas', 'Fracas', weak.size)}${chip('novas', 'Novas', nNew)}${chip('ce', 'Certo/Errado', ceN)}</div>
          <div class="list">${all.slice(0, lim).map(([q, i]) => {
          const c = cardOf(q.id); const cls = !c || !c.s ? '' : c.s >= FIRM && c.g > 1 ? 'm' : 'l';
          const info = !c || !c.s ? 'Nova' : Math.round(retr(c) * 100) + '%';
          return `<button class="item" data-act="study-one" data-id="${esc(q.id)}"><span class="tile ${i % 2 ? 'c-blue' : 'c-peach'} num" style="width:36px;height:36px;border-radius:12px;font-size:13px">${pad(i + 1)}</span><div class="main"><b>${esc(q.topic)}</b><span>${!c || !c.s ? 'Ainda não estudada' : c.due <= now ? 'Revisar agora' : 'Revisão ' + whenText(c.due)}</span></div><span class="end num"><i class="dot ${cls}"></i>${info}</span></button>`;
        }).join('') || '<div class="item noicon"><div class="main"><span>Nenhuma questão neste filtro.</span></div></div>'}</div>
          ${all.length > lim ? `<button class="btn btn-ghost btn-sm btn-block" data-act="qmore" data-id="${esc(d.id)}">Ver todas as ${all.length} questões</button>` : ''}`;
        })()}</div>
      ${d.custom ? `<div class="list">${ui.confirmDelete ? `<div class="item noicon"><div class="main"><b>Excluir esta trilha?</b><span>As questões e o progresso serão apagados.</span></div></div><div class="item noicon" style="gap:10px"><button class="btn btn-ghost btn-sm" style="flex:1" data-act="cancel-delete">Cancelar</button><button class="btn btn-danger btn-sm" style="flex:1" data-act="delete-deck" data-id="${esc(d.id)}">Excluir</button></div>` :
        `<button class="item noicon" data-act="ask-delete" style="justify-content:center;color:var(--bad);font-weight:700">Excluir trilha</button>`}</div>` : ''}
      ${d.source ? `<p class="tiny">Criada a partir de ${esc(d.source)} em ${new Date(d.createdAt).toLocaleDateString('pt-BR')}.</p>` : ''}
    </div>`;
}

/* ---------- Sessão ---------- */
function viewSession() {
  const s = ui.session;
  if (s.phase === 'summary') return s.mode === 'sim' ? viewSimSummary() : s.params && s.params.diag ? viewDiagSummary() : viewSummary();
  const id = s.queue[s.i]; const { q, deck } = QINDEX[id];
  const pct = (s.i / s.queue.length) * 100;
  const back = s.requeued[id] && s.results.some((r) => r.id === id) && s.phase !== 'feedback' && s.phase !== 'consol';
  const L = lookOf(deck);
  const head = `<div class="qmeta"><span class="tag ${TAG_COLOR[deck.tag] || 'c-blue'}">${esc(q.topic)}</span><span>${esc(deck.title)}</span>${back ? '<span class="tag c-peach">De volta para fixar</span>' : ''}</div>
    <div class="case"><span class="tile c-${L.pal === 'navy' ? 'blue' : L.pal}">${ico('file')}</span><span>${esc(q.c)}</span></div>
    ${q.type === 'ce' ? `<span class="ce-lbl">Julgue o item · Certo ou Errado</span><h2 class="qtext ce">${esc(q.q)}</h2>` : `<h2 class="qtext">${esc(q.q)}</h2>`}`;
  const Lt = (di) => (q.type === 'ce' ? (di ? 'E' : 'C') : LETTERS[di]);
  const top = (extra) => `<div class="sess-head"><div class="r"><button class="icon-btn" data-act="quit" aria-label="Sair">${ico('close')}</button><div class="pline" role="progressbar" aria-label="Progresso do ciclo" aria-valuemin="1" aria-valuenow="${s.i + 1}" aria-valuemax="${s.queue.length}"><i style="width:${Math.max(4, pct)}%"></i></div><span class="d num" style="font-weight:600;font-size:14px;min-width:40px;text-align:right">${s.i + 1}/${s.queue.length}</span></div>${extra}</div>`;
  const opts = (fb) => `<div class="opts${q.type === 'ce' ? ' ce' : ''}${!fb && s.justRevealed ? ' in' : ''}">${s.order.map((oi, di) => fb ? `<button class="opt ${oi === q.a ? 'right' : oi === s.pick ? 'wrong' : 'dim'}" disabled><span class="L">${Lt(di)}</span><span>${esc(q.o[oi].t)}</span></button>` : `<button class="opt" data-act="pick" data-i="${oi}" aria-pressed="${s.pick === oi}"><span class="L">${Lt(di)}</span><span>${esc(q.o[oi].t)}</span></button>`).join('')}</div>`;
  if (s.mode === 'sim') {
    return `<div class="sess">${top(`<div class="r" style="justify-content:space-between;padding-left:6px"><span class="tag c-blue">${s.params.cespe ? 'Cebraspe · certo +1, errado −1' : 'Simulado · gabarito no final'}</span><span class="timer-chip" id="sim-timer">${mmss(s.deadline - Date.now())}</span></div>`)}
      <div class="sess-body">${head}${opts(false)}</div>
      <div class="dock"><div class="duo"><button class="btn btn-ghost" data-act="sim-skip">${s.params.cespe ? 'Em branco' : 'Pular'}</button><button class="btn btn-primary" data-act="sim-next" ${s.pick == null ? 'disabled' : ''}>${s.i + 1 >= s.queue.length ? 'Entregar' : 'Confirmar'}</button></div></div></div>`;
  }
  const phases = ['desafio', 'esforco', 'feedback', 'consol'], labels = ['Desafio', 'Esforço', 'Recompensa', 'Porquê'];
  const pi = phases.indexOf(s.phase);
  let body = '', dock = '';
  if (s.phase === 'desafio') {
    body = head + `<div class="think"><b>${q.type === 'ce' ? 'Certo ou errado? Decida antes' : 'Responda de cabeça primeiro'}</b><p>${q.type === 'ce' ? 'Procure a palavra que pode tornar o item errado e diga para você mesmo o porquê.' : 'Formule a resposta antes de ver as opções. Esse esforço é o que fixa o conteúdo.'}</p><span class="timer" id="recall-timer">0s pensando</span></div>`;
    dock = `<button class="btn btn-primary btn-block" data-act="reveal">${q.type === 'ce' ? 'Julgar o item' : 'Ver alternativas'}</button>`;
  } else if (s.phase === 'esforco') {
    body = head + opts(false);
    dock = s.pick == null ? `<p class="hint">Escolha uma alternativa</p>` :
      `<p class="q">Qual é a sua confiança?</p><div class="conf"><button class="c-peach" data-act="conf" data-c="chute">Chutei<small>não sei</small></button><button class="c-blue" data-act="conf" data-c="acho">Acho que sim<small>com dúvida</small></button><button class="c-mint" data-act="conf" data-c="certeza">Tenho certeza<small>sei explicar</small></button></div>`;
  } else if (s.phase === 'feedback') {
    const v = verdict(s);
    body = `<div class="verdict ${v.cls}" role="status"><span class="vi">${ico(v.icon)}</span><div style="flex:1;min-width:0"><h3>${v.title}</h3><p>${v.text}</p></div><span class="xp num">+${s.gain} XP</span></div>${s.bonus ? `<div class="combo" role="status"><b class="num">Combo ×${s.combo}</b><span>+${s.bonus} XP de bônus por acertos seguidos</span></div>` : ''}` + head + opts(true);
    dock = s.correct ? `<div class="duo"><button class="btn btn-soft" data-act="consol">Ver o porquê</button><button class="btn btn-primary" data-act="next">Próxima</button></div>` :
      `<button class="btn btn-orange btn-block" data-act="consol">Entender o erro</button>`;
  } else {
    const trap = s.correct ? null : q.o[s.pick].p;
    body = `<div class="blk" style="gap:4px"><span class="tiny" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--orange-ink)">Engenharia reversa</span><h2 style="font-size:20px">${q.type === 'ce' ? 'Por que o item está certo ou errado' : 'Por que cada alternativa está certa ou errada'}</h2></div>
      ${trap ? `<div class="callout" style="background:var(--t-peach)"><span class="tile" style="background:var(--orange);color:#fff">${ico('alert')}</span><div><b>O que te pegou: ${PATTERNS[trap].l}</b><p>${PATTERNS[trap].d}</p></div></div>` : ''}
      <div class="alts">${s.order.map((oi, di) => { const o = q.o[oi]; const isR = oi === q.a, isP = oi === s.pick && !isR;
        return `<div class="alt ${isR ? 'is-right' : ''} ${isP ? 'is-picked' : ''}"><div class="hd"><span class="L">${q.type === 'ce' ? (di ? 'E' : 'C') : LETTERS[di]}</span><span class="tag ${isR ? 'c-mint' : isP ? 'c-pink' : 'c-blue'}">${PATTERNS[o.p] ? PATTERNS[o.p].l : 'Incorreta'}</span>${isP ? '<span class="tiny" style="font-weight:700;color:var(--bad)">sua resposta</span>' : ''}</div><span class="t">${esc(o.t)}</span><span class="w">${esc(o.w)}</span></div>`; }).join('')}</div>
      ${q.src ? `<p class="tiny">Fonte: ${esc(q.src)}</p>` : ''}${viewTrain(s)}${viewTutor(s)}`;
    dock = `<button class="btn btn-primary btn-block" data-act="next">${s.i + 1 >= s.queue.length ? 'Ver resultado' : 'Próxima questão'}</button>`;
  }
  return `<div class="sess">${top(`<div class="steps4" aria-hidden="true">${labels.map((l, i) => `<span class="${i === pi ? 'on' : i < pi ? 'past' : ''}">${l}</span>`).join('')}</div>`)}
    <div class="sess-body">${body}${s.phase === 'feedback' || s.phase === 'consol' ? reportLink() : ''}</div><div class="dock">${dock}</div></div>`;
}
function viewTrain(s) {
  if (!aiReady() || s.correct) return '';
  const t = s.train;
  if (t.done) return `<div class="callout" style="background:var(--ok-soft)"><span class="tile" style="background:var(--ok);color:#fff">${ico('check')}</span><div><b>${t.done} questões de reforço criadas</b><p>Elas entram logo a seguir e ficam salvas em “Reforço dos seus erros”.</p></div></div>`;
  return `<div class="card pad" style="flex-direction:row;align-items:center"><span class="tile c-peach">${ico('target')}</span><div style="flex:1;min-width:0"><b class="d" style="font-weight:600;display:block;font-size:15px">Treinar este ponto</b><span class="tiny" style="font-size:13px">3 questões novas sobre o mesmo conceito</span>${t.err ? `<p class="tiny" style="color:var(--bad)">${esc(t.err)}</p>` : ''}</div>
    <button class="btn btn-orange btn-sm" data-act="train" ${t.busy ? 'disabled' : ''}>${t.busy ? 'Criando...' : 'Criar'}</button></div>`;
}
function viewTutor(s) {
  if (aiNeedsLogin()) return `<div class="card pad" style="flex-direction:row;align-items:center"><span class="avatar" style="width:40px;height:40px;background:var(--navy-2)">${ico('tutor')}</span><div style="flex:1;min-width:0"><b class="d" style="font-weight:600;display:block">Tutor com IA</b><span class="tiny" style="font-size:13px">Entre na conta para tirar dúvidas e treinar seus erros</span></div><button class="btn btn-primary btn-sm" data-act="auth-open" data-m="signup">Entrar</button></div>`;
  if (!aiReady()) return '';
  const t = s.tutor;
  const chips = ['Explique de outro jeito', 'Me dê um exemplo', 'Crie um macete'];
  return `<div class="tutor" id="tutor">
    <div class="hd"><span class="avatar" style="width:40px;height:40px;background:var(--navy-2)">${ico('tutor')}</span><div style="flex:1;min-width:0"><b class="d" style="font-weight:600;display:block">Tutor Memory</b><span class="tiny" style="font-size:13px">Tire dúvidas sobre esta questão</span></div></div>
    ${t.msgs.map((m) => `<div class="bubble ${m.role === 'user' ? 'me' : 'ai'}"><p>${m.role === 'user' ? esc(m.content) : richText(m.content)}</p></div>`).join('')}
    ${t.busy ? `<div class="bubble ai" id="tutor-live"><p>${t.live ? richText(t.live) : '<span class="typing"><i></i><i></i><i></i></span>'}</p></div>` : ''}
    ${t.err ? `<div class="notice err">${esc(t.err)}</div>` : ''}
    ${!t.busy && t.msgs.length < 2 ? `<div class="qchips">${chips.map((c) => `<button class="qchip" data-act="tutor-chip" data-q="${esc(c)}">${c}</button>`).join('')}</div>` : ''}
    <form class="composer" data-form="tutor"><input id="tutor-input" placeholder="Pergunte ao tutor" maxlength="300" autocomplete="off" aria-label="Pergunta ao tutor" ${t.busy ? 'disabled' : ''}><button aria-label="Enviar" ${t.busy ? 'disabled' : ''}>${ico('send')}</button></form>
  </div>`;
}
function verdict(s) {
  const when = s.days === 1 ? 'amanhã' : 'em ' + s.days + ' dias';
  if (s.correct) {
    if (s.conf === 'certeza') return { cls: 'ok', icon: 'check', title: 'Na mosca!', text: 'Conhecimento sólido. Volta ' + when + '.' };
    if (s.conf === 'acho') return { cls: 'ok', icon: 'check', title: 'Correto', text: 'Ainda havia dúvida. Volta ' + when + ' para reforçar.' };
    return { cls: 'warn', icon: 'check', title: 'Acertou no chute', text: 'Chute certo não é domínio. Volta ' + when + ' para confirmar.' };
  }
  const back = s.requeue ? 'Ela volta no fim deste ciclo.' : 'Volta para revisão ainda hoje.';
  if (s.conf === 'certeza') return { cls: 'bad', icon: 'alert', title: 'Ilusão de competência', text: 'Você tinha certeza e errou. É o erro mais valioso para corrigir agora. ' + back };
  if (s.conf === 'acho') return { cls: 'bad', icon: 'x', title: 'Quase', text: back };
  return { cls: 'bad', icon: 'x', title: 'Incorreto', text: 'Você sinalizou a dúvida. ' + back };
}
function viewSummary() {
  const s = ui.session; const r = s.results;
  const first = r.filter((x) => !x.second); const ok = first.filter((x) => x.correct).length;
  const acc = first.length ? Math.round((ok / first.length) * 100) : 0;
  const avg = r.length ? Math.round(r.reduce((a, x) => a + x.time, 0) / r.length / 1000) : 0;
  const ill = first.filter((x) => !x.correct && x.conf === 'certeza').length;
  const traps = {}; r.forEach((x) => { if (x.trap) traps[x.trap] = (traps[x.trap] || 0) + 1; });
  const top = Object.entries(traps).sort((a, b) => b[1] - a[1])[0];
  const fixed = r.filter((x) => x.second && x.correct).length; const mem = memoryNow();
  const msg = acc >= 80 ? 'Ciclo forte. O conteúdo está entrando.' : acc >= 50 ? 'Bom ciclo. Os erros de hoje viram as revisões de amanhã.' : 'Ciclo difícil, e é assim que se aprende. Errar e corrigir na hora fixa mais.';
  const perfect = first.length >= 3 && ok === first.length;
  return `<div class="sess"><div class="result">${perfect ? `<div class="result-illo">${illo('done')}</div>` : ''}<span class="lbl">Ciclo concluído${s.title && s.title !== 'Sessão' ? ' · ' + esc(s.title) : ''}</span><div class="big num">${cnt(acc, '%')}</div><p>${ok} de ${first.length} na primeira tentativa. ${msg}</p></div>
    <div class="rstats"><div class="card"><b class="num" style="color:var(--orange-ink)">+${s.xp}</b><span>XP</span></div><div class="card"><b class="num">${avg}s</b><span>por questão</span></div><div class="card"><b class="num">${mem == null ? '–' : Math.round(mem * 100) + '%'}</b><span>memória</span></div></div>
    <div class="sumpills"><span class="pill">${coinIco()}<b class="num">+${s.coins || 0}</b> moedas</span>${(s.maxCombo || 0) >= 3 ? `<span class="pill"><b class="num">×${s.maxCombo}</b> maior combo</span>` : ''}</div>
    <div class="page" style="padding-top:20px">
      ${ill ? `<div class="callout" style="background:var(--bad-soft)"><span class="tile" style="background:var(--bad);color:#fff">${ico('alert')}</span><div><b>${plural(ill, 'ilusão de competência corrigida', 'ilusões de competência corrigidas')}</b><p>Você marcou “tenho certeza” e errou. Esses erros iriam com você para a prova.</p></div></div>` : ''}
      ${fixed ? `<div class="callout" style="background:var(--ok-soft)"><span class="tile" style="background:var(--ok);color:#fff">${ico('check')}</span><div><b>${plural(fixed, 'erro virou acerto', 'erros viraram acertos')}</b><p>A correção imediata funcionou. Agora eles voltam em revisões espaçadas.</p></div></div>` : ''}
      ${top ? `<div class="callout" style="background:var(--t-blue)"><span class="tile" style="background:var(--navy-2);color:#fff">${ico('target')}</span><div><b>Padrão que mais te pegou: ${PATTERNS[top[0]].l}</b><p>${PATTERNS[top[0]].d}</p></div></div>` : ''}
      ${planSummaryHTML()}
    </div></div>`;
}
function viewSimSummary() {
  const s = ui.session;
  const ok = s.results.filter((x) => x.correct).length, blank = s.results.filter((x) => x.pick == null).length;
  if (s.params.cespe) return viewCespeSummary(s, ok, blank);
  const vt = s.score >= 70 ? 'Desempenho de aprovação.' : s.score >= 50 ? 'No caminho. Revise os erros abaixo.' : 'Base ainda frágil. Os erros já entraram nas suas revisões.';
  return `<div class="sess"><div class="result"><span class="lbl">Simulado · ${esc(s.title)}</span><div class="big num">${cnt(s.score, '%')}</div><p>${vt}</p></div>
    <div class="rstats"><div class="card"><b class="num" style="color:var(--ok)">${ok}</b><span>certas</span></div><div class="card"><b class="num" style="color:var(--bad)">${s.queue.length - ok - blank}</b><span>erradas</span></div><div class="card"><b class="num">${mmss(s.used)}</b><span>tempo</span></div></div>
    <div class="page" style="padding-top:20px"><div class="blk"><div class="sec"><h2>Gabarito comentado</h2></div>
      <div class="list">${s.results.map((r, i) => { const q = QINDEX[r.id].q; return `<details class="gab"><summary><span class="gi ${r.correct ? 'ok' : 'bad'}">${ico(r.correct ? 'check' : 'x')}</span><span style="flex:1;min-width:0">${i + 1}. ${esc(q.topic)}</span>${chev()}</summary><div class="body">
        <p style="color:var(--ink);font-weight:700">${esc(q.q)}</p>
        ${r.pick != null && !r.correct ? `<p><b style="color:var(--bad)">Sua resposta:</b> ${esc(q.o[r.pick].t)} ${esc(q.o[r.pick].w)}</p>` : r.pick == null ? '<p><b style="color:var(--bad)">Em branco.</b></p>' : ''}
        <p><b style="color:var(--ok)">Correta:</b> ${esc(q.o[q.a].t)} ${esc(q.o[q.a].w)}</p></div></details>`; }).join('')}</div></div>
      <button class="btn btn-primary btn-block" data-act="end">Voltar ao início</button></div></div>`;
}

function viewCespeSummary(s, ok, blank) {
  const n = s.queue.length, bad = n - ok - blank, net = ok - bad;
  const vt = net >= n * 0.6 ? 'Nota líquida de aprovação. Continue nesse ritmo.' : net > 0 ? 'Nota positiva. Agora é reduzir os erros: na Cebraspe, cada erro apaga um acerto.' : 'Nota líquida negativa ou zero: os erros anularam os acertos. Na dúvida, deixe em branco.';
  const tip = bad > 0 ? `Se tivesse deixado em branco os ${bad} ${bad === 1 ? 'item que errou' : 'itens que errou'}, sua nota seria <span class="hl">${ok}</span> em vez de <span class="hl">${net}</span>.` : blank ? `Nenhum erro: deixar em branco quando não sabia foi a estratégia certa.` : 'Gabarito perfeito.';
  return `<div class="sess"><div class="result"><span class="lbl">Simulado Cebraspe · ${esc(s.title)}</span><div class="big num">${net > 0 ? '+' : ''}${cnt(net)}<small> /${n}</small></div><p>${vt}</p></div>
    <div class="rstats"><div class="card"><b class="num" style="color:var(--ok)">${ok}</b><span>certos</span></div><div class="card"><b class="num" style="color:var(--bad)">${bad}</b><span>errados</span></div><div class="card"><b class="num">${blank}</b><span>em branco</span></div></div>
    <div class="page" style="padding-top:18px"><div class="callout" style="background:var(--t-blue)"><span class="tile" style="background:var(--navy);color:#fff">${ico('target')}</span><div><b>Estratégia</b><p>${tip}</p></div></div>
      <div class="blk"><div class="sec"><h2>Gabarito comentado</h2></div>
      <div class="list">${s.results.map((r, i) => { const q = QINDEX[r.id].q; const ans = q.a === 0 ? 'Certo' : 'Errado'; return `<details class="gab"><summary><span class="gi ${r.correct ? 'ok' : r.pick == null ? '' : 'bad'}">${ico(r.correct ? 'check' : r.pick == null ? 'clock' : 'x')}</span><span style="flex:1;min-width:0">${i + 1}. ${esc(q.topic)}</span><span class="tag ${q.a === 0 ? 'c-mint' : 'c-pink'}">${ans}</span>${chev()}</summary><div class="body">
        <p style="color:var(--ink);font-weight:700">${esc(q.q)}</p>
        <p>${r.pick == null ? '<b>Em branco.</b> ' : r.correct ? '<b style="color:var(--ok)">Você acertou.</b> ' : '<b style="color:var(--bad)">Você errou (−1).</b> '}${esc(q.o[q.a].w)}</p></div></details>`; }).join('')}</div></div>
      <button class="btn btn-primary btn-block" data-act="end">Voltar ao início</button></div></div>`;
}
function cespeIds(deckIds) { return shuffle(deckIds.map(deckById).filter(Boolean).flatMap((d) => d.questions.filter((q) => q.type === 'ce').map((q) => q.id))); }

/* ---------- Criar ---------- */
function viewImport() {
  if (imp.done) {
    const d = deckById(imp.done);
    if (d) return `<div class="dhead">${cover(d, 180).replace('class="cover"', 'class="cover" style="border-radius:0 0 28px 28px"')}<div class="bar-top"><button class="icon-btn" data-act="tab" data-tab="trilhas" aria-label="Voltar">${ico('back')}</button></div></div>
      <div class="page"><div class="blk" style="gap:8px"><span class="tag c-mint">Trilha criada</span><h1 style="font-size:24px">${esc(d.title)}</h1><p class="muted small">${plural(d.questions.length, 'questão pronta', 'questões prontas')} para estudar.</p></div>
      ${imp.note ? `<div class="notice">${esc(imp.note)}</div>` : ''}
      <button class="btn btn-orange btn-block" data-act="cycle-deck" data-id="${esc(d.id)}">Começar agora</button>
      <div class="list">${d.questions.map((q, i) => `<div class="item"><span class="tile c-blue num" style="width:36px;height:36px;border-radius:12px;font-size:13px">${pad(i + 1)}</span><div class="main"><b>${esc(q.q)}</b><span>${esc(q.topic)}</span></div></div>`).join('')}</div>
      <button class="btn btn-text btn-block" data-act="imp-reset">Criar outra trilha</button></div>`;
  }
  const hasMat = (imp.text || '').trim().length > 0; const ai = aiReady();
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="trilhas" aria-label="Voltar">${ico('back')}</button><span></span></div>
    <div class="blk" style="gap:8px"><h1 style="font-size:26px">Nova trilha</h1><p class="muted small">Envie um PDF ou cole um texto. O Memory cria casos, alternativas e o gabarito comentado.</p></div>
    ${imp.file ? `<div class="list"><div class="item"><span class="tile c-peach">${ico('file')}</span><div class="main"><b style="overflow-wrap:anywhere">${esc(imp.file)}</b><span>${imp.reading ? 'Lendo o arquivo...' : (imp.pages ? plural(imp.pages, 'página', 'páginas') + ' · ' : '') + Math.round(imp.text.length / 1000) + ' mil caracteres'}</span></div><button class="icon-btn flat" data-act="imp-clear-file" aria-label="Remover arquivo">${ico('close')}</button></div></div>` :
      `<label class="drop" id="drop" for="imp-file"><span class="tile c-peach" style="width:56px;height:56px;border-radius:18px">${ico('upload')}</span><b>Escolher PDF</b><span class="tiny">PDF com texto selecionável, TXT ou MD</span></label>`}
    <input type="file" id="imp-file" accept=".pdf,.txt,.md,application/pdf,text/plain" hidden>
    ${imp.file ? '' : `<div class="field"><label for="imp-text">Ou cole o conteúdo</label><textarea id="imp-text" class="textarea" placeholder="Trecho da apostila, da lei ou do manual">${esc(imp.text)}</textarea></div>`}
    <div class="field"><label for="imp-title">Nome da trilha</label><input id="imp-title" class="input" value="${esc(imp.title)}" placeholder="Ex.: Lei 8.112 · Capítulo 2" maxlength="60"></div>
    <div class="field"><label for="imp-focus">Foco (opcional)</label><input id="imp-focus" class="input" value="${esc(imp.focus)}" placeholder="Ex.: prazos e exceções" maxlength="120"></div>
    <div class="field"><span class="flabel">Quantidade de questões</span><div class="seg" role="group">${[5, 10, 15].map((n) => `<button data-act="imp-qty" data-n="${n}" aria-pressed="${imp.qty === n}">${n}</button>`).join('')}</div></div>
    ${imp.error ? `<div class="notice err" role="alert">${esc(imp.error)}</div>` : ''}
    ${imp.busy ? `<div class="card pad gen"><b class="d" style="font-weight:600">Criando questões</b><div class="bar"><i class="o" style="width:${Math.max(6, imp.progress * 100)}%"></i></div><span class="tiny" id="gen-status">${imp.progress > 0 ? 'Questão ' + Math.min(imp.qty, Math.ceil(imp.progress * imp.qty)) + ' de ' + imp.qty : 'Lendo o material'}</span><button class="btn btn-soft btn-sm" data-act="imp-cancel">Cancelar</button></div>` :
      `<button class="btn btn-orange btn-block" data-act="imp-generate" ${hasMat && ai && !imp.reading ? '' : 'disabled'}>Gerar ${imp.qty} questões</button>`}
    ${aiNeedsLogin() ? `<div class="notice" style="display:flex;gap:12px;align-items:center;justify-content:space-between"><span>Entre na sua conta para gerar questões com IA.</span><button class="btn btn-primary btn-sm" data-act="auth-open" data-m="signup">Entrar</button></div>` : !ai && sampleChecked ? `<div class="notice">${API && API.on ? 'A geração com IA ainda não foi ativada neste servidor. Trilhas prontas e códigos funcionam normalmente.' : 'A geração automática funciona com o Memory aberto no Claude, com login. Trilhas prontas e códigos funcionam normalmente.'}</div>` : ''}
    <div class="card pad"><div style="display:flex;gap:12px;align-items:center"><span class="tile c-blue">${ico('share')}</span><div><b class="d" style="font-weight:600;display:block">Recebeu um código?</b><span class="tiny" style="font-size:13px">Professores e equipes compartilham trilhas prontas</span></div></div>
      <textarea id="imp-code" class="textarea" style="min-height:76px" placeholder="${API && API.on ? 'Digite o código curto (ex.: K7PX2M) ou cole MEMORY1:...' : 'Cole o código MEMORY1:...'}">${esc(imp.code)}</textarea>
      ${imp.codeErr ? `<div class="notice err">${esc(imp.codeErr)}</div>` : ''}
      <button class="btn btn-primary btn-block btn-sm" data-act="imp-code">Adicionar trilha</button></div>
  </div>`;
}

/* ---------- Progresso ---------- */
function curveChart() {
  const ids = seenIds(); if (!ids.length) return '<p class="muted small">Responda o primeiro ciclo para ver sua curva de memória.</p>';
  const now = Date.now(), days = 30, Wd = 320, H = 150, pl = 32, pr = 6, pt = 14, pb = 22;
  const x = (d) => pl + (d / days) * (Wd - pl - pr), y = (p) => pt + (1 - p) * (H - pt - pb);
  const pts = []; for (let d = 0; d <= days; d++) pts.push([d, memoryNow(now + d * DAY)]);
  const line = pts.map(([d, p], i) => (i ? 'L' : 'M') + x(d).toFixed(1) + ' ' + y(p).toFixed(1)).join(' ');
  const area = line + ` L${x(days)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const tgt = S.user.retention || 0.9; const end = pts[days][1];
  const grid = [1, 0.5, 0].map((p) => `<line x1="${pl}" x2="${Wd - pr}" y1="${y(p)}" y2="${y(p)}" class="g"/><text x="${pl - 6}" y="${y(p) + 3.5}" text-anchor="end" class="ax">${p * 100}%</text>`).join('');
  const xt = [[0, 'Hoje'], [7, '7 d'], [14, '14 d'], [30, '30 d']].map(([d, l]) => `<text x="${x(d)}" y="${H - 4}" text-anchor="${d === 30 ? 'end' : d === 0 ? 'start' : 'middle'}" class="ax">${l}</text>`).join('');
  return `<svg viewBox="0 0 ${Wd} ${H}" class="chart" role="img" aria-label="Sem revisar, a memória vai de ${Math.round(pts[0][1] * 100)}% para ${Math.round(end * 100)}% em 30 dias">
    ${grid}<line x1="${pl}" x2="${Wd - pr}" y1="${y(tgt)}" y2="${y(tgt)}" class="tg"/><text x="${Wd - pr}" y="${y(tgt) - 5}" text-anchor="end" class="ax tgl">Meta ${Math.round(tgt * 100)}%</text>
    <path d="${area}" class="ar"/><path d="${line}" class="ln"/><circle cx="${x(days)}" cy="${y(end)}" r="4" class="pt"/>${xt}</svg>
    <p class="small muted">Sem revisar, sua memória cairia de <b style="color:var(--ink)">${Math.round(pts[0][1] * 100)}%</b> para <b style="color:var(--ink)">${Math.round(end * 100)}%</b> em 30 dias.</p>`;
}
function viewProgress() {
  const total = totalAnswered(); const okT = Object.values(S.log).reduce((a, x) => a + (x.ok || 0), 0);
  const acc = total ? Math.round((okT / total) * 100) : 0;
  const lv = level(); const [lo, hi] = levelRange(lv); const goal = S.user.goal;
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - (7 * 11 + end.getDay()) * DAY); const cells = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(start.getTime() + i * DAY);
    if (d > end) { cells.push('<i class="fut"></i>'); continue; }
    const n = ((S.log[dayKey(d)] || {}).n) || 0;
    cells.push(`<i class="${n === 0 ? '' : n < goal / 2 ? 'h1' : n < goal ? 'h2' : 'h3'}" title="${d.toLocaleDateString('pt-BR')}: ${n} questões"></i>`);
  }
  const cal = [['chute', 'Chutei', 'o'], ['acho', 'Acho que sim', 'n'], ['certeza', 'Tenho certeza', 'g']];
  const traps = Object.entries(S.traps).filter(([k]) => PATTERNS[k]).sort((a, b) => b[1] - a[1]);
  const cert = S.calib.certeza; const ill = cert.n ? Math.round(((cert.n - cert.ok) / cert.n) * 100) : null;
  const sims = (S.sims || []).slice(-5).reverse();
  const studied = allDecks().filter((d) => deckStats(d).f < d.questions.length);
  const nb = Object.keys(S.badges || {}).length; const bcol = ['c-peach', 'c-blue', 'c-mint', 'c-lilac', 'c-yellow', 'c-pink'];
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><h1 style="font-size:26px">Progresso</h1><span class="tag c-peach" style="align-self:center">Nível ${lv}</span></div>
    ${weekReportHTML()}
    ${homeLeagueCard()}
    <div class="kgrid">
      <div class="kcard c-peach"><span class="tile" style="background:var(--surface)">${ico('flame')}</span><b class="num">${cnt(streakNow())}</b><span>dias seguidos</span></div>
      <div class="kcard c-blue"><span class="tile" style="background:var(--surface)">${ico('layers')}</span><b class="num">${cnt(total)}</b><span>questões respondidas</span></div>
      <div class="kcard c-mint"><span class="tile" style="background:var(--surface)">${ico('target')}</span><b class="num">${cnt(acc, '%')}</b><span>de acerto</span></div>
      <div class="kcard c-lilac"><span class="tile" style="background:var(--surface)">${ico('trophy')}</span><b class="num">${cnt(S.xp)}</b><span>XP · faltam ${hi - S.xp}</span></div>
    </div>
    <div class="card pad"><div class="sec"><h2>Curva de memória</h2><span class="tiny" style="font-weight:700">30 dias</span></div>${curveChart()}</div>
    <div class="card pad"><div class="sec"><h2>Constância</h2><span class="tiny" style="font-weight:700">12 semanas</span></div>
      <div class="heat" role="img" aria-label="Dias estudados nas últimas 12 semanas">${cells.join('')}</div>
      <div class="legend"><span><i class="dot" style="background:var(--heat-1)"></i>pouco</span><span><i class="dot" style="background:var(--heat-2)"></i>quase</span><span><i class="dot" style="background:var(--heat-3)"></i>meta de ${goal}</span><span>${ico('shield', 'sm')} ${S.freezes || 0} protetor${(S.freezes || 0) === 1 ? '' : 'es'}</span></div></div>
    <div class="card pad"><div class="sec"><h2>Calibração</h2><span class="tiny" style="font-weight:700">confiança × acerto</span></div>
      ${cal.map(([k, l, c]) => { const x = S.calib[k]; const p = x.n ? Math.round((x.ok / x.n) * 100) : 0; return `<div class="cal"><span>${l}</span><div class="bar"><i class="${c}" style="width:${p}%"></i></div><span class="num tiny" style="text-align:right;font-weight:700">${x.n ? p + '%' : '–'}</span></div>`; }).join('')}
      <p class="small muted">${ill !== null ? `Índice de ilusão: <b style="color:var(--ink)">${ill}%</b> das respostas “tenho certeza” estavam erradas.` : 'Quem estuda bem acerta mais quando diz ter certeza.'}</p></div>
    ${weakHTML()}
    ${studied.length ? `<div class="blk"><div class="sec"><h2>Domínio por trilha</h2></div><div class="list">${studied.map((d) => { const st = deckStats(d); const lk = PAL[lookOf(d).pal]; return `<div class="item"><span class="tile" style="background:${lk.bg};color:${lk.fg}">${lookOf(d).icon ? ico(lookOf(d).icon) : esc(lookOf(d).glyph.slice(0, 3))}</span><div class="main"><b>${esc(d.title)}</b><span>${st.m} de ${st.t} firmes · memória ${st.mem}%</span><div class="bar" style="margin-top:6px"><i class="n" style="width:${(st.m / st.t) * 100}%"></i><i class="o" style="width:${(st.l / st.t) * 100}%;border-radius:0"></i></div></div></div>`; }).join('')}</div></div>` : ''}
    ${traps.length ? `<div class="blk"><div class="sec"><h2>Pegadinhas que mais te pegam</h2></div><div class="list">${traps.slice(0, 4).map(([k, n], i) => `<div class="item"><span class="tile ${bcol[i]}">${ico('alert')}</span><div class="main"><b>${PATTERNS[k].l}</b><span>${PATTERNS[k].d}</span></div><span class="end num">${n}×</span></div>`).join('')}</div></div>` : ''}
    ${sims.length ? `<div class="blk"><div class="sec"><h2>Simulados</h2></div><div class="list">${sims.map((x) => `<div class="item"><span class="tile c-blue">${ico('clock')}</span><div class="main"><b>${esc(x.title)}</b><span>${new Date(x.at).toLocaleDateString('pt-BR')} · ${x.n} questões</span></div><span class="end num" style="color:var(--ink);font-family:var(--display)">${x.score}%</span></div>`).join('')}</div></div>` : ''}
    <div class="blk"><div class="sec"><h2>Conquistas</h2><span class="tiny num" style="font-weight:700">${nb} de ${BADGES.length}</span></div>
      <div class="badges">${BADGES.map((b) => { const on = !!(S.badges && S.badges[b.id]); const pr = badgeProgress(b.id); return `<button class="badge ${on ? 'on' : ''}" data-act="badge" data-id="${b.id}" aria-label="${esc(b.l)}${on ? ', conquistada' : ', ' + pr.v + ' de ' + pr.t}"><img class="medal" src="img/badges/${b.id}.webp" width="56" height="56" alt="" loading="lazy" decoding="async"><b>${esc(b.l)}</b>${on ? '' : `<span class="bprog"><i style="width:${Math.round((Math.min(pr.v, pr.t) / pr.t) * 100)}%"></i></span>`}</button>`; }).join('')}</div></div>
  </div>`;
}

/* ---------- Perfil ---------- */
function viewProfile() {
  const p = PERSONAS.find((x) => x.id === S.user.persona);
  const lv = level(); const [lo, hi] = levelRange(lv); const nb = Object.keys(S.badges || {}).filter((k) => BADGES.some((b) => b.id === k)).length;
  const sw = (key, label, sub, c, i) => `<div class="item"><span class="tile round ${c}">${ico(i)}</span><div class="main"><b>${label}</b><span>${sub}</span></div><button class="switch" role="switch" aria-checked="${!!S.user[key]}" aria-label="${label}" data-act="toggle" data-key="${key}"></button></div>`;
  const ret = S.user.retention || 0.9;
  const acc = (c, i, t, body) => `<details class="acc"><summary><span class="tile round ${c}">${ico(i)}</span><span class="grow">${t}</span>${chev()}</summary><div class="body">${body}</div></details>`;
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><h1 style="font-size:26px">Perfil</h1></div>
    <div class="phead">
      <button class="phead-av" data-act="av-open" aria-label="Editar avatar">${avatarSVG(avatarConfig(), { title: 'Seu avatar' })}<span class="phead-edit">${ico('edit')}</span></button>
      <h2 class="phead-name">${esc(S.user.name || 'Estudante')}</h2>
      <span class="phead-sub">${p ? esc(p.l) : 'Memory'}${S.streak.count >= 7 ? ' · em ritmo de ' + S.streak.count + ' dias' : ''}</span>
      <div class="phead-lv"><div class="lvrow"><b>Nível ${lv}</b><span class="num">${S.xp - lo} / ${hi - lo} XP</span></div><div class="bar"><i class="o" style="width:${Math.max(3, Math.min(100, ((S.xp - lo) / (hi - lo)) * 100))}%"></i></div></div>
      <div class="phead-stats">
        <div><span class="tile c-peach">${ico('flame')}</span><b class="num">${cnt(streakNow())}</b><span>dias seguidos</span></div>
        <div><span class="tile c-blue">${ico('trophy')}</span><b class="num">${nb}/${BADGES.length}</b><span>conquistas</span></div>
        <div><span class="tile c-mint">${coinIco()}</span><b class="num">${cnt(coinsBal())}</b><span>moedas</span></div>
      </div>
      ${S.user.avatar ? `<button class="btn btn-ghost btn-sm btn-block" data-act="av-open">${ico('edit')} Editar avatar</button>` : `<button class="btn btn-orange btn-sm btn-block" data-act="av-open">Montar meu avatar</button>`}
    </div>
    ${accountBlock()}
    <div class="sec" style="margin-top:4px"><h2>Seus dados</h2></div>
    <div class="field"><label for="pf-name">Nome</label><input id="pf-name" class="input" value="${esc(S.user.name)}" maxlength="40" placeholder="Seu nome"></div>
    <div class="sec" style="margin-top:4px"><h2>Estudo</h2></div>
    <div class="field"><span class="flabel">Objetivo</span><div class="choice-list">${PERSONAS.map((x, i) => `<button class="choice pick" data-act="persona" data-id="${x.id}" aria-pressed="${S.user.persona === x.id}"><span class="tile round ${['c-peach', 'c-blue', 'c-yellow', 'c-mint'][i]}">${ico(['exam', 'read', 'school', 'work'][i])}</span><div class="main"><b>${x.l}</b><span>${x.d}</span></div><i class="radio"></i></button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Meta diária de questões</span><div class="seg" role="group">${[5, 10, 20, 30].map((n) => `<button data-act="goal" data-n="${n}" aria-pressed="${S.user.goal === n}">${n}</button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Retenção desejada</span><div class="seg" role="group">${[0.85, 0.9, 0.95].map((r) => `<button data-act="retention" data-r="${r}" aria-pressed="${Math.abs(ret - r) < 0.001}">${Math.round(r * 100)}%</button>`).join('')}</div><span class="tiny" style="font-size:13px">Mais alto significa mais revisões por dia. 90% é o equilíbrio recomendado.</span></div>
    <div class="blk"><div class="sec"><h2>Preferências</h2></div><div class="list">
      ${sw('retrieval', 'Recuperação ativa', 'Pensar antes de ver as alternativas', 'c-blue', 'recall')}
      ${sw('fx', 'Som e vibração', 'Sinal de acerto e erro', 'c-peach', 'bolt')}
      <button class="item" data-act="${serverReady() ? 'push-open' : 'remind-open'}"><span class="tile round c-lilac">${ico(serverReady() ? 'bell' : 'clock')}</span><div class="main"><b>Lembrete diário</b><span>${S.user.push ? 'Notificação no celular ativada' : S.user.remind ? 'Todo dia às ' + esc(S.user.remind) : serverReady() ? 'Notificação no celular quando não estudar' : 'Um alerta no calendário do celular'}</span></div>${chev()}</button>
      <button class="item" data-act="exam-open"><span class="tile round c-blue">${ico('exam')}</span><div class="main"><b>Objetivo e data da prova</b><span>${examInfo() ? esc(examInfo().name) + ' · ' + new Date(examInfo().at).toLocaleDateString('pt-BR') : 'Ainda não definido'}</span></div>${chev()}</button>
      <div class="item"><span class="tile round c-mint">${ico('shield')}</span><div class="main"><b>Seus dados</b><span>${loggedIn() ? 'Na sua conta Memory, sincronizados' : cloud.status === 'cloud' ? 'Salvos na sua conta e sincronizados' : 'Salvos neste aparelho'}</span></div></div>
    </div></div>
    <div class="blk"><div class="sec"><h2>Sobre o método</h2></div><div class="list">
      ${acc('c-pink', 'alert', 'Por que ler não é estudar', '<p>Reler gera familiaridade, e familiaridade parece domínio. É a ilusão de competência. Só o esforço de lembrar sem olhar mostra o que você sabe e fortalece a memória.</p>')}
      ${acc('c-blue', 'layers', 'Os 4 pilares', '<p><b>Casos:</b> um problema prático ancora a teoria.</p><p><b>Recuperação:</b> o resgate ativo cria atalhos neurais.</p><p><b>Feedback imediato:</b> a correção chega antes de o erro se fixar.</p><p><b>Engenharia reversa:</b> você aprende a ler a mente de quem fez a prova.</p>')}
      ${acc('c-lilac', 'chart', 'Memória estimada', '<p>O Memory usa um modelo inspirado no FSRS, o algoritmo do Anki. Cada questão tem uma estabilidade e uma dificuldade, e o app agenda a revisão quando a chance de lembrar cai abaixo da sua meta.</p><p>“Chutei” conta como acerto difícil e “tenho certeza” como acerto fácil.</p>')}
      ${acc('c-yellow', 'book', 'Base científica', '<p>Karpicke & Blunt (2011), Science: a prática de recuperação supera a leitura e o mapeamento conceitual.</p><p>Lu, Sales & Heffernan (2021): o feedback imediato favorece a aquisição conceitual.</p><p>Thorndike e Skinner: a consequência imediata de uma ação molda o comportamento.</p>')}
    </div></div>
    <div class="blk"><div class="sec"><h2>Privacidade</h2></div><div class="list">
      <button class="item" data-act="legal" data-doc="privacidade"><span class="tile round c-mint">${ico('shield')}</span><div class="main"><b>Política de privacidade</b><span>Quais dados usamos e seus direitos (LGPD)</span></div>${chev()}</button>
      <button class="item" data-act="legal" data-doc="termos"><span class="tile round c-blue">${ico('file')}</span><div class="main"><b>Termos de uso</b><span>Regras para usar o Memory</span></div>${chev()}</button>
    </div></div>
    <div class="list">${ui.confirmReset ?
      `<div class="item noicon"><div class="main"><b>Zerar todo o progresso?</b><span>Respostas, XP, sequência e revisões serão apagados. Suas trilhas continuam.</span></div></div><div class="item noicon" style="gap:10px"><button class="btn btn-ghost btn-sm" style="flex:1" data-act="cancel-reset">Cancelar</button><button class="btn btn-danger btn-sm" style="flex:1" data-act="do-reset">Zerar</button></div>` :
      `<button class="item noicon" data-act="ask-reset" style="justify-content:center;color:var(--bad);font-weight:700">Zerar progresso</button>`}</div>
    <p class="tiny" style="text-align:center">Memory 6.0${API && API.on ? ' · servidor ' + (API.db ? 'conectado' : 'sem banco') : ''}</p>
  </div>`;
}

/* ================= Ações ================= */
function simSheet(decks) {
  ui.sheet = `<div class="blk" style="gap:6px"><h2>Simulado</h2><p class="muted small">Até 10 questões sorteadas, 90 segundos por questão e gabarito só no final.</p></div>
    <div class="list">${decks.map((d) => { const lk = PAL[lookOf(d).pal]; return `<button class="item" data-act="sim-deck" data-id="${esc(d.id)}"><span class="tile" style="background:${lk.bg};color:${lk.fg}">${ico('clock')}</span><div class="main"><b>${esc(d.title)}</b><span>${Math.min(10, d.questions.length)} questões · ${Math.round(Math.min(10, d.questions.length) * 1.5)} min</span></div>${chev()}</button>`; }).join('')}
    ${cespeIds(personaDecks()).length >= 10 ? `<button class="item" data-act="sim-cespe"><span class="tile c-lilac"><b style="font-size:13px">C/E</b></span><div class="main"><b>Simulado Cebraspe</b><span>${Math.min(20, cespeIds(personaDecks()).length)} itens Certo/Errado · certo +1, errado −1</span></div>${chev()}</button>` : ''}
    <button class="item" data-act="sim-mix"><span class="tile c-peach">${ico('shuffle')}</span><div class="main"><b>Misto das suas trilhas</b><span>10 questões · 15 min</span></div>${chev()}</button></div>`;
  renderSheet();
}
const ACT = {
  'tab': (d) => { if (d.tab === 'turmas' && API) { API.cls = null; API.confirm = null; } ui.tab = d.tab; ui.deck = null; ui.confirmDelete = false; ui.confirmReset = false; render(); $('#view').scrollTop = 0; },
  'cat': (d) => { ui.cat = d.id; document.querySelectorAll('.fchip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === d.id))); const g = document.getElementById('deck-grid'); if (g) g.innerHTML = deckGrid(); },
  'edit-name': () => { const n = document.getElementById('pf-name'); if (n) { n.focus(); n.select(); } },
  'onb-next': () => { const n = document.getElementById('onb-name'); if (n) S.user.name = n.value.trim(); ui.onb++; render(); $('#view').scrollTop = 0; },
  'onb-finish': () => { S.user.onboarded = true; persist(); ui.tab = 'home'; render(); setTimeout(diagOffer, REDUCED ? 0 : 450); },
  'persona': (d) => { const n = document.getElementById('onb-name') || document.getElementById('pf-name'); if (n) S.user.name = n.value.trim(); S.user.persona = d.id; if (S.user.onboarded) persist(); render(); },
  'goal': (d) => { S.user.goal = Number(d.n); if (S.user.onboarded) persist(); render(); },
  'retention': (d) => { S.user.retention = Number(d.r); persist(); render(); },
  'toggle': (d) => { S.user[d.key] = !S.user[d.key]; persist(); render(); },
  'quick': () => startCycle({ decks: personaDecks(), size: 3, title: 'Destravar' }),
  'quick-deck': (d) => startCycle({ decks: [d.id], size: 3, title: 'Destravar' }),
  'ce-deck': (d) => { const dk = deckById(d.id); if (!dk) return; const ids = shuffle(dk.questions.filter((q) => q.type === 'ce').map((q) => q.id)).sort((a, b) => ((S.cards[a] && S.cards[a].s ? retr(S.cards[a]) : -1) - (S.cards[b] && S.cards[b].s ? retr(S.cards[b]) : -1))); startCycle({ ids: ids.slice(0, 10), size: Math.min(10, ids.length), title: 'Certo ou Errado' }); },
  'cycle-all': () => startCycle({ decks: personaDecks(), size: Math.max(5, Math.min(10, S.user.goal)), title: 'Sessão' }),
  'review-all': () => startCycle({ ids: dueIds(), size: 20, title: 'Revisão' }),
  'errors': () => startCycle({ ids: errorIds(), size: 15, title: 'Caderno de erros' }),
  'open-deck': (d) => { ui.sheet = null; ui.tab = 'trilhas'; ui.deck = d.id; ui.confirmDelete = false; ui.qf = 'todas'; ui.qmore = null; render(); $('#view').scrollTop = 0; },
  'qf': (d) => { ui.qf = d.f; ui.qmore = null; rerender(); },
  'qmore': (d) => { ui.qmore = d.id; rerender(); },
  'study-one': (d) => { const x = QINDEX[d.id]; if (x) startCycle({ ids: [d.id], size: 1, title: x.q.topic }); },
  'close-deck': () => { ui.deck = null; render(); },
  'cycle-deck': (d) => { const dk = deckById(d.id); startCycle({ decks: [d.id], size: 10, title: dk ? dk.title : 'Ciclo' }); },
  'review-deck': (d) => startCycle({ decks: [d.id], size: 20, title: 'Revisão', reviewOnly: true }),
  'sim-pick': () => simSheet(personaDecks().map(deckById).filter(Boolean)),
  'sim-deck': (d) => { ui.sheet = null; const dk = deckById(d.id); startCycle({ decks: [d.id], size: 10, title: dk ? dk.title : 'Simulado', mode: 'sim' }); },
  'sim-cespe': (d) => { ui.sheet = null; const ids = cespeIds(d && d.id ? [d.id] : personaDecks()).slice(0, 20); if (ids.length) startCycle({ ids, size: ids.length, title: d && d.id ? deckById(d.id).title : 'Certo ou Errado', mode: 'sim', cespe: true }); },
  'sim-mix': () => { ui.sheet = null; startCycle({ decks: personaDecks(), size: 10, title: 'Misto', mode: 'sim' }); },
  'sim-next': () => { const s = ui.session; if (s.pick == null) return; s.answers[s.queue[s.i]] = s.pick; if (s.i + 1 >= s.queue.length) finishSim(); else nextQuestion(); },
  'sim-skip': () => { const s = ui.session; if (s.i + 1 >= s.queue.length) finishSim(); else nextQuestion(); },
  'ask-delete': () => { ui.confirmDelete = true; render(); },
  'cancel-delete': () => { ui.confirmDelete = false; render(); },
  'delete-deck': (d) => {
    const dk = deckById(d.id); if (!dk || !dk.custom) return;
    dk.questions.forEach((q) => delete S.cards[q.id]);
    CUSTOM = CUSTOM.filter((x) => x.id !== d.id); saveDecksLocal(); reindex(); removeDeckRemote(d.id); persist();
    ui.deck = null; ui.confirmDelete = false; if (imp.done === d.id) imp.done = null; render(); toast('Trilha excluída');
  },
  'share-deck': (d) => {
    const dk = deckById(d.id); if (!dk) return;
    const online = API && API.on && API.db;
    const long = `<textarea id="share-code" class="textarea" readonly style="min-height:${online ? 80 : 110}px;font-size:12px;resize:none">${esc(deckCode(dk))}</textarea>`;
    ui.sheet = `<div class="blk" style="gap:6px"><h2>Compartilhar trilha</h2><p class="muted small">Colegas e alunos recebem as mesmas ${dk.questions.length} questões, com progresso próprio.</p></div>
      ${online ? (loggedIn() ? `<div id="short-box" class="blk" style="gap:8px"><button class="btn btn-orange btn-block" data-act="share-short" data-id="${esc(dk.id)}">Gerar código curto</button></div>` : `<div class="notice" style="display:flex;gap:12px;align-items:center;justify-content:space-between"><span>Entre na conta para gerar um código curto de 6 letras.</span><button class="btn btn-primary btn-sm" data-act="auth-open" data-m="login">Entrar</button></div>`) + `<details class="acc plain"><summary><span class="grow">Código completo (funciona sem internet)</span>${chev()}</summary><div class="body">${long}<button class="btn btn-ghost btn-sm btn-block" data-act="copy-code">Copiar código completo</button></div></details><button class="btn btn-ghost btn-block" data-act="sheet-close">Fechar</button>` :
      `${long}<div class="duo"><button class="btn btn-ghost" data-act="sheet-close">Fechar</button><button class="btn btn-orange" data-act="copy-code">Copiar código</button></div>`}`;
    renderSheet();
  },
  'copy-code': (d, el) => {
    const ta = document.getElementById('share-code'); if (!ta) return;
    const fallback = () => { ta.focus(); ta.select(); el.textContent = 'Selecionado'; };
    try { navigator.clipboard.writeText(ta.value).then(() => { el.textContent = 'Copiado'; }, fallback); } catch (e) { fallback(); }
  },
  'reveal': () => { const s = ui.session; clearInterval(s.tick); s.phase = 'esforco'; s.justRevealed = true; render(); },
  'pick': (d) => {
    const s = ui.session; s.pick = Number(d.i);
    document.querySelectorAll('.opt').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === s.pick)));
    if (s.mode === 'sim') { const b = document.querySelector('[data-act="sim-next"]'); if (b) b.disabled = false; return; }
    if (!document.querySelector('.dock .conf')) render();
  },
  'conf': (d) => answer(d.c),
  'consol': () => { ui.session.phase = 'consol'; render(); $('#view').scrollTop = 0; },
  'next': () => nextQuestion(),
  'train': () => trainPoint(),
  'tutor-chip': (d) => askTutor(d.q),
  'quit': () => {
    if (ui.session.phase === 'summary') { ACT.end(); return; }
    const sim = ui.session.mode === 'sim';
    ui.sheet = `<div class="blk" style="gap:6px"><h2>${sim ? 'Entregar o simulado?' : 'Sair do ciclo?'}</h2><p class="muted small">${sim ? 'As questões não respondidas contam como erradas.' : 'O que você já respondeu fica salvo e entra nas revisões.'}</p></div><div class="duo"><button class="btn btn-ghost" data-act="sheet-close">Continuar</button><button class="btn btn-primary" data-act="${sim ? 'sim-end' : 'end'}">${sim ? 'Entregar' : 'Sair'}</button></div>`;
    renderSheet();
  },
  'sim-end': () => { ui.sheet = null; finishSim(); },
  'sheet-close': () => {
    const sc = document.querySelector('.scrim');
    if (sc && !REDUCED && !sc.classList.contains('closing')) { sc.classList.add('closing'); setTimeout(() => { if (document.querySelector('.scrim') === sc) { ui.sheet = null; renderSheet(); } }, 190); }
    else { ui.sheet = null; renderSheet(); }
  },
  'end': () => { if (ui.session) { clearInterval(ui.session.tick); clearInterval(ui.session.simTick); } ui.session = null; ui.sheet = null; ui.tab = 'home'; render(); $('#view').scrollTop = 0; },
  'again': () => { const p = ui.session.params; ui.session = null; startCycle(p.ids ? { decks: personaDecks(), size: 10, title: 'Sessão' } : p.reviewOnly ? Object.assign({}, p, { reviewOnly: false, title: 'Sessão' }) : p); },
  'imp-qty': (d) => { syncImportFields(); imp.qty = Number(d.n); render(); },
  'imp-clear-file': () => { imp.file = null; imp.text = ''; imp.pages = 0; imp.error = ''; render(); },
  'imp-generate': () => { syncImportFields(); generate(); },
  'imp-cancel': () => { if (imp.abort) imp.abort.abort(); },
  'imp-reset': () => { Object.assign(imp, { file: null, text: '', pages: 0, title: '', focus: '', error: '', done: null, note: '', progress: 0, code: '', codeErr: '' }); render(); },
  'imp-code': async (d, el) => {
    syncImportFields();
    const sc = API && API.on && shortCode(imp.code);
    if (sc) {
      el.disabled = true; el.textContent = 'Buscando...';
      try { const id = await importShortCode(sc); imp.code = ''; imp.codeErr = ''; imp.done = id; imp.note = ''; }
      catch (e) { imp.codeErr = e.message || 'Código não encontrado.'; }
      render(); $('#view').scrollTop = 0; return;
    }
    try { const id = importCode(imp.code); imp.code = ''; imp.codeErr = ''; imp.done = id; imp.note = ''; render(); $('#view').scrollTop = 0; }
    catch (e) { imp.codeErr = 'Código inválido. Confira se copiou o código inteiro, começando por MEMORY1:'; render(); }
  },
  'ask-reset': () => { ui.confirmReset = true; render(); },
  'cancel-reset': () => { ui.confirmReset = false; render(); },
  'do-reset': () => { const u = S.user, own = S.owned; S = blankState(); S.user = u; S.owned = own || {}; S.resetAt = Date.now(); ui.confirmReset = false; persist(); render(); toast('Progresso zerado'); }
};
document.addEventListener('input', (e) => { if (e.target.id === 'deck-q') { ui.q = e.target.value; const g = document.getElementById('deck-grid'); if (g) g.innerHTML = deckGrid(); } });

/* ---------- Detalhes de movimento e acabamento ---------- */
function cnt(n, suf = '') { return `<span data-count="${n}" data-suf="${suf}">${n}${suf}</span>`; }
function runCounters(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count), suf = el.dataset.suf || '';
    if (!isFinite(to) || to === 0) return;
    const t0 = performance.now(), dur = 750;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + suf; if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0' + suf; requestAnimationFrame(step);
  });
}
function markImgs(root) { root.querySelectorAll('img.fade').forEach((im) => { if (im.complete && im.naturalWidth) im.classList.add('ok'); }); }
document.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
document.addEventListener('error', (e) => { if (e.target && e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
function weekStrip() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7; const names = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; const st = streakNow();
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + (i - dow) * DAY); const n = ((S.log[dayKey(d)] || {}).n) || 0;
    html += `<div class="wd${n ? ' done' : ''}${i === dow ? ' today' : ''}${i > dow ? ' fut' : ''}"><span>${names[i]}</span><i>${n ? ico('check') : d.getDate()}</i></div>`;
  }
  return `<div class="card week"><div class="sec"><h2 style="font-size:15px">Sua semana</h2><span class="tiny wk-st">${ico('flame')}${st} ${st === 1 ? 'dia seguido' : 'dias seguidos'}</span></div><div class="wrow">${html}</div></div>`;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.sheet) ACT['sheet-close'](); });
document.addEventListener('input', (e) => {
  if (e.target.id !== 'pf-name') return;
  const b = document.querySelector('.phead-name');
  if (b) b.textContent = e.target.value.trim() || 'Estudante';
});
let pdfReady = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); }); }
function ensurePdf() {
  if (!pdfReady) {
    const base = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    pdfReady = loadScript(base + 'pdf.worker.min.js').then(() => loadScript(base + 'pdf.min.js')).then(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js'; return window.pdfjsLib; });
    pdfReady.catch(() => { pdfReady = null; });
  }
  return pdfReady;
}
async function readFile(file) {
  imp.error = ''; imp.file = file.name; imp.reading = true; imp.pages = 0; imp.text = '';
  if (!imp.title) imp.title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 60);
  render();
  try {
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
      const lib = await ensurePdf();
      const pdf = await lib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
      imp.pages = pdf.numPages;
      const parts = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const tc = await (await pdf.getPage(p)).getTextContent();
        const t = tc.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').trim();
        if (t) parts.push('[p. ' + p + ']\n' + t);
      }
      imp.text = parts.join('\n\n');
      if (!imp.text.trim()) imp.error = 'Não encontramos texto neste PDF. Ele parece ser digitalizado (imagem). Tente um PDF com texto selecionável ou cole o conteúdo.';
    } else imp.text = await file.text();
  } catch (e) { imp.error = 'Não foi possível ler este arquivo. Verifique se o PDF não está protegido por senha ou cole o texto manualmente.'; imp.file = null; }
  imp.reading = false; render();
}
function prepareMaterial(text, max = 60000) {
  if (text.length <= max) return { text, cut: false };
  const pages = text.split(/\n\n(?=\[p\. \d+\])/);
  if (pages.length > 3) {
    const per = Math.floor(max / pages.length);
    if (per > 400) return { text: pages.map((p) => p.slice(0, per)).join('\n\n'), cut: true };
    const step = pages.length / Math.floor(max / 1500); const picked = [];
    for (let i = 0; i < pages.length; i += step) picked.push(pages[Math.floor(i)].slice(0, 1500));
    return { text: picked.join('\n\n'), cut: true };
  }
  return { text: text.slice(0, max), cut: true };
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
function validateQuestions(arr, prefix) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  arr.forEach((x, i) => {
    if (!x || typeof x.q !== 'string' || !Array.isArray(x.o) || x.o.length < 3) return;
    const o = x.o.filter((y) => y && typeof y.t === 'string').slice(0, 5).map((y) => ({ t: String(y.t).slice(0, 400), p: PATTERNS[y.p] ? y.p : 'troca', w: String(y.w || '').slice(0, 600) }));
    if (o.length < 3) return;
    const a = Number.isInteger(x.a) && x.a >= 0 && x.a < o.length ? x.a : o.findIndex((y) => y.p === 'correta');
    if (a < 0) return;
    o.forEach((y, j) => { if (j === a) y.p = 'correta'; else if (y.p === 'correta') y.p = 'troca'; });
    out.push({ id: prefix + '_' + i, topic: String(x.topic || 'Seu material').slice(0, 40), c: String(x.c || '').slice(0, 800), q: x.q.slice(0, 500), a, src: String(x.src || '').slice(0, 80), o });
  });
  return out;
}
async function generate() {
  if (!aiReady() || imp.busy) return;
  const raw = (imp.text || '').trim(); if (!raw) return;
  const { text, cut } = prepareMaterial(raw);
  imp.busy = true; imp.error = ''; imp.progress = 0; imp.note = cut ? 'O material era longo, então usamos trechos distribuídos ao longo de todo o conteúdo. Para cobrir tudo, importe por capítulos.' : '';
  const ctl = new AbortController(); imp.abort = ctl; render();
  const title = (imp.title || imp.file || 'Meu material').trim();
  try {
    const result = await AI.questions(text, imp.qty, title, imp.focus.trim(), ({ text: t }) => {
        const n = (t.match(/"q"\s*:/g) || []).length; const p = Math.min(0.98, n / imp.qty);
        if (p !== imp.progress) { imp.progress = p; const st = document.getElementById('gen-status'), tr = document.querySelector('.gen .track i'); if (st) st.textContent = 'Questão ' + Math.min(imp.qty, Math.max(1, n)) + ' de ' + imp.qty; if (tr) tr.style.width = Math.max(6, p * 100) + '%'; }
    }, ctl.signal);
    const id = 'u' + Date.now().toString(36);
    const qs = validateQuestions(result, id);
    if (!qs.length) throw { code: 'invalid_json' };
    addDeck({ id, title: title.slice(0, 60), subtitle: 'Seu material', blurb: 'Questões geradas a partir de ' + (imp.file || 'texto colado') + '.', color: 'orange', tag: 'Seu material', custom: true, createdAt: Date.now(), source: imp.file || 'texto colado', questions: qs });
    imp.done = id;
  } catch (e) {
    const code = e && e.code;
    imp.error = code === 'cancelled' ? '' : aiError(e, 'Não foi possível gerar agora. Tente novamente em instantes.');
  }
  imp.busy = false; imp.abort = null; render(); $('#view').scrollTop = 0;
}
function addDeck(deck) { CUSTOM.unshift(deck); saveDecksLocal(); reindex(); pushDeck(deck); checkBadges(); persist(); }

/* ---------- Compartilhar por código ---------- */
function deckCode(d) {
  const payload = { t: d.title, b: d.blurb, q: d.questions.map((q) => ({ topic: q.topic, c: q.c, q: q.q, a: q.a, src: q.src, o: q.o })) };
  return 'MEMORY1:' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
function importCode(code) {
  const m = code.trim().match(/MEMORY1:([A-Za-z0-9+/=\s]+)/);
  if (!m) throw new Error('formato');
  const data = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/\s+/g, '')))));
  const id = 'u' + Date.now().toString(36);
  const qs = validateQuestions(data.q, id);
  if (!qs.length) throw new Error('vazio');
  addDeck({ id, title: String(data.t || 'Trilha compartilhada').slice(0, 60), subtitle: 'Trilha compartilhada', blurb: String(data.b || 'Trilha recebida por código.').slice(0, 300), color: 'navy', tag: 'Compartilhada', custom: true, createdAt: Date.now(), source: 'código de trilha', questions: qs });
  return id;
}

function syncImportFields() {
  const t = document.getElementById('imp-text'); if (t) imp.text = t.value;
  const ti = document.getElementById('imp-title'); if (ti) imp.title = ti.value;
  const f = document.getElementById('imp-focus'); if (f) imp.focus = f.value;
  const c = document.getElementById('imp-code'); if (c) imp.code = c.value;
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.classList.contains('scrim') && e.target.closest('[data-stop]')) return;
  if (el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});
document.addEventListener('submit', (e) => {
  if (e.target.dataset.form === 'tutor') { e.preventDefault(); const inp = document.getElementById('tutor-input'); if (inp && inp.value.trim()) askTutor(inp.value); }
});
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'imp-text') { imp.text = e.target.value; const btn = document.querySelector('[data-act="imp-generate"]'); if (btn) btn.disabled = !(imp.text.trim() && aiReady() && !imp.reading); }
  else if (id === 'imp-title') imp.title = e.target.value;
  else if (id === 'imp-focus') imp.focus = e.target.value;
  else if (id === 'imp-code') imp.code = e.target.value;
  else if (id === 'pf-name') { S.user.name = e.target.value.trim(); clearTimeout(persist.t); persist.t = setTimeout(persist, 600); }
});
document.addEventListener('change', (e) => { if (e.target.id === 'imp-file' && e.target.files && e.target.files[0]) { syncImportFields(); readFile(e.target.files[0]); } });
['dragover', 'dragleave', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => {
  const drop = e.target.closest && e.target.closest('#drop'); if (!drop) return;
  e.preventDefault(); drop.classList.toggle('over', ev === 'dragover');
  if (ev === 'drop' && e.dataTransfer.files[0]) { syncImportFields(); readFile(e.dataTransfer.files[0]); }
}));
document.addEventListener('keydown', (e) => {
  if (!ui.session || e.target.closest('input,textarea,button')) return;
  const s = ui.session;
  if ((s.phase === 'esforco' || s.phase === 'sim') && /^[1-4a-eA-E]$/.test(e.key)) {
    const ce = QINDEX[s.queue[s.i]].q.type === 'ce';
    const idx = /\d/.test(e.key) ? Number(e.key) - 1 : ce ? 'ce'.indexOf(e.key.toLowerCase()) : 'abcd'.indexOf(e.key.toLowerCase());
    if (s.order[idx] != null) ACT.pick({ i: s.order[idx] });
  } else if (e.key === 'Enter') { const b = document.querySelector('.dock .btn-primary:not([disabled]), .dock .btn-orange'); if (b) b.click(); }
});

/* ================= Inicialização ================= */
render();
initCloud();
initServer();
(async () => {
  try { if (window.claude && typeof window.claude.use === 'function') SAMPLE = await window.claude.use('sample'); } catch (e) { SAMPLE = null; }
  sampleChecked = true;
  if (S.user.onboarded && !ui.session) render();
})();
