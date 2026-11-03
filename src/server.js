/* ================= Conta, sincronização, turmas e IA (back-end do Memory) ================= */
// Quando o app roda no servidor do Memory (Vercel), /api responde e libera: conta, progresso na nuvem,
// turmas com painel do professor, códigos curtos e IA. Sem servidor, tudo continua funcionando no aparelho.
TAG_COLOR['Turma'] = 'c-mint';
DECK_LOOK.ureforco = DECK_LOOK.ureforco || { pal: 'peach', v: 3, icon: 'target' };

const LS_CLASSES = 'memory.classes.v1';
API = {
  on: false, db: false, ai: false, user: null, sync: 'local', lastSync: 0, timer: null, inflight: false, again: false, retry: null,
  classes: (() => { try { return JSON.parse(lsGet(LS_CLASSES) || '[]'); } catch (e) { return []; } })(),
  cls: null, clsLoading: false, clsErr: '', member: null, confirm: null
};
const auth = { mode: 'signup', name: '', email: '', pass: '', err: '', busy: false, show: false, note: '', after: null };
const acct = { pwOpen: false, pwErr: '', delOpen: false, delErr: '', busy: false };

async function api(method, path, body, opts = {}) {
  const init = { method, credentials: 'same-origin', headers: {}, signal: opts.signal, keepalive: !!opts.keepalive };
  if (method !== 'GET') { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body || {}); }
  let r;
  try { r = await fetch('/api/' + path, init); } catch (e) { if (e && e.name === 'AbortError') throw e; const er = new Error('Sem conexão com o servidor. Confira sua internet.'); er.code = 'offline'; throw er; }
  let data = null; try { data = await r.json(); } catch (e) { /* sem corpo */ }
  if (!r.ok) { const er = new Error((data && data.message) || 'Algo deu errado. Tente de novo.'); er.code = (data && data.error) || 'http_' + r.status; er.status = r.status; throw er; }
  return data;
}
const loggedIn = () => !!(API && API.user);
const isTyping = () => { const a = document.activeElement; return !!(a && a.matches && a.matches('input, textarea')); };
function rerender() { if (!ui.session && !isTyping()) render(); }
function saveClassesCache() { lsSet(LS_CLASSES, JSON.stringify(API.classes || [])); }

/* ---------- Trilhas das turmas (entram na lista de trilhas do aluno) ---------- */
function refreshClassDecks() {
  const own = new Set(CUSTOM.map((d) => d.id)); const seen = new Set(); const out = [];
  for (const c of API.classes || []) for (const d of c.decks || []) {
    if (d.builtin || own.has(d.id) || seen.has(d.id) || !Array.isArray(d.questions) || !d.questions.length) continue;
    seen.add(d.id);
    out.push(Object.assign({}, d, { custom: false, classDeck: true, tag: 'Turma', subtitle: 'Turma ' + c.name, blurb: d.blurb || 'Trilha indicada na turma ' + c.name + '.', className: c.name }));
  }
  CLASS_DECKS = out; reindex();
}
function classDeckIds() { const ids = []; for (const c of (API && API.classes) || []) for (const d of c.decks || []) if (!ids.includes(d.id)) ids.push(d.id); return ids; }
refreshClassDecks();

/* ---------- Sincronização do progresso ---------- */
function serverSave() {
  if (!loggedIn()) return;
  clearTimeout(API.timer); API.timer = setTimeout(pushServer, 1500);
}
async function pushServer() {
  if (!loggedIn()) return;
  if (API.inflight) { API.again = true; return; }
  API.inflight = true; API.sync = 'saving'; paintSync();
  try {
    const r = await api('PUT', 'state', { state: S });
    const local = SH.sanitizeState(S);
    const merged = SH.mergeState(local, SH.sanitizeState(r.state));
    const changed = JSON.stringify(merged) !== JSON.stringify(SH.mergeState(local, local));
    S = migrate(merged); lsSet(LS_STATE, JSON.stringify(S));
    API.sync = 'saved'; API.lastSync = Date.now(); clearTimeout(API.retry);
    if (changed) rerender();
  } catch (e) { syncFailed(e); }
  API.inflight = false; paintSync();
  if (API.again) { API.again = false; pushServer(); }
}
function syncFailed(e) {
  if (e && e.status === 401) { API.user = null; API.sync = 'local'; notify('Sua sessão terminou. Entre de novo para sincronizar.'); rerender(); return; }
  API.sync = 'offline';
  clearTimeout(API.retry); API.retry = setTimeout(() => { if (loggedIn()) pushServer(); }, 30000);
}
async function syncDecks() {
  const r = await api('GET', 'decks');
  const del = new Set(r.deleted || []); let changed = false;
  if (del.size) { const n = CUSTOM.length; CUSTOM = CUSTOM.filter((d) => !del.has(d.id)); changed = CUSTOM.length !== n; }
  const remote = new Map((r.decks || []).map((d) => [d.id, d]));
  const local = new Map(CUSTOM.map((d) => [d.id, d]));
  for (const [id, d] of remote) {
    const l = local.get(id);
    if (!l) { CUSTOM.push(d); changed = true; } else if (d.questions.length > l.questions.length) { Object.assign(l, d); changed = true; }
  }
  for (const d of CUSTOM) { const rd = remote.get(d.id); if (!rd || rd.questions.length < d.questions.length) serverPutDeck(d); }
  if (changed) { CUSTOM.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); saveDecksLocal(); }
  refreshClassDecks();
}
function serverPutDeck(d) {
  if (!loggedIn() || !d || !d.custom) return;
  api('PUT', 'decks/' + encodeURIComponent(d.id), { deck: d }).catch((e) => {
    if (e.code === 'deleted') { CUSTOM = CUSTOM.filter((x) => x.id !== d.id); saveDecksLocal(); refreshClassDecks(); rerender(); }
  });
}
function serverDeleteDeck(id) { if (loggedIn()) api('DELETE', 'decks/' + encodeURIComponent(id)).catch(() => {}); }
async function loadClasses() {
  const r = await api('GET', 'classes');
  API.classes = r.classes || []; saveClassesCache(); refreshClassDecks();
}
async function syncAll() {
  if (!loggedIn()) return;
  API.sync = 'saving'; paintSync();
  try {
    await pushServer();
    await syncDecks();
    await loadClasses();
    API.sync = 'saved'; API.lastSync = Date.now();
  } catch (e) { syncFailed(e); }
  paintSync();
}
function syncText() {
  if (!loggedIn()) return 'Salvo neste aparelho';
  if (API.sync === 'saving') return 'Sincronizando...';
  if (API.sync === 'offline') return 'Sem conexão · tentando de novo';
  if (!API.lastSync) return 'Conectado';
  const m = Math.round((Date.now() - API.lastSync) / 60000);
  return 'Sincronizado ' + (m < 1 ? 'agora' : m < 60 ? 'há ' + m + ' min' : 'hoje');
}
function paintSync() { document.querySelectorAll('[data-sync]').forEach((el) => { el.textContent = syncText(); }); }
window.addEventListener('online', () => { if (loggedIn()) pushServer(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && loggedIn() && Date.now() - API.lastSync > 30000) syncAll().then(rerender);
  if (document.visibilityState === 'hidden' && loggedIn() && API.timer) {
    clearTimeout(API.timer); API.timer = null;
    const body = JSON.stringify({ state: S });
    if (body.length < 60000) api('PUT', 'state', { state: S }, { keepalive: true }).catch(() => {});
  }
});

/* ---------- IA: Claude (dentro do claude.ai) ou servidor do Memory ---------- */
function aiReady() { return !!SAMPLE || !!(API && API.ai && API.user); }
function aiNeedsLogin() { return !SAMPLE && API && API.ai && !API.user && API.db; }
async function aiStream(kind, body, onText, signal) {
  let r;
  try { r = await fetch('/api/ai/' + kind, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal }); }
  catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'offline' }; }
  if (!r.ok) { let d = {}; try { d = await r.json(); } catch (e) { /* vazio */ } throw { code: d.error === 'unauthorized' ? 'not_granted' : d.error || 'error', message: d.message }; }
  const rd = r.body.getReader(); const dec = new TextDecoder(); let full = '';
  try {
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      full += dec.decode(value, { stream: true });
      const cut = full.indexOf('\u0000'); if (onText) onText({ text: cut >= 0 ? full.slice(0, cut).trim() : full });
    }
  } catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'error' }; }
  const k = full.indexOf('\u0000ERR:'); if (k >= 0) throw { code: full.slice(k + 5).trim() };
  return full;
}
const AI = {
  async tutor(q, pick, deck, msgs, onText) {
    if (SAMPLE) {
      const sys = SH.tutorSystem(q, pick, deck.title);
      const messages = msgs.map((m, i) => ({ role: m.role, content: i === 0 ? sys + '\n\nPergunta do aluno: ' + m.content : m.content }));
      return (await SAMPLE(messages, { cache: false, modelTier: 'quick', onText })).text;
    }
    return aiStream('tutor', { question: q, pick, deckTitle: deck.title, messages: msgs }, onText);
  },
  async variations(q, deck, n) {
    if (SAMPLE) return SAMPLE.json(SH.variationPrompt(q, deck.title, n), { cache: false });
    const arr = SH.extractJsonArray(await aiStream('variations', { question: q, deckTitle: deck.title, n }));
    if (!arr) throw { code: 'invalid_json' }; return arr;
  },
  async questions(text, n, title, focus, onText, signal) {
    if (SAMPLE) return SAMPLE.json(SH.buildPrompt(text, n, title, focus), { modelTier: 'default', signal, cache: false, onText });
    const arr = SH.extractJsonArray(await aiStream('questions', { material: text, n, title, focus }, onText, signal));
    if (!arr) throw { code: 'invalid_json' }; return arr;
  }
};
function aiError(e, fallback) {
  const c = e && e.code;
  if (c === 'not_granted') return SAMPLE ? 'Permita que o Memory use o Claude quando o pedido aparecer.' : 'Entre na sua conta para usar a IA.';
  if (c === 'rate_limited') return 'Muitos pedidos seguidos. Aguarde um minuto e tente de novo.';
  if (c === 'ai_quota') return (e && e.message) || 'Você atingiu o limite diário da IA. Ele renova amanhã.';
  if (c === 'invalid_json') return 'A resposta veio incompleta. Tente de novo com menos questões.';
  if (c === 'refused') return 'Não foi possível gerar a partir deste conteúdo.';
  if (c === 'offline') return 'Sem conexão com o servidor. Confira sua internet.';
  if (c === 'material_short') return 'O material está curto demais para gerar questões.';
  return fallback;
}

/* ---------- Entrar / criar conta ---------- */
function authSheet() {
  const su = auth.mode === 'signup';
  const hasLocal = Object.keys(S.cards).length > 0;
  return `<form class="blk" data-form="auth" style="gap:16px" novalidate>
    ${su ? `<div class="illo-wrap sm">${illo('sync')}</div>` : ''}<div class="blk" style="gap:6px"><h2>${su ? 'Crie sua conta' : 'Entrar na conta'}</h2>
      <p class="muted small">${esc(auth.note || (su ? 'Grátis. Seu progresso fica salvo e sincroniza entre celular e computador.' : 'Use o e-mail e a senha da sua conta Memory.'))}</p></div>
    <div class="seg" role="group" aria-label="Tipo de acesso"><button type="button" data-act="auth-mode" data-m="signup" aria-pressed="${su}">Criar conta</button><button type="button" data-act="auth-mode" data-m="login" aria-pressed="${!su}">Já tenho conta</button></div>
    ${su ? `<div class="field"><label for="au-name">Nome</label><input id="au-name" name="name" class="input" autocomplete="name" maxlength="60" placeholder="Como quer ser chamado" value="${esc(auth.name)}"></div>` : ''}
    <div class="field"><label for="au-email">E-mail</label><input id="au-email" name="email" type="email" class="input" autocomplete="${su ? 'email' : 'username'}" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="254" placeholder="voce@email.com" value="${esc(auth.email)}"></div>
    <div class="field"><label for="au-pass">Senha</label><div class="pw"><input id="au-pass" name="password" type="${auth.show ? 'text' : 'password'}" class="input" autocomplete="${su ? 'new-password' : 'current-password'}" maxlength="72" placeholder="${su ? 'Mínimo de 8 caracteres' : 'Sua senha'}" value="${esc(auth.pass)}"><button type="button" class="pw-eye" data-act="auth-eye" aria-label="${auth.show ? 'Esconder senha' : 'Mostrar senha'}" aria-pressed="${auth.show}">${ico('eye')}</button></div></div>
    <div id="au-err">${auth.err ? `<div class="notice err" role="alert">${esc(auth.err)}</div>` : ''}</div>
    <button class="btn btn-orange btn-block" type="submit" ${auth.busy ? 'disabled' : ''}>${auth.busy ? 'Aguarde...' : su ? 'Criar conta' : 'Entrar'}</button>
    ${su && hasLocal ? '<p class="tiny" style="text-align:center;margin-top:-4px">O progresso deste aparelho vai junto para a conta.</p>' : ''}
    ${!su ? '<button type="button" class="btn btn-text btn-block" data-act="forgot-open" style="margin-top:-6px">Esqueci minha senha</button>' : ''}
  </form>`;
}
function readAuth() {
  const n = document.getElementById('au-name'), e = document.getElementById('au-email'), p = document.getElementById('au-pass');
  if (n) auth.name = n.value; if (e) auth.email = e.value; if (p) auth.pass = p.value;
}
function paintAuth(focus) {
  const sh = document.querySelector('.sheet');
  if (!sh || !document.querySelector('[data-form="auth"]')) { ui.sheet = authSheet(); renderSheet(); }
  else sh.innerHTML = authSheet();
  if (focus) setTimeout(() => { const el = document.getElementById(focus); if (el) el.focus(); }, 60);
}
function openAuth(mode, opts = {}) {
  Object.assign(auth, { mode, err: '', busy: false, note: opts.note || '', after: opts.after || null });
  if (!auth.name && S.user.name) auth.name = S.user.name;
  ui.sheet = authSheet(); renderSheet();
  setTimeout(() => { const el = document.getElementById(mode === 'signup' && !auth.name ? 'au-name' : auth.email ? 'au-pass' : 'au-email'); if (el && matchMedia('(pointer:fine)').matches) el.focus(); }, 80);
}
async function submitAuth() {
  readAuth(); if (auth.busy) return;
  const su = auth.mode === 'signup';
  const email = auth.email.trim();
  if (su && !auth.name.trim()) { auth.err = 'Informe seu nome.'; return paintAuth('au-name'); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { auth.err = 'Informe um e-mail válido.'; return paintAuth('au-email'); }
  if (auth.pass.length < (su ? 8 : 1)) { auth.err = su ? 'A senha precisa ter pelo menos 8 caracteres.' : 'Informe sua senha.'; return paintAuth('au-pass'); }
  auth.busy = true; auth.err = ''; paintAuth();
  try {
    const r = await api('POST', su ? 'auth/signup' : 'auth/login', su ? { name: auth.name.trim(), email, password: auth.pass } : { email, password: auth.pass });
    API.user = r.user;
    if (su && !S.user.name) S.user.name = r.user.name.split(' ')[0];
    const after = auth.after;
    Object.assign(auth, { pass: '', err: '', busy: false, show: false, note: '', after: null });
    ui.sheet = null; renderSheet();
    notify(su ? 'Conta criada. Seu progresso agora fica salvo na nuvem.' : 'Bem-vindo de volta, ' + r.user.name.split(' ')[0] + '.');
    lsSet(LS_STATE, JSON.stringify(S));
    await syncAll();
    if (after) await after();
    render();
  } catch (e) {
    auth.busy = false;
    auth.err = e.message || 'Não foi possível entrar agora.';
    if (e.code === 'email_taken') auth.mode = 'login';
    paintAuth(e.code === 'bad_credentials' ? 'au-pass' : null);
  }
}
document.addEventListener('submit', (e) => { if (e.target.dataset && e.target.dataset.form === 'auth') { e.preventDefault(); submitAuth(); } });

async function logout() {
  try { await api('POST', 'auth/logout'); } catch (e) { /* sai mesmo assim */ }
  try { localStorage.removeItem(LS_STATE); localStorage.removeItem(LS_DECKS); localStorage.removeItem(LS_CLASSES); } catch (e) { /* indisponível */ }
  location.replace(location.pathname);
}

/* ---------- Código curto para trilhas ---------- */
async function importShortCode(code) {
  const r = await api('GET', 'share/' + encodeURIComponent(code));
  const d = r.deck; const id = 'u' + Date.now().toString(36);
  const qs = validateQuestions(d.questions, id);
  if (!qs.length) throw new Error('Esta trilha está vazia.');
  addDeck({ id, title: String(d.title || 'Trilha compartilhada').slice(0, 60), subtitle: 'Compartilhada por ' + (d.by || 'um colega'), blurb: String(d.blurb || 'Trilha recebida por código.').slice(0, 300), color: 'navy', tag: 'Compartilhada', custom: true, createdAt: Date.now(), source: 'código ' + code, questions: qs });
  return id;
}
const shortCode = (s) => { const c = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return /^[A-Z2-9]{6}$/.test(c) ? c : null; };
const appLink = (param, code) => location.origin + location.pathname + '?' + param + '=' + code;
async function shareOrCopy(text, url, el) {
  if (navigator.share && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ title: 'Memory', text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url ? text + ' ' + url : text); if (el) el.textContent = 'Copiado'; notify('Copiado'); } catch (e) { notify('Não foi possível copiar. Selecione o código e copie.'); }
}

/* ---------- Turmas ---------- */
async function openClass(id) {
  ui.tab = 'turmas'; API.member = null; API.confirm = null;
  API.cls = { id }; API.clsLoading = true; API.clsErr = ''; render(); $('#view').scrollTop = 0;
  try { const r = await api('GET', 'classes/' + id); if (API.cls && API.cls.id === id) API.cls = r.class; }
  catch (e) { API.clsErr = e.message; if (e.status === 404) { API.classes = API.classes.filter((c) => c.id !== id); saveClassesCache(); refreshClassDecks(); } }
  API.clsLoading = false; if (ui.tab === 'turmas') render();
}
async function joinClass(code, silent) {
  const c = shortCode(code);
  if (!c) { if (!silent) notify('O código da turma tem 6 letras e números.'); return; }
  const r = await api('POST', 'classes/join', { code: c });
  await loadClasses();
  notify((r.already ? 'Você já participa de “' : 'Você entrou em “') + r.class.name + '”.');
  if (S.user.onboarded) await openClass(r.class.id);
}
const rel = (t) => { if (!t) return 'nunca'; const m = Math.round((Date.now() - t) / 60000); if (m < 2) return 'agora'; if (m < 60) return 'há ' + m + ' min'; const h = Math.round(m / 60); if (h < 24) return 'há ' + h + ' h'; const d = Math.round(h / 24); return d === 1 ? 'ontem' : 'há ' + d + ' dias'; };
const pct = (v) => (v == null ? '–' : v + '%');
const ini2 = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function viewTurmas() {
  if (!loggedIn()) {
    return `<div class="page"><div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="perfil" aria-label="Voltar">${ico('back')}</button><span></span></div>
      <div class="empty-state">${illo('class', 'lg')}<h1 style="font-size:24px">Turmas</h1><p class="muted">Entre na sua conta para criar uma turma ou entrar com o código do professor.</p>
      <button class="btn btn-orange btn-block" data-act="auth-open" data-m="signup">Criar conta grátis</button><button class="btn btn-ghost btn-block" data-act="auth-open" data-m="login">Já tenho conta</button></div></div>`;
  }
  if (API.cls) return viewClass();
  const mine = API.classes.filter((c) => c.role === 'owner'), joined = API.classes.filter((c) => c.role !== 'owner');
  const row = (c) => `<button class="item" data-act="cls-open" data-id="${c.id}"><span class="tile ${c.role === 'owner' ? 'c-peach' : 'c-blue'}">${c.role === 'owner' ? ico('chart') : ico('users')}</span><div class="main"><b>${esc(c.name)}</b><span>${c.role === 'owner' ? plural(c.members, 'aluno', 'alunos') + ' · código ' + esc(c.joinCode || '') : 'Professor(a) ' + esc(c.owner) + ' · ' + plural(c.decks.length, 'trilha', 'trilhas')}</span></div>${chev()}</button>`;
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="perfil" aria-label="Voltar">${ico('back')}</button><span></span></div>
    <div class="blk" style="gap:8px"><h1 style="font-size:26px">Turmas</h1><p class="muted small">Professores e empresas acompanham a evolução da turma. Alunos recebem as trilhas e disputam o ranking da semana.</p></div>
    ${API.classes.length ? '' : `<div class="illo-wrap">${illo('class', 'lg')}</div>`}
    <div class="card pad"><div style="display:flex;gap:12px;align-items:center"><span class="tile c-blue">${ico('users')}</span><div><b class="d" style="font-weight:600;display:block">Entrar em uma turma</b><span class="tiny" style="font-size:13px">Digite o código que o professor passou</span></div></div>
      <div class="inline-form"><input id="cls-code" class="input code-in" placeholder="EX: K7PX2M" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Código da turma"><button class="btn btn-primary btn-sm" data-act="cls-join">Entrar</button></div></div>
    ${joined.length ? `<div class="blk"><div class="sec"><h2>Suas turmas</h2></div><div class="list">${joined.map(row).join('')}</div></div>` : ''}
    <div class="blk"><div class="sec"><h2>Turmas que você criou</h2></div>
      ${mine.length ? `<div class="list">${mine.map(row).join('')}</div>` : ''}
      <div class="card pad"><div style="display:flex;gap:12px;align-items:center"><span class="tile c-peach">${ico('plus')}</span><div><b class="d" style="font-weight:600;display:block">Criar turma</b><span class="tiny" style="font-size:13px">Para professores, cursinhos e equipes</span></div></div>
        <div class="inline-form"><input id="cls-name" class="input" placeholder="Ex.: 3º B · Noite" maxlength="60" autocomplete="off" aria-label="Nome da turma"><button class="btn btn-orange btn-sm" data-act="cls-create">Criar</button></div></div>
    </div>
  </div>`;
}

function viewClass() {
  const c = API.cls;
  const back = `<div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="cls-back" aria-label="Voltar">${ico('back')}</button>${c.role === 'owner' ? `<button class="icon-btn" data-act="cls-refresh" aria-label="Atualizar">${ico('refresh')}</button>` : '<span></span>'}</div>`;
  if (API.clsLoading && !c.name) return `<div class="page">${back}<div class="skel" style="height:150px"></div><div class="skel" style="height:90px"></div><div class="skel" style="height:220px"></div></div>`;
  if (API.clsErr && !c.name) return `<div class="page">${back}<div class="notice err">${esc(API.clsErr)}</div><button class="btn btn-ghost btn-block" data-act="cls-open" data-id="${esc(c.id)}">Tentar de novo</button></div>`;
  const decks = (c.decks || []).map((d) => (d.builtin ? deckById(d.id) || d : deckById(d.id) || d));
  const deckRow = (d) => {
    const real = deckById(d.id); const st = real ? deckStats(real) : null;
    return `<div class="item"><span class="tile ${d.builtin ? 'c-blue' : 'c-mint'}">${ico('decks')}</span><button class="main" data-act="open-deck" data-id="${esc(d.id)}" style="text-align:left"><b>${esc(d.title)}</b><span>${real ? plural(real.questions.length, 'questão', 'questões') + (st ? ' · você: ' + st.pct + '%' : '') : 'Trilha do Memory'}</span></button>${c.role === 'owner' ? `<button class="icon-btn flat" data-act="cls-rm-deck" data-id="${esc(d.id)}" aria-label="Remover trilha da turma">${ico('x')}</button>` : chev()}</div>`;
  };
  const ranking = (c.ranking || []).length ? `<div class="blk"><div class="sec"><h2>Ranking da semana</h2><span class="tiny">acertos em 7 dias</span></div><div class="list rank">${c.ranking.map((r, i) => `<div class="item ${r.me ? 'me' : ''}"><span class="pos num">${i + 1}</span>${avatarOf(r.name, r.avatar)}<div class="main"><b>${esc(r.name)}${r.me ? ' <span class="tag c-peach">você</span>' : ''}</b><span>${plural(r.week, 'resposta', 'respostas')} · ${ico('flame')} ${r.streak}</span></div><span class="end num" style="font-family:var(--display);color:var(--ink)">${r.weekOk}</span></div>`).join('')}</div></div>` : '';
  if (c.role !== 'owner') {
    return `<div class="page">${back}
      <div class="cls-hero"><span class="tag" style="background:rgba(255,255,255,.14);color:#fff">Turma</span><h1>${esc(c.name)}</h1><p>${plural(c.members, 'aluno', 'alunos')}</p></div>
      <div class="blk"><div class="sec"><h2>Trilhas da turma</h2></div>${decks.length ? `<div class="list">${decks.map(deckRow).join('')}</div>` : '<div class="empty">O professor ainda não indicou trilhas.</div>'}</div>
      ${ranking}
      <div class="list">${API.confirm === 'leave' ? `<div class="item noicon"><div class="main"><b>Sair da turma?</b><span>Seu progresso continua salvo na sua conta.</span></div></div><div class="item noicon" style="gap:10px"><button class="btn btn-ghost btn-sm" style="flex:1" data-act="cls-confirm" data-v="">Cancelar</button><button class="btn btn-danger btn-sm" style="flex:1" data-act="cls-leave">Sair</button></div>` : `<button class="item noicon" data-act="cls-confirm" data-v="leave" style="justify-content:center;color:var(--bad);font-weight:700">Sair da turma</button>`}</div>
    </div>`;
  }
  const o = c.overview || {};
  const TRAP = (k) => (PATTERNS[k] ? PATTERNS[k].l : k);
  const student = (s) => {
    const sm = s.summary; const open = API.member === s.id;
    const status = sm.week ? `<span class="dotk ok"></span>ativo` : sm.answered ? `<span class="dotk warn"></span>parado` : `<span class="dotk"></span>não começou`;
    return `<div class="member ${open ? 'open' : ''}"><button class="item" data-act="cls-member" data-id="${s.id}" aria-expanded="${open}">${avatarOf(s.name, s.summary.avatar)}<div class="main"><b>${esc(s.name)}</b><span>${status} · ${rel(sm.lastActive || s.lastSeen)}</span></div><div class="mstats"><b class="num">${pct(sm.accuracy)}</b><span>acerto</span></div>${chev()}</button>
      ${open ? `<div class="mdetail">
        <div class="mini4"><div><b class="num">${sm.week}</b><span>na semana</span></div><div><b class="num">${pct(sm.memory)}</b><span>memória</span></div><div><b class="num">${sm.streak}</b><span>sequência</span></div><div><b class="num">${sm.answered}</b><span>no total</span></div></div>
        ${decks.length ? decks.map((d) => { const p = (s.decks || {})[d.id] || { pct: 0, seen: 0, t: 0 }; return `<div class="dprog"><div class="dprog-h"><span>${esc(d.title)}</span><b class="num">${p.pct}%</b></div><div class="bar"><i class="${p.pct >= 70 ? 'g' : 'o'}" style="width:${p.pct}%"></i></div><span class="tiny">${p.seen} de ${p.t} questões vistas${p.accuracy != null ? ' · ' + p.accuracy + '% de acerto' : ''}</span></div>`; }).join('') : ''}
        ${sm.traps.length ? `<p class="tiny">Mais cai em: ${sm.traps.map(([k]) => esc(TRAP(k))).join(', ')}</p>` : ''}
        <p class="tiny">${esc(s.email)} · entrou ${new Date(s.joinedAt).toLocaleDateString('pt-BR')}</p>
        ${API.confirm === 'rm:' + s.id ? `<div class="duo"><button class="btn btn-ghost btn-sm" data-act="cls-confirm" data-v="">Cancelar</button><button class="btn btn-danger btn-sm" data-act="cls-rm-member" data-id="${s.id}">Remover</button></div>` : `<button class="btn btn-text btn-sm" style="color:var(--bad)" data-act="cls-confirm" data-v="rm:${s.id}">Remover da turma</button>`}
      </div>` : ''}</div>`;
  };
  return `<div class="page">${back}
    <div class="cls-hero"><span class="tag" style="background:rgba(255,255,255,.14);color:#fff">Painel do professor</span><h1>${esc(c.name)}</h1>
      <div class="codebox"><div><small>Código da turma</small><b class="num">${esc(c.joinCode)}</b></div><div class="cb-act"><button class="icon-btn glassy" data-act="cls-copy" aria-label="Copiar código">${ico('copy')}</button></div></div>
      <div class="hero-actions"><button class="btn btn-orange btn-sm" data-act="cls-share">${ico('share')} Convidar alunos</button><button class="link-light" data-act="cls-newcode">Gerar novo código</button></div></div>
    <div class="kgrid">
      <div class="kcard c-blue"><span class="tile" style="background:var(--surface)">${ico('users')}</span><b class="num">${cnt(o.students || 0)}</b><span>alunos · ${o.activeWeek || 0} ativos</span></div>
      <div class="kcard c-peach"><span class="tile" style="background:var(--surface)">${ico('layers')}</span><b class="num">${cnt(o.weekAnswers || 0)}</b><span>respostas na semana</span></div>
      <div class="kcard c-mint"><span class="tile" style="background:var(--surface)">${ico('target')}</span><b class="num">${o.accuracy == null ? '–' : cnt(o.accuracy, '%')}</b><span>acerto médio</span></div>
      <div class="kcard c-lilac"><span class="tile" style="background:var(--surface)">${ico('mind')}</span><b class="num">${o.memory == null ? '–' : cnt(o.memory, '%')}</b><span>memória média</span></div>
    </div>
    ${(o.traps || []).length ? `<div class="card pad"><b class="d" style="font-weight:600">Pegadinhas que mais derrubam a turma</b><div class="chips" style="margin-top:4px">${o.traps.map(([k, v]) => `<span class="tag c-pink">${esc(TRAP(k))} · ${v}</span>`).join('')}</div><span class="tiny" style="font-size:13px">Vale revisar esses padrões em aula.</span></div>` : ''}
    <button class="item report" data-act="cls-report"><span class="tile c-mint">${ico('download')}</span><div class="main"><b>Baixar relatório da turma</b><span>Planilha para Excel com o desempenho de cada aluno</span></div>${chev()}</button>
    <div class="blk"><div class="sec"><h2>Trilhas da turma</h2><button class="link" data-act="cls-add-deck">Adicionar</button></div>${decks.length ? `<div class="list">${decks.map(deckRow).join('')}</div>` : `<button class="empty dashed" data-act="cls-add-deck">${ico('plus')} Indique trilhas para a turma estudar</button>`}</div>
    <div class="blk"><div class="sec"><h2>Alunos</h2><span class="tiny num" style="font-weight:700">${(c.students || []).length}</span></div>
      ${(c.students || []).length ? `<div class="list">${c.students.map(student).join('')}</div>` : `<div class="empty">Ninguém entrou ainda. Compartilhe o código <b>${esc(c.joinCode)}</b> com a turma.</div>`}</div>
    ${ranking}
    <div class="list">${API.confirm === 'del' ? `<div class="item noicon"><div class="main"><b>Excluir a turma?</b><span>Os alunos saem da turma. O progresso de cada um continua na conta deles.</span></div></div><div class="item noicon" style="gap:10px"><button class="btn btn-ghost btn-sm" style="flex:1" data-act="cls-confirm" data-v="">Cancelar</button><button class="btn btn-danger btn-sm" style="flex:1" data-act="cls-delete">Excluir</button></div>` : `<button class="item noicon" data-act="cls-confirm" data-v="del" style="justify-content:center;color:var(--bad);font-weight:700">Excluir turma</button>`}</div>
  </div>`;
}
function addDeckSheet() {
  const c = API.cls; const has = new Set((c.decks || []).map((d) => d.id));
  const mine = CUSTOM.filter((d) => !has.has(d.id)), builtin = BUILTIN_DECKS.filter((d) => !has.has(d.id));
  const row = (d, b) => { const lk = PAL[lookOf(d).pal]; return `<button class="item" data-act="cls-add" data-id="${esc(d.id)}" data-b="${b ? 1 : ''}"><span class="tile" style="background:${lk.bg};color:${lk.fg}">${ico('decks')}</span><div class="main"><b>${esc(d.title)}</b><span>${plural(d.questions.length, 'questão', 'questões')}</span></div>${ico('plus')}</button>`; };
  ui.sheet = `<div class="blk" style="gap:6px"><h2>Adicionar trilha</h2><p class="muted small">Os alunos recebem a trilha em Início e em Trilhas. Você acompanha o progresso de cada um.</p></div>
    ${mine.length ? `<div class="blk" style="gap:8px"><span class="flabel">Suas trilhas</span><div class="list">${mine.map((d) => row(d, false)).join('')}</div></div>` : `<div class="notice">Crie uma trilha com seu PDF em Trilhas › Criar para indicar material próprio.</div>`}
    ${builtin.length ? `<div class="blk" style="gap:8px"><span class="flabel">Trilhas do Memory</span><div class="list">${builtin.map((d) => row(d, true)).join('')}</div></div>` : ''}
    <button class="btn btn-ghost btn-block" data-act="sheet-close">Fechar</button>`;
  renderSheet();
}

/* ---------- Conta ---------- */
function viewConta() {
  if (!loggedIn()) { ui.tab = 'perfil'; return viewProfile(); }
  const u = API.user;
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="perfil" aria-label="Voltar">${ico('back')}</button><span></span></div>
    <div class="blk" style="gap:8px"><h1 style="font-size:26px">Conta</h1></div>
    <div class="pcard"><span class="avatar">${avatarSVG(avatarConfig())}</span><div style="min-width:0"><b>${esc(u.name)}</b><span style="overflow-wrap:anywhere">${esc(u.email)}</span></div></div>
    <div class="card pad" style="flex-direction:row;align-items:center"><span class="tile c-mint">${ico('cloud')}</span><div style="flex:1;min-width:0"><b class="d" style="font-weight:600;display:block">Progresso na nuvem</b><span class="tiny" style="font-size:13px" data-sync>${syncText()}</span></div><button class="btn btn-ghost btn-sm" data-act="sync-now">Sincronizar</button></div>
    <div class="list">
      <button class="item" data-act="tab" data-tab="turmas"><span class="tile round c-blue">${ico('users')}</span><div class="main"><b>Turmas</b><span>${API.classes.length ? plural(API.classes.length, 'turma', 'turmas') : 'Criar ou entrar com código'}</span></div>${chev()}</button>
      <button class="item" data-act="acct-pw"><span class="tile round c-lilac">${ico('key')}</span><div class="main"><b>Alterar senha</b><span>Os outros aparelhos são desconectados</span></div>${chev()}</button>
      ${acct.pwOpen ? `<form class="item noicon blk" data-form="pw" style="gap:12px;align-items:stretch">
        <div class="field"><label for="pw-cur">Senha atual</label><input id="pw-cur" type="password" class="input" autocomplete="current-password" maxlength="72"></div>
        <div class="field"><label for="pw-new">Nova senha</label><input id="pw-new" type="password" class="input" autocomplete="new-password" maxlength="72" placeholder="Mínimo de 8 caracteres"></div>
        ${acct.pwErr ? `<div class="notice err">${esc(acct.pwErr)}</div>` : ''}
        <button class="btn btn-primary btn-sm" type="submit" ${acct.busy ? 'disabled' : ''}>Salvar nova senha</button></form>` : ''}
      <button class="item" data-act="acct-others"><span class="tile round c-peach">${ico('shield')}</span><div class="main"><b>Desconectar outros aparelhos</b><span>Use se perdeu o celular ou entrou em outro computador</span></div>${chev()}</button>
      <button class="item" data-act="acct-export"><span class="tile round c-mint">${ico('download')}</span><div class="main"><b>Baixar meus dados</b><span>Cópia completa em JSON (LGPD)</span></div>${chev()}</button>
      <button class="item" data-act="acct-logout"><span class="tile round c-yellow">${ico('logout')}</span><div class="main"><b>Sair da conta</b><span>O progresso continua salvo na nuvem</span></div>${chev()}</button>
    </div>
    <div class="list">${acct.delOpen ? `<form class="item noicon blk" data-form="del" style="gap:12px;align-items:stretch"><div class="main"><b>Excluir conta para sempre?</b><span>Progresso, trilhas e turmas criadas por você serão apagados do servidor. Não dá para desfazer.</span></div>
        <div class="field"><label for="del-pass">Confirme com sua senha</label><input id="del-pass" type="password" class="input" autocomplete="current-password" maxlength="72"></div>
        ${acct.delErr ? `<div class="notice err">${esc(acct.delErr)}</div>` : ''}
        <div class="duo"><button class="btn btn-ghost btn-sm" type="button" data-act="acct-del">Cancelar</button><button class="btn btn-danger btn-sm" type="submit" ${acct.busy ? 'disabled' : ''}>Excluir conta</button></div></form>` :
      `<button class="item noicon" data-act="acct-del" style="justify-content:center;color:var(--bad);font-weight:700">Excluir conta</button>`}</div>
    <p class="tiny" style="text-align:center">Senha protegida com bcrypt · sessão em cookie seguro · conta criada em ${new Date(u.createdAt).toLocaleDateString('pt-BR')}</p>
  </div>`;
}
document.addEventListener('submit', async (e) => {
  const f = e.target.dataset && e.target.dataset.form;
  if (f === 'pw') {
    e.preventDefault(); if (acct.busy) return;
    const cur = document.getElementById('pw-cur').value, nx = document.getElementById('pw-new').value;
    if (nx.length < 8) { acct.pwErr = 'A nova senha precisa ter pelo menos 8 caracteres.'; return render(); }
    acct.busy = true;
    try { await api('POST', 'auth/password', { current: cur, next: nx }); acct.pwOpen = false; acct.pwErr = ''; notify('Senha alterada. Os outros aparelhos foram desconectados.'); }
    catch (er) { acct.pwErr = er.message; }
    acct.busy = false; render();
  } else if (f === 'del') {
    e.preventDefault(); if (acct.busy) return;
    acct.busy = true;
    try { await api('DELETE', 'auth/me', { password: document.getElementById('del-pass').value }); notify('Conta excluída.'); setTimeout(logout, 600); }
    catch (er) { acct.delErr = er.message; acct.busy = false; render(); }
  }
});

/* ---------- Bloco de conta no Perfil e no Início ---------- */
function extraItems() {
  const items = [];
  if (loggedIn() && API.user.admin) items.push(`<button class="item" data-act="tab" data-tab="admin"><span class="tile round c-lilac">${ico('chart')}</span><div class="main"><b>Administração</b><span>Usuários, uso e auditoria</span></div>${chev()}</button>`);
  if (PWA.can()) items.push(`<button class="item" data-act="pwa-install"><span class="tile round c-peach">${ico('download')}</span><div class="main"><b>Instalar o Memory</b><span>Abre como app, direto da tela inicial, até sem internet</span></div>${chev()}</button>`);
  return items.length ? `<div class="list">${items.join('')}</div>` : '';
}
function accountBlock() {
  if (!API || !API.on || !API.db) return extraItems();
  if (!loggedIn()) return `<div class="promo"><div class="promo-top"><span class="tile" style="background:rgba(255,255,255,.14);color:#fff">${ico('cloud')}</span><div><b>Salve seu progresso na nuvem</b><span>Conta grátis para estudar no celular e no computador, entrar em turmas${API.ai ? ' e usar o tutor com IA' : ''}.</span></div></div>
    <div class="duo"><button class="btn btn-ghost-light btn-sm" data-act="auth-open" data-m="login">Entrar</button><button class="btn btn-orange btn-sm" data-act="auth-open" data-m="signup">Criar conta</button></div></div>${extraItems()}`;
  return `<div class="list"><button class="item" data-act="tab" data-tab="conta"><span class="tile round c-mint">${ico('cloud')}</span><div class="main"><b>${esc(API.user.email)}</b><span data-sync>${syncText()}</span></div>${chev()}</button>
    <button class="item" data-act="tab" data-tab="turmas"><span class="tile round c-blue">${ico('users')}</span><div class="main"><b>Turmas</b><span>${API.classes.length ? API.classes.map((c) => esc(c.name)).slice(0, 2).join(' · ') + (API.classes.length > 2 ? ' · +' + (API.classes.length - 2) : '') : 'Criar ou entrar com código'}</span></div>${chev()}</button></div>${extraItems()}`;
}
function homeClassBlock() {
  if (!loggedIn() || !API.classes.length) return '';
  const owner = API.classes.filter((c) => c.role === 'owner');
  const items = API.classes.slice(0, 3).map((c) => `<button class="item" data-act="cls-open" data-id="${c.id}"><span class="tile ${c.role === 'owner' ? 'c-peach' : 'c-mint'}">${ico(c.role === 'owner' ? 'chart' : 'users')}</span><div class="main"><b>${esc(c.name)}</b><span>${c.role === 'owner' ? 'Painel · ' + plural(c.members, 'aluno', 'alunos') : 'Ranking da semana e trilhas'}</span></div>${chev()}</button>`).join('');
  return `<div class="blk"><div class="sec"><h2>${owner.length === API.classes.length ? 'Suas turmas' : 'Sua turma'}</h2><button class="link" data-act="tab" data-tab="turmas">Ver todas</button></div><div class="list">${items}</div></div>`;
}

/* ---------- Ações ---------- */
Object.assign(ACT, {
  'badge': (d) => {
    const b = BADGES.find((x) => x.id === d.id); if (!b) return;
    const at = S.badges && S.badges[b.id]; const pr = badgeProgress(b.id);
    ui.sheet = `<div class="medal-sheet"><img class="medal big ${at ? '' : 'locked'}" src="img/badges/${b.id}.webp" width="120" height="120" alt=""><h2>${esc(b.l)}</h2><p class="muted small">${esc(b.d)}</p>
      ${at ? `<span class="tag c-mint">Conquistada em ${new Date(at).toLocaleDateString('pt-BR')}</span>` : `<div class="bprog lg"><i style="width:${Math.round((Math.min(pr.v, pr.t) / pr.t) * 100)}%"></i></div><span class="tiny num">${Math.min(pr.v, pr.t)} de ${pr.t}</span>`}</div>
      <button class="btn btn-primary btn-block" data-act="sheet-close">Fechar</button>`;
    renderSheet();
  },
  'auth-open': (d) => openAuth(d.m || 'signup'),
  'auth-mode': (d) => { readAuth(); auth.mode = d.m; auth.err = ''; paintAuth(); },
  'auth-eye': () => { readAuth(); auth.show = !auth.show; paintAuth('au-pass'); },
  'sync-now': async (d, el) => { el.disabled = true; await syncAll(); render(); notify(API.sync === 'saved' ? 'Tudo sincronizado.' : 'Não foi possível sincronizar agora.'); },
  'acct-pw': () => { acct.pwOpen = !acct.pwOpen; acct.pwErr = ''; render(); if (acct.pwOpen) setTimeout(() => { const el = document.getElementById('pw-cur'); if (el) el.focus(); }, 60); },
  'acct-del': () => { acct.delOpen = !acct.delOpen; acct.delErr = ''; render(); },
  'acct-others': async () => { try { await api('POST', 'auth/logout-all'); notify('Os outros aparelhos foram desconectados.'); } catch (e) { notify(e.message); } },
  'acct-logout': () => {
    ui.sheet = `<div class="blk" style="gap:6px"><h2>Sair da conta?</h2><p class="muted small">Seu progresso continua salvo na nuvem. Neste aparelho, os dados locais são apagados para proteger sua privacidade.</p></div><div class="duo"><button class="btn btn-ghost" data-act="sheet-close">Cancelar</button><button class="btn btn-primary" data-act="acct-logout-go">Sair</button></div>`;
    renderSheet();
  },
  'acct-logout-go': async () => { await pushServer(); logout(); },
  'acct-export': async () => {
    try {
      const data = await api('GET', 'export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'memory-meus-dados.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); notify('Download iniciado.');
    } catch (e) { notify(e.message); }
  },
  'cls-open': (d) => openClass(d.id),
  'cls-back': () => { API.cls = null; API.confirm = null; render(); $('#view').scrollTop = 0; },
  'cls-refresh': () => { if (API.cls) openClass(API.cls.id); },
  'cls-member': (d) => { API.member = API.member === d.id ? null : d.id; API.confirm = null; render(); },
  'cls-confirm': (d) => { API.confirm = d.v || null; render(); },
  'cls-join': async (d, el) => {
    const inp = document.getElementById('cls-code'); const c = inp ? inp.value : '';
    if (!shortCode(c)) { notify('O código da turma tem 6 letras e números.'); if (inp) inp.focus(); return; }
    el.disabled = true; try { await joinClass(c); } catch (e) { notify(e.message); el.disabled = false; }
  },
  'cls-create': async (d, el) => {
    const inp = document.getElementById('cls-name'); const name = inp ? inp.value.trim() : '';
    if (name.length < 2) { notify('Dê um nome à turma.'); if (inp) inp.focus(); return; }
    el.disabled = true;
    try { const r = await api('POST', 'classes', { name }); await loadClasses(); notify('Turma criada. Compartilhe o código ' + r.class.joinCode + '.'); await openClass(r.class.id); }
    catch (e) { notify(e.message); el.disabled = false; }
  },
  'cls-copy': async (d, el) => { const c = API.cls; if (!c || !c.joinCode) return; try { await navigator.clipboard.writeText(c.joinCode); notify('Código copiado'); } catch (e) { notify('Código: ' + c.joinCode); } },
  'cls-share': (d, el) => { const c = API.cls; if (c) shareOrCopy('Entre na minha turma "' + c.name + '" no Memory. Código: ' + c.joinCode, appLink('turma', c.joinCode), el); },
  'cls-newcode': async () => { const c = API.cls; if (!c) return; try { const r = await api('POST', 'classes/' + c.id + '/code'); c.joinCode = r.joinCode; await loadClasses(); render(); notify('Novo código: ' + r.joinCode + '. O anterior deixou de valer.'); } catch (e) { notify(e.message); } },
  'cls-add-deck': () => addDeckSheet(),
  'cls-add': async (d) => {
    const c = API.cls; if (!c) return;
    const body = d.b ? { builtin: d.id } : { deck: CUSTOM.find((x) => x.id === d.id) };
    try { await api('POST', 'classes/' + c.id + '/decks', body); ui.sheet = null; renderSheet(); notify('Trilha adicionada à turma'); await loadClasses(); await openClass(c.id); }
    catch (e) { notify(e.message); }
  },
  'cls-rm-deck': async (d) => { const c = API.cls; try { await api('DELETE', 'classes/' + c.id + '/decks/' + encodeURIComponent(d.id)); notify('Trilha removida da turma'); await loadClasses(); await openClass(c.id); } catch (e) { notify(e.message); } },
  'cls-rm-member': async (d) => { const c = API.cls; try { await api('DELETE', 'classes/' + c.id + '/members/' + d.id); notify('Aluno removido'); await openClass(c.id); await loadClasses(); } catch (e) { notify(e.message); } },
  'cls-leave': async () => { const c = API.cls; try { await api('POST', 'classes/' + c.id + '/leave'); API.cls = null; API.confirm = null; await loadClasses(); render(); notify('Você saiu da turma'); } catch (e) { notify(e.message); } },
  'cls-delete': async () => { const c = API.cls; try { await api('DELETE', 'classes/' + c.id); API.cls = null; API.confirm = null; await loadClasses(); render(); notify('Turma excluída'); } catch (e) { notify(e.message); } },
  'share-short': async (d, el) => {
    const dk = deckById(d.id); if (!dk) return;
    el.disabled = true; el.textContent = 'Gerando...';
    try {
      const r = await api('POST', 'share', { deck: dk });
      const box = document.getElementById('short-box');
      if (box) box.innerHTML = `<div class="codebox light"><div><small>Código da trilha</small><b class="num">${r.code}</b></div><div class="cb-act"><button class="btn btn-orange btn-sm" data-act="share-link" data-c="${r.code}" data-t="${esc(dk.title)}">${ico('share')} Enviar</button></div></div><span class="tiny" style="font-size:13px">Quem receber digita o código em Trilhas › Criar, ou abre o link.</span>`;
    } catch (e) { el.disabled = false; el.textContent = 'Gerar código curto'; notify(e.message); }
  },
  'share-link': (d, el) => shareOrCopy('Estude a trilha "' + d.t + '" no Memory. Código: ' + d.c, appLink('t', d.c), el)
});
document.addEventListener('input', (e) => { if (e.target.id === 'cls-code') { const p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); try { e.target.setSelectionRange(p, p); } catch (x) { /* ok */ } } });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'cls-code') { e.preventDefault(); const b = document.querySelector('[data-act="cls-join"]'); if (b) b.click(); }
  if (e.target.id === 'cls-name') { e.preventDefault(); const b = document.querySelector('[data-act="cls-create"]'); if (b) b.click(); }
});

/* ---------- Links (?t=CÓDIGO e ?turma=CÓDIGO) ---------- */
async function handleLinks() {
  const p = new URLSearchParams(location.search);
  const t = shortCode(p.get('t')), turma = shortCode(p.get('turma'));
  if (!t && !turma) return;
  history.replaceState(null, '', location.pathname);
  if (t) {
    try { const id = await importShortCode(t); notify('Trilha adicionada às suas trilhas.'); if (S.user.onboarded) { ui.tab = 'trilhas'; ui.deck = id; } }
    catch (e) { notify(e.message || 'Não foi possível abrir este código.'); }
  }
  if (turma) {
    if (loggedIn()) { try { await joinClass(turma, true); } catch (e) { notify(e.message); } }
    else openAuth('signup', { note: 'Crie sua conta (ou entre) para participar da turma. Leva menos de um minuto.', after: () => joinClass(turma, true).catch((e) => notify(e.message)) });
  }
}


/* ---------- App instalável (PWA) ---------- */
const PWA = {
  evt: null,
  standalone: () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } },
  ios: () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent),
  can() { return !!(API && API.on) && !this.standalone() && (!!this.evt || this.ios()); }
};
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); PWA.evt = e; if (ui.tab === 'perfil') rerender(); });
window.addEventListener('appinstalled', () => { PWA.evt = null; notify('Memory instalado. Abra pela tela inicial.'); rerender(); });
function registerSW() {
  if (!('serviceWorker' in navigator) || !API.on) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    const offer = (w) => { if (w && hadController) showUpdate(w); };
    if (reg.waiting) offer(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); });
    setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
  }).catch(() => { /* sem cache offline */ });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
}
// Nova versão publicada: avisa sem interromper (nunca no meio de um ciclo de estudo).
function showUpdate(worker) {
  if (document.querySelector('.upd')) return;
  const put = () => {
    if (ui.session) return setTimeout(put, 5000);
    const el = document.createElement('div'); el.className = 'upd'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>Nova versão do Memory disponível.</span><button class="btn btn-orange btn-sm" type="button">Atualizar</button>`;
    el.querySelector('button').addEventListener('click', () => { el.querySelector('button').disabled = true; persist(); worker.postMessage({ type: 'skip' }); setTimeout(() => location.reload(), 1500); });
    $('#app').appendChild(el);
  };
  put();
}
/* ---------- Sem internet ---------- */
function paintOnline() {
  let el = document.querySelector('.offline');
  if (navigator.onLine) { if (el) { el.classList.add('back'); setTimeout(() => el.remove(), 1600); el.textContent = 'Conexão de volta · sincronizando'; } return; }
  if (!el) { el = document.createElement('div'); el.className = 'offline'; el.setAttribute('role', 'status'); $('#app').appendChild(el); }
  el.classList.remove('back'); el.textContent = 'Sem internet · seu progresso fica salvo no aparelho';
}
window.addEventListener('offline', paintOnline);
window.addEventListener('online', () => { if (document.querySelector('.offline')) paintOnline(); });
if (!navigator.onLine) setTimeout(paintOnline, 0);

/* ---------- Esqueci a senha / redefinir ---------- */
function forgotSheet(done) {
  return done ? `<div class="blk" style="gap:6px"><h2>${API.email ? 'Confira seu e-mail' : 'Fale com a administração'}</h2><p class="muted small">${API.email ? 'Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Ele vale por 1 hora. Olhe também o spam.' : 'Por segurança, a redefinição é feita por um link que a administração do Memory gera para você. Peça ao seu professor ou ao responsável pela plataforma.'}</p></div><button class="btn btn-primary btn-block" data-act="auth-open" data-m="login">Voltar para o login</button>`
  : `<form class="blk" data-form="forgot" style="gap:16px" novalidate><div class="blk" style="gap:6px"><h2>Esqueci minha senha</h2><p class="muted small">${API.email ? 'Digite o e-mail da sua conta. Você recebe um link para criar uma senha nova.' : 'Digite o e-mail da sua conta para registrarmos o pedido.'}</p></div>
    <div class="field"><label for="fg-email">E-mail</label><input id="fg-email" type="email" class="input" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="254" value="${esc(auth.email)}"></div>
    <div id="fg-err"></div><button class="btn btn-orange btn-block" type="submit">${API.email ? 'Enviar link' : 'Continuar'}</button>
    <button type="button" class="btn btn-text btn-block" data-act="auth-open" data-m="login">Voltar</button></form>`;
}
function resetSheet(email, err, busy) {
  return `<form class="blk" data-form="reset" style="gap:16px" novalidate><div class="blk" style="gap:6px"><h2>Criar nova senha</h2><p class="muted small">Conta ${esc(email)}. Depois de salvar, os outros aparelhos são desconectados.</p></div>
    <input type="email" autocomplete="username" value="${esc(email)}" hidden readonly>
    <div class="field"><label for="rs-pass">Nova senha</label><input id="rs-pass" type="password" class="input" autocomplete="new-password" maxlength="72" placeholder="Mínimo de 8 caracteres"></div>
    <div class="field"><label for="rs-pass2">Repita a senha</label><input id="rs-pass2" type="password" class="input" autocomplete="new-password" maxlength="72"></div>
    ${err ? `<div class="notice err" role="alert">${esc(err)}</div>` : ''}
    <button class="btn btn-orange btn-block" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Salvando...' : 'Salvar e entrar'}</button></form>`;
}
const RESET = { token: null, email: '' };
async function handleReset() {
  const p = new URLSearchParams(location.search); const token = p.get('redefinir');
  if (!token) return;
  history.replaceState(null, '', location.pathname);
  try { const r = await api('POST', 'auth/reset', { token, check: true }); RESET.token = token; RESET.email = r.email; ui.sheet = resetSheet(r.email); renderSheet(); }
  catch (e) { ui.sheet = `<div class="blk" style="gap:6px"><h2>Link de senha</h2><p class="muted small">${esc(e.message)}</p></div><button class="btn btn-primary btn-block" data-act="forgot-open">Pedir outro link</button>`; renderSheet(); }
}
document.addEventListener('submit', async (e) => {
  const f = e.target.dataset && e.target.dataset.form;
  if (f === 'forgot') {
    e.preventDefault();
    const email = document.getElementById('fg-email').value.trim(); auth.email = email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { document.getElementById('fg-err').innerHTML = '<div class="notice err">Informe um e-mail válido.</div>'; return; }
    e.target.querySelector('[type=submit]').disabled = true;
    try { await api('POST', 'auth/forgot', { email }); document.querySelector('.sheet').innerHTML = forgotSheet(true); }
    catch (er) { document.getElementById('fg-err').innerHTML = `<div class="notice err">${esc(er.message)}</div>`; e.target.querySelector('[type=submit]').disabled = false; }
  } else if (f === 'reset') {
    e.preventDefault();
    const a = document.getElementById('rs-pass').value, b = document.getElementById('rs-pass2').value;
    const sh = document.querySelector('.sheet');
    if (a.length < 8) { sh.innerHTML = resetSheet(RESET.email, 'A senha precisa ter pelo menos 8 caracteres.'); return; }
    if (a !== b) { sh.innerHTML = resetSheet(RESET.email, 'As duas senhas não são iguais.'); return; }
    sh.innerHTML = resetSheet(RESET.email, '', true);
    try {
      const r = await api('POST', 'auth/reset', { token: RESET.token, password: a });
      API.user = r.user; RESET.token = null; ui.sheet = null; renderSheet();
      notify('Senha nova salva. Você já está na sua conta.');
      await syncAll(); render();
    } catch (er) { sh.innerHTML = resetSheet(RESET.email, er.message); }
  }
});

/* ---------- Administração ---------- */
const ADM = { data: null, users: null, audit: null, q: '', action: '', loading: false, err: '' };
const ACTION_LABEL = { reset_requested: 'Pediu nova senha', password_reset: 'Senha redefinida', reset_link_created: 'Link de senha gerado', signup: 'Cadastro', login: 'Login', login_failed: 'Login recusado', password_changed: 'Senha alterada', logout_all: 'Saiu dos aparelhos', account_deleted: 'Conta excluída', share_created: 'Código de trilha', class_created: 'Turma criada', class_joined: 'Entrou na turma', class_left: 'Saiu da turma', class_deleted: 'Turma excluída', class_member_removed: 'Aluno removido', class_report: 'Relatório baixado' };
async function loadAdmin(part) {
  ADM.loading = true; ADM.err = ''; rerender();
  try {
    if (!part || part === 'overview') ADM.data = await api('GET', 'admin/overview');
    if (!part || part === 'users') ADM.users = (await api('GET', 'admin/users?q=' + encodeURIComponent(ADM.q))).users;
    if (!part || part === 'audit') ADM.audit = (await api('GET', 'admin/audit?action=' + encodeURIComponent(ADM.action))).events;
  } catch (e) { ADM.err = e.message; }
  ADM.loading = false; if (ui.tab === 'admin') render();
}
function viewAdmin() {
  if (!loggedIn() || !API.user.admin) { ui.tab = 'perfil'; return viewProfile(); }
  if (!ADM.data && !ADM.loading && !ADM.err) setTimeout(() => loadAdmin(), 0);
  const back = `<div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="perfil" aria-label="Voltar">${ico('back')}</button><button class="icon-btn" data-act="adm-refresh" aria-label="Atualizar">${ico('refresh')}</button></div>`;
  const d = ADM.data;
  if (!d) return `<div class="page">${back}<h1 style="font-size:26px">Administração</h1>${ADM.err ? `<div class="notice err">${esc(ADM.err)}</div>` : '<div class="skel" style="height:180px"></div><div class="skel" style="height:220px"></div>'}</div>`;
  const max = Math.max(1, ...d.days.map((x) => x.answers));
  const bars = d.days.map((x, i) => `<div class="abar" title="${x.d.split('-').reverse().join('/')}: ${x.answers} respostas, ${x.signups} cadastros"><i style="height:${Math.max(3, (x.answers / max) * 100)}%"></i>${x.signups ? `<b>${x.signups}</b>` : ''}<span>${i % 2 ? '' : x.d.slice(8)}</span></div>`).join('');
  const TRAP = (k) => (PATTERNS[k] ? PATTERNS[k].l : k);
  const actions = ['', 'signup', 'login', 'login_failed', 'class_created', 'class_joined', 'password_changed', 'account_deleted'];
  return `<div class="page">${back}
    <div class="blk" style="gap:6px"><h1 style="font-size:26px">Administração</h1><p class="muted small">Visão geral do Memory em tempo real · versão ${esc(d.version)}</p></div>
    <div class="kgrid">
      <div class="kcard c-blue"><span class="tile" style="background:var(--surface)">${ico('users')}</span><b class="num">${cnt(d.users.users)}</b><span>usuários · +${d.users.new7} na semana</span></div>
      <div class="kcard c-mint"><span class="tile" style="background:var(--surface)">${ico('flame')}</span><b class="num">${cnt(d.users.active7)}</b><span>ativos em 7 dias · ${d.users.active1} hoje</span></div>
      <div class="kcard c-peach"><span class="tile" style="background:var(--surface)">${ico('layers')}</span><b class="num">${cnt(d.answers.week)}</b><span>respostas na semana</span></div>
      <div class="kcard c-lilac"><span class="tile" style="background:var(--surface)">${ico('target')}</span><b class="num">${d.answers.accuracy == null ? '–' : cnt(d.answers.accuracy, '%')}</b><span>acerto na semana</span></div>
    </div>
    <div class="card pad"><div style="display:flex;flex-direction:column;gap:2px"><b class="d" style="font-weight:600">Últimos 14 dias</b><span class="tiny">barras: respostas · número: cadastros</span></div><div class="achart">${bars}</div></div>
    <div class="list">
      <div class="item"><span class="tile c-blue">${ico('users')}</span><div class="main"><b>${plural(d.classes.classes, 'turma', 'turmas')}</b><span>${plural(d.classes.students, 'aluno vinculado', 'alunos vinculados')}</span></div></div>
      <div class="item"><span class="tile c-peach">${ico('decks')}</span><div class="main"><b>${plural(d.content.decks, 'trilha própria', 'trilhas próprias')}</b><span>${plural(d.content.shares, 'código compartilhado', 'códigos compartilhados')} · ${d.content.share_uses} usos</span></div></div>
      <div class="item"><span class="tile c-lilac">${ico('tutor')}</span><div class="main"><b>IA ${d.ai.enabled ? 'ativa' : 'desligada'}</b><span>${d.ai.enabled ? 'Hoje: ' + plural(d.ai.users, 'pessoa', 'pessoas') + ' · ' + d.ai.units + ' unidades' : 'Configure ANTHROPIC_API_KEY na Vercel'}</span></div></div>
      ${d.traps.length ? `<div class="item"><span class="tile c-pink">${ico('alert')}</span><div class="main"><b>Pegadinhas que mais derrubam</b><span>${d.traps.map(([k, v]) => esc(TRAP(k)) + ' (' + v + ')').join(' · ')}</span></div></div>` : ''}
    </div>
    <div class="blk"><div class="sec"><h2>Usuários</h2><span class="tiny num">${(ADM.users || []).length}</span></div>
      <label class="search">${ico('search')}<input id="adm-q" placeholder="Buscar por nome ou e-mail" value="${esc(ADM.q)}" autocomplete="off" aria-label="Buscar usuário"></label>
      <div class="list">${(ADM.users || []).map((u) => `<div class="item"><span class="avatar sm">${esc(ini2(u.name))}</span><div class="main"><b>${esc(u.name)}</b><span style="overflow-wrap:anywhere">${esc(u.email)} · visto ${rel(u.lastSeen)}</span><span>${u.answered} respostas · ${u.week} na semana${u.accuracy != null ? ' · ' + u.accuracy + '%' : ''}${u.owned ? ' · professor(a) de ' + u.owned : ''}${u.joined ? ' · aluno(a) em ' + u.joined : ''}</span></div><button class="icon-btn flat" data-act="adm-reset" data-id="${u.id}" data-n="${esc(u.name)}" aria-label="Gerar link para redefinir a senha de ${esc(u.name)}">${ico('key')}</button></div>`).join('') || '<div class="empty">Nenhum usuário encontrado.</div>'}</div></div>
    <div class="blk"><div class="sec"><h2>Auditoria</h2></div>
      <div class="chips" role="group" aria-label="Filtrar eventos">${actions.map((a) => `<button class="fchip" data-act="adm-action" data-a="${a}" aria-pressed="${ADM.action === a}">${a ? ACTION_LABEL[a] : 'Tudo'}</button>`).join('')}</div>
      <div class="list">${(ADM.audit || []).map((e) => `<div class="item"><span class="tile ${/failed|deleted|removed/.test(e.action) ? 'c-pink' : 'c-blue'}">${ico(/login|signup/.test(e.action) ? 'user' : /class/.test(e.action) ? 'users' : 'shield')}</span><div class="main"><b>${esc(ACTION_LABEL[e.action] || e.action)}</b><span style="overflow-wrap:anywhere">${esc(e.email || 'sem conta')}${e.ip ? ' · ' + esc(e.ip) : ''}</span></div><span class="end">${rel(e.at)}</span></div>`).join('') || '<div class="empty">Nenhum evento.</div>'}</div></div>
  </div>`;
}
document.addEventListener('input', (e) => {
  if (e.target.id !== 'adm-q') return;
  ADM.q = e.target.value; clearTimeout(ADM.t);
  ADM.t = setTimeout(async () => { try { ADM.users = (await api('GET', 'admin/users?q=' + encodeURIComponent(ADM.q))).users; } catch (er) { return; } const pos = e.target.selectionStart; render(); const el = document.getElementById('adm-q'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) { /* ok */ } } }, 300);
});
async function downloadFile(path, fallbackName) {
  const r = await fetch('/api/' + path, { credentials: 'same-origin' });
  if (!r.ok) { let m = 'Não foi possível baixar agora.'; try { m = (await r.json()).message || m; } catch (e) { /* vazio */ } throw new Error(m); }
  const name = ((r.headers.get('content-disposition') || '').match(/filename="([^"]+)"/) || [])[1] || fallbackName;
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
Object.assign(ACT, {
  'forgot-open': () => { readAuth(); ui.sheet = forgotSheet(false); renderSheet(); },
  'adm-reset': async (d) => {
    try {
      const r = await api('POST', 'admin/users/' + d.id + '/reset-link');
      ui.sheet = `<div class="blk" style="gap:6px"><h2>Link para ${esc(d.n)}</h2><p class="muted small">Envie só para essa pessoa. Vale por 1 hora, funciona uma vez e desconecta os outros aparelhos dela.</p></div>
        <textarea id="share-code" class="textarea" readonly style="min-height:84px;font-size:13px;resize:none">${esc(r.url)}</textarea>
        <div class="duo"><button class="btn btn-ghost" data-act="sheet-close">Fechar</button><button class="btn btn-orange" data-act="copy-code">Copiar link</button></div>`;
      renderSheet();
    } catch (e) { notify(e.message); }
  },
  'adm-refresh': () => loadAdmin(),
  'adm-action': (d) => { ADM.action = d.a || ''; loadAdmin('audit'); },
  'cls-report': async (d, el) => { const c = API.cls; if (!c) return; el.disabled = true; try { await downloadFile('classes/' + c.id + '/report', 'relatorio-turma.csv'); notify('Relatório baixado. Abre direto no Excel.'); } catch (e) { notify(e.message); } el.disabled = false; },
  'pwa-install': async () => {
    if (PWA.evt) { PWA.evt.prompt(); try { await PWA.evt.userChoice; } catch (e) { /* ok */ } PWA.evt = null; rerender(); return; }
    ui.sheet = `<div class="blk" style="gap:6px"><h2>Instalar no iPhone</h2><p class="muted small">Leva 10 segundos e o Memory passa a abrir como um app.</p></div>
      <div class="list"><div class="item"><span class="tile c-blue num">1</span><div class="main"><b>Toque em Compartilhar</b><span>O quadrado com a seta, na barra do Safari</span></div></div>
      <div class="item"><span class="tile c-peach num">2</span><div class="main"><b>“Adicionar à Tela de Início”</b><span>Role a lista de opções até encontrar</span></div></div>
      <div class="item"><span class="tile c-mint num">3</span><div class="main"><b>Toque em Adicionar</b><span>O ícone do Memory aparece na tela inicial</span></div></div></div>
      <button class="btn btn-primary btn-block" data-act="sheet-close">Entendi</button>`;
    renderSheet();
  }
});
async function handleShortcut() {
  const p = new URLSearchParams(location.search); const a = p.get('acao'); if (!a && !p.get('origem')) return;
  history.replaceState(null, '', location.pathname);
  if (!S.user.onboarded) return;
  if (a === 'revisar') { const ids = dueIds(); if (ids.length) startCycle({ ids, size: 20, title: 'Revisão' }); else notify('Nenhuma revisão pendente agora. Que tal uma sessão nova?'); }
  else if (a === 'turmas') { ui.tab = 'turmas'; API.cls = null; render(); }
}

/* ---------- Inicialização do servidor ---------- */
async function initServer() {
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 6000);
    const h = await fetch('/api/health', { signal: ctl.signal, credentials: 'same-origin', cache: 'no-store' }); clearTimeout(tm);
    if (!h.ok) return;
    const j = await h.json(); if (!j || j.service !== 'memory') return;
    API.on = true; API.db = !!j.db; API.ai = !!j.ai; API.email = !!j.email;
  } catch (e) { return; }
  if (API.db) {
    try { API.user = (await api('GET', 'auth/me')).user; } catch (e) { API.user = null; }
    if (API.user) await syncAll();
    else if (API.classes.length) { API.classes = []; saveClassesCache(); refreshClassDecks(); }
  }
  await handleLinks();
  await handleShortcut();
  await handleReset();
  registerSW();
  rerender();
}
