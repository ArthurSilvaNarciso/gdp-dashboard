/* ================= Reportar questão, notificações, liga semanal e amigos ================= */
const LS_REPORTS = 'memory.reports.v1';
const REPORT_OPTS = [['gabarito', 'Gabarito errado'], ['enunciado', 'Enunciado confuso'], ['explicacao', 'Explicação errada'], ['portugues', 'Erro de português'], ['outro', 'Outro']];
const serverReady = () => !!(API && API.on && API.db);

/* ---------- Reportar problema na questão ---------- */
function reportLink() {
  const s = ui.session; if (!s || s.mode === 'sim') return '';
  return `<button class="report-link" data-act="report-open">${ico('alert')}<span>Reportar problema nesta questão</span></button>`;
}
function reportSheet(sel, err) {
  const s = ui.session; const { q, deck } = QINDEX[s.queue[s.i]];
  ui.sheet = `<form class="blk" data-form="report" style="gap:14px" novalidate><div class="blk" style="gap:6px"><h2>Reportar problema</h2><p class="muted small">${esc(q.topic)} · ${esc(deck.title)}. Revisamos cada reporte e corrigimos a questão para todo mundo.</p></div>
    <div class="chips wrap" role="radiogroup" aria-label="Tipo de problema">${REPORT_OPTS.map(([k, l]) => `<button type="button" class="fchip" role="radio" data-act="report-kind" data-k="${k}" aria-checked="${sel === k}">${l}</button>`).join('')}</div>
    <div class="field"><label for="rp-note">O que está errado? <span class="tiny">(opcional)</span></label><textarea id="rp-note" class="input" rows="3" maxlength="500" placeholder="Ex.: a alternativa C também está correta segundo o art. 37."></textarea></div>
    ${err ? `<div class="notice err" role="alert">${esc(err)}</div>` : ''}
    <button class="btn btn-orange btn-block" type="submit">Enviar reporte</button></form>`;
  ui.reportKind = sel || null; renderSheet();
}
function queueReport(r) { try { const l = JSON.parse(lsGet(LS_REPORTS) || '[]'); l.push(r); lsSet(LS_REPORTS, JSON.stringify(l.slice(-50))); } catch (e) { /* armazenamento indisponível */ } }
async function flushReports() {
  if (!serverReady()) return; let l; try { l = JSON.parse(lsGet(LS_REPORTS) || '[]'); } catch (e) { return; }
  if (!l.length) return; const rest = [];
  for (const r of l) { try { await api('POST', 'reports', r); } catch (e) { if (e.code === 'offline' || e.status >= 500) rest.push(r); } }
  lsSet(LS_REPORTS, JSON.stringify(rest));
}
async function submitReport() {
  const s = ui.session; if (!s) return; const id = s.queue[s.i]; const { deck } = QINDEX[id];
  if (!ui.reportKind) return reportSheet(null, 'Escolha o tipo de problema.');
  const body = { questionId: id, deckId: deck.id, kind: ui.reportKind, note: (document.getElementById('rp-note') || {}).value || '' };
  ui.sheet = null; renderSheet();
  if (serverReady()) { try { await api('POST', 'reports', body); notify('Obrigado! Seu reporte foi enviado.'); return; } catch (e) { if (e.code !== 'offline') return notify(e.message); } }
  queueReport(body); notify('Obrigado! O reporte será enviado assim que houver conexão.');
}
document.addEventListener('submit', (e) => { if (e.target.matches('[data-form="report"]')) { e.preventDefault(); submitReport(); } });

/* ---------- Notificações push ---------- */
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function b64ToBytes(s) { const p = '='.repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, (c) => c.charCodeAt(0)); }
async function currentPushSub() { try { const reg = await navigator.serviceWorker.getRegistration(); return reg && (await reg.pushManager.getSubscription()); } catch (e) { return null; } }
async function enablePush() {
  if (!pushSupported()) return notify('Este navegador não aceita notificações. No iPhone, instale o Memory na tela de início primeiro.');
  if (!loggedIn()) return openAuth('signup', { note: 'Crie sua conta para receber lembretes no celular.', after: () => enablePush() });
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return notify('Notificações bloqueadas. Libere nas configurações do navegador.');
  try {
    const reg = await navigator.serviceWorker.ready; const { publicKey } = await api('GET', 'push/key');
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
    await api('POST', 'push/subscribe', { subscription: sub.toJSON(), hour: 19 });
    S.user.push = true; persist(); notify('Pronto! Você vai receber um lembrete por dia, só se ainda não tiver estudado.');
  } catch (e) { notify(e.message || 'Não foi possível ativar agora.'); }
  if (ui.sheet && document.querySelector('[data-push-sheet]')) pushSheet();
}
async function disablePush() {
  const sub = await currentPushSub();
  try { if (sub) { await api('DELETE', 'push/subscribe', { endpoint: sub.endpoint }); await sub.unsubscribe(); } } catch (e) { /* segue */ }
  S.user.push = false; persist(); notify('Notificações desligadas neste aparelho.'); pushSheet();
}
function pushSheet() {
  const on = !!S.user.push && typeof Notification !== 'undefined' && Notification.permission === 'granted';
  ui.sheet = `<div class="blk" data-push-sheet style="gap:14px"><div class="illo-wrap sm push-illo">${ico('bell')}</div><div class="blk" style="gap:6px"><h2>Lembrete no celular</h2>
      <p class="muted small">Uma notificação por dia, por volta das 19h, só nos dias em que você ainda não estudou. Se a sequência estiver em risco, o aviso diz quanto falta para salvá-la.</p></div>
    ${!pushSupported() ? '<div class="notice">Este navegador não aceita notificações. No iPhone, toque em Compartilhar → Adicionar à Tela de Início e abra o Memory por lá.</div>' : ''}
    ${on ? `<div class="notice ok">${ico('check')} Ativado neste aparelho.</div><div class="duo"><button class="btn btn-soft" data-act="push-test">Enviar teste</button><button class="btn btn-ghost" data-act="push-off">Desligar</button></div>`
      : pushSupported() && serverReady() ? '<button class="btn btn-orange btn-block" data-act="push-on">Ativar notificações</button>' : ''}
    <button class="btn btn-text btn-block" data-act="remind-open">Prefiro um evento no calendário</button></div>`;
  renderSheet();
}

/* ---------- Liga semanal e amigos ---------- */
const LG = { data: null, friends: null, err: '', loading: false, tab: 'liga', at: 0 };
const TIER_COLORS = ['#C7793B', '#9AA4B8', '#E3A92B', '#2F7FD6', '#6C4BE0'];
function leftText(ts) { const d = ts - Date.now(); if (d <= 0) return 'encerrando'; const days = Math.floor(d / 864e5); const h = Math.floor((d % 864e5) / 36e5); return days ? `termina em ${days} ${days === 1 ? 'dia' : 'dias'}` : `termina em ${h}h`; }
async function loadLeague(force) {
  if (!loggedIn() || LG.loading || (!force && Date.now() - LG.at < 30000)) return;
  LG.loading = true; LG.err = '';
  try { if (API.sync !== 'saved' && typeof pushServer === 'function') await pushServer().catch(() => {}); const [l, f] = await Promise.all([api('GET', 'league'), api('GET', 'friends')]); LG.data = l; LG.friends = f; LG.at = Date.now(); }
  catch (e) { LG.err = e.message; }
  LG.loading = false; if (ui.tab === 'liga' || ui.tab === 'home') rerender();
}
function tierBadge(t, size = 44) {
  const c = TIER_COLORS[(t || 1) - 1];
  return `<svg class="tier" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3 42 10v13c0 11-7.6 19-18 22C13.6 42 6 34 6 23V10z" fill="${c}"/><path d="M24 3 42 10v13c0 11-7.6 19-18 22z" fill="#000" opacity=".12"/><path d="M24 14l3.2 6.5 7.1 1-5.1 5 1.2 7.1L24 30.3l-6.4 3.3 1.2-7.1-5.1-5 7.1-1z" fill="#fff"/></svg>`;
}
function homeLeagueCard() {
  if (!serverReady()) return '';
  if (!loggedIn()) return `<button class="league-card" data-act="league-join">${tierBadge(1)}<div class="main"><small>Liga semanal</small><b>Dispute com quem estuda como você</b><span>Suba de divisão toda semana: Bronze → Diamante</span></div>${chev()}</button>`;
  setTimeout(() => loadLeague(), 0);
  const d = LG.data; if (!d) return `<div class="league-card skel" style="height:86px"></div>`;
  const me = d.members.find((m) => m.me) || { pos: '–', points: 0 };
  const zone = me.pos <= d.promote ? 'Zona de promoção' : d.demote && me.pos > d.size - d.demote ? 'Zona de rebaixamento' : leftText(d.endsAt);
  return `<button class="league-card" data-act="tab" data-tab="liga">${tierBadge(d.tier)}<div class="main"><small>Liga ${esc(d.tierName)} · ${leftText(d.endsAt)}</small><b>${me.pos}º lugar · ${me.points} pts</b><span class="${me.pos <= d.promote ? 'up' : ''}">${zone}</span></div>${chev()}</button>`;
}
function avatarMini(cfg) { try { return avatarSVG(cfg || {}); } catch (e) { return ''; } }
function viewLiga() {
  if (!loggedIn()) { ui.tab = 'home'; return viewHome(); }
  if (!LG.data && !LG.loading && !LG.err) setTimeout(() => loadLeague(true), 0);
  const back = `<div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="progresso" aria-label="Voltar">${ico('back')}</button><button class="icon-btn" data-act="league-refresh" aria-label="Atualizar">${ico('recall')}</button></div>`;
  const seg = `<div class="seg" role="group" aria-label="Ranking"><button data-act="league-tab" data-t="liga" aria-pressed="${LG.tab === 'liga'}">Liga</button><button data-act="league-tab" data-t="amigos" aria-pressed="${LG.tab === 'amigos'}">Amigos</button></div>`;
  if (LG.err && !LG.data) return `<div class="page">${back}<h1 style="font-size:26px">Liga semanal</h1><div class="notice err">${esc(LG.err)}</div></div>`;
  if (!LG.data) return `<div class="page">${back}<h1 style="font-size:26px">Liga semanal</h1><div class="skel" style="height:120px"></div><div class="skel" style="height:300px"></div></div>`;
  const d = LG.data;
  let body;
  if (LG.tab === 'liga') {
    const rows = d.members.map((m) => {
      const zone = m.pos <= d.promote ? 'up' : d.demote && m.pos > d.size - d.demote ? 'down' : '';
      return `${m.pos === d.promote + 1 && d.promote ? '<div class="lg-line up">Zona de promoção ↑</div>' : ''}${d.demote && m.pos === d.size - d.demote + 1 ? '<div class="lg-line down">Zona de rebaixamento ↓</div>' : ''}
        <div class="lg-row ${m.me ? 'me' : ''} ${zone}"><b class="num pos">${m.pos}</b><span class="av sm">${avatarMini(m.avatar)}</span><span class="nm">${esc(m.name)}${m.me ? ' <em>você</em>' : ''}</span><b class="num pts">${m.points}</b></div>`;
    }).join('');
    body = `<div class="lg-head" style="--tc:${TIER_COLORS[d.tier - 1]}">${tierBadge(d.tier, 64)}<div><small>Divisão</small><h2>Liga ${esc(d.tierName)}</h2><span>${leftText(d.endsAt)} · ${d.size} ${d.size === 1 ? 'participante' : 'participantes'}</span></div></div>
      <div class="tiers">${d.tiers.map((t, i) => `<span class="${i + 1 === d.tier ? 'on' : i + 1 < d.tier ? 'past' : ''}" title="${t}">${tierBadge(i + 1, 26)}</span>`).join('')}</div>
      <p class="small muted">${d.promote === 0 ? 'Você está na divisão mais alta. Mantenha o topo!' : d.promote === 1 ? 'O 1º lugar sobe de divisão na segunda-feira' : `Os ${d.promote} primeiros sobem de divisão na segunda-feira`}${d.demote ? ` e os ${d.demote} últimos descem` : ''}${d.promote === 0 ? '' : '.'} Pontos: 10 por acerto + 2 por resposta.</p>
      <div class="card lg-list">${rows}</div>
      ${d.size < 3 ? `<div class="notice">Sua liga está começando. Convide amigos na aba Amigos para disputar com eles.</div>` : ''}`;
  } else {
    const f = LG.friends || { code: '', friends: [] }; const link = location.origin + '/?amigo=' + f.code;
    body = `<div class="card pad invite"><div class="blk" style="gap:4px"><b class="d" style="font-weight:700">Chame alguém para estudar junto</b><span class="small muted">Quem entrar pelo seu link vira seu amigo no ranking. Estudar com alguém aumenta muito a chance de manter a sequência.</span></div>
        <div class="code-box"><span class="num">${esc(f.code)}</span><button class="btn btn-orange btn-sm" data-act="friend-share">Convidar</button></div>
        <form class="addf" data-form="friend"><input id="fr-code" class="input" placeholder="Código" maxlength="6" autocapitalize="characters" autocomplete="off" aria-label="Código de convite de um amigo"><button class="btn btn-soft btn-sm" type="submit">Adicionar</button></form></div>
      <div class="card lg-list">${f.friends.map((m) => `<div class="lg-row ${m.me ? 'me' : ''}"><b class="num pos">${m.pos}</b><span class="av sm">${avatarMini(m.avatar)}</span><span class="nm">${esc(m.name)}${m.me ? ' <em>você</em>' : ''}<small>${ico('flame')} ${m.streak} ${m.streak === 1 ? 'dia' : 'dias'}</small></span><b class="num pts">${m.points}</b>${m.me ? '' : `<button class="icon-btn flat sm" data-act="friend-remove" data-id="${m.id}" aria-label="Remover ${esc(m.name)}">${ico('close')}</button>`}</div>`).join('')}</div>
      ${f.friends.length < 2 ? '<p class="tiny" style="text-align:center">Seus amigos aparecem aqui com os pontos da semana e a sequência.</p>' : ''}
      <input type="hidden" id="fr-link" value="${esc(link)}">`;
  }
  return `<div class="page">${back}<h1 style="font-size:26px">Liga semanal</h1>${seg}${body}</div>`;
}
async function addFriendCode(code) {
  try { const r = await api('POST', 'friends', { code }); notify(r.friend.name + ' agora está no seu ranking de amigos.'); LG.tab = 'amigos'; await loadLeague(true); }
  catch (e) { notify(e.message); }
}
document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-form="friend"]')) return; e.preventDefault();
  const v = (document.getElementById('fr-code') || {}).value || ''; if (v.trim()) addFriendCode(v.trim().toUpperCase());
});
async function handleFriendLink() {
  const p = new URLSearchParams(location.search); const code = (p.get('amigo') || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return;
  history.replaceState(null, '', location.pathname);
  if (!serverReady()) return;
  if (loggedIn()) addFriendCode(code);
  else openAuth('signup', { note: 'Crie sua conta (ou entre) para estudar junto com quem te convidou e entrar na liga semanal.', after: () => { ui.tab = 'liga'; addFriendCode(code); } });
}
async function socialInit() { await handleFriendLink(); flushReports(); if (S.user.push && loggedIn()) { const sub = await currentPushSub(); if (!sub) { S.user.push = false; persist(); } } }

/* ---------- Administração: reportes ---------- */
const ADMR = { list: null, kinds: {}, loading: false, at: 0 };
async function loadAdminReports() { ADMR.loading = true; ADMR.at = Date.now(); try { const r = await api('GET', 'admin/reports'); ADMR.list = r.reports; ADMR.kinds = r.kinds; } catch (e) { ADMR.list = []; } ADMR.loading = false; if (ui.tab === 'admin') render(); }
function adminReportsHTML() {
  if (!ADMR.loading && (!ADMR.list || Date.now() - ADMR.at > 15000)) setTimeout(() => loadAdminReports(), 0);
  if (!ADMR.list) return '<div class="skel" style="height:90px"></div>';
  const byQ = {}; for (const r of ADMR.list) (byQ[r.questionId] = byQ[r.questionId] || []).push(r);
  const ids = Object.keys(byQ);
  return `<div class="blk"><div class="sec"><h2>Reportes de questões</h2><span class="tiny num">${ids.length} ${ids.length === 1 ? 'questão' : 'questões'}</span></div>
    ${ids.length ? `<div class="list">${ids.map((qid) => { const rs = byQ[qid]; const x = QINDEX[qid]; return `<div class="item rep"><span class="tile c-pink">${ico('alert')}</span><div class="main"><b>${x ? esc(x.q.topic) + ' · ' + esc(x.deck.title) : esc(qid)}</b>
      <span>${rs.map((r) => `${esc(ADMR.kinds[r.kind] || r.kind)}${r.note ? ': “' + esc(r.note) + '”' : ''}${r.by ? ' (' + esc(r.by) + ')' : ''}`).join(' · ')}</span>
      <div class="duo" style="margin-top:8px">${x ? `<button class="btn btn-soft btn-sm" data-act="adm-rep-see" data-q="${esc(qid)}">Ver questão</button>` : ''}<button class="btn btn-primary btn-sm" data-act="adm-rep" data-id="${rs[0].id}" data-s="resolved">Corrigida</button><button class="btn btn-ghost btn-sm" data-act="adm-rep" data-id="${rs[0].id}" data-s="dismissed">Descartar</button></div></div><span class="end num">${rs.length}×</span></div>`; }).join('')}</div>` : '<p class="small muted">Nenhum reporte aberto. Quando alguém apontar um problema numa questão, ele aparece aqui.</p>'}</div>`;
}

Object.assign(ACT, {
  'report-open': () => reportSheet(null),
  'report-kind': (d) => { ui.reportKind = d.k; document.querySelectorAll('[data-act=report-kind]').forEach((b) => { const on = b.dataset.k === d.k; b.setAttribute('aria-checked', on); }); },
  'push-open': () => pushSheet(),
  'push-on': () => enablePush(),
  'push-off': () => disablePush(),
  'push-test': async () => { try { const r = await api('POST', 'push/test'); notify(r.sent ? 'Notificação de teste enviada.' : 'Nenhum aparelho recebeu. Tente ativar de novo.'); } catch (e) { notify(e.message); } },
  'league-join': () => openAuth('signup', { note: 'Crie sua conta para entrar na liga semanal e no ranking de amigos.', after: () => { ui.tab = 'liga'; render(); } }),
  'league-tab': (d) => { LG.tab = d.t; render(); },
  'league-refresh': () => loadLeague(true),
  'friend-share': async () => {
    const f = LG.friends; if (!f) return; const link = location.origin + '/?amigo=' + f.code;
    const text = `Bora estudar junto no Memory? Entra pelo meu link e disputa a liga semanal comigo: ${link}`;
    if (navigator.share) { try { await navigator.share({ title: 'Memory', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); notify('Convite copiado. Cole no WhatsApp ou onde preferir.'); } catch (e) { notify('Seu código é ' + f.code); }
  },
  'friend-remove': async (d) => { try { await api('DELETE', 'friends/' + d.id); await loadLeague(true); } catch (e) { notify(e.message); } },
  'adm-rep': async (d) => { try { await api('PATCH', 'admin/reports/' + d.id, { status: d.s }); notify(d.s === 'resolved' ? 'Marcado como corrigido.' : 'Reporte descartado.'); await loadAdminReports(); } catch (e) { notify(e.message); } },
  'adm-rep-see': (d) => { const x = QINDEX[d.q]; if (!x) return; if (!QB.ready) { loadBodies().then(() => ACT['adm-rep-see'](d)).catch(() => {}); return; } const q = x.q; ui.sheet = `<div class="blk" style="gap:10px"><span class="tag c-blue">${esc(x.deck.title)} · ${esc(q.id)}</span><p class="small muted">${esc(q.c)}</p><h3>${esc(q.q)}</h3>${q.o.map((o, i) => `<div class="alt ${i === q.a ? 'is-right' : ''}"><span class="t">${esc(o.t)}</span><span class="w">${esc(o.w)}</span></div>`).join('')}<p class="tiny">Fonte: ${esc(q.src || '')}</p><p class="tiny">Para corrigir, edite o arquivo content/${esc(x.deck.id)}*.json (ou src/data.js) e publique de novo.</p></div>`; renderSheet(); }
});
