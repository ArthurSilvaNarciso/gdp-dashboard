/* ================= Motivos para voltar todo dia ================= */
// 1) Um objetivo com data (a prova): contagem regressiva, preparação e plano do dia.
// 2) Moedas ganhas estudando, gastas na loja do avatar (itens de estilo; rosto e cabelo são sempre grátis).
// 3) Baú do dia ao bater a meta (recompensa variável), combos de acertos e comemoração da sequência.
// 4) Lembrete diário no calendário do celular.

I.coin = '<circle cx="12" cy="12" r="10.5" class="cf"/><circle cx="12" cy="12" r="8" fill="none" class="cr"/><circle cx="9.6" cy="12" r="3.6" class="c1"/><circle cx="14.4" cy="12" r="3.6" class="c2"/>';
const coinIco = (cls = '') => `<svg class="coin ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I.coin}</svg>`;

/* ---------- Moedas ---------- */
function coinsBal() { const c = S.coins || {}; return Math.max(0, (c.earned || 0) - (c.spent || 0)); }
function earnCoins(n, why) {
  if (!n) return 0;
  S.coins = S.coins || { earned: 0, spent: 0 }; S.coins.earned += n;
  if (why) notify(`+${n} moedas · ${why}`);
  return n;
}
function spendCoins(n) { if (coinsBal() < n) return false; S.coins = S.coins || { earned: 0, spent: 0 }; S.coins.spent += n; return true; }

/* ---------- Loja do avatar ---------- */
// Preço em moedas, ou desbloqueio por conquista/nível. O que não está aqui é grátis.
const AV_SHOP = {
  hat: { bonetras: 40, bucket: 60, viseira: 40, bandana: 60, fedora: 90, fone: 80, capelo: { badge: 'sim70', price: 150 }, coroa: { badge: 'streak30' } },
  glasses: { retro: 40, gatinho: 50, hex: 60, meia: 60, sol: 70, aviador: 80, coracao: 90, monoculo: 120 },
  acc: { argola: 40, piercing: 50, flor: 50, colar: 60, gravata: 60, cachecol: 80, lapis: { badge: 'q100', price: 100 } },
  top: { regata: 40, gola: 50, listrada: 60, esportiva: 70, blazer: 80, jaqueta: 90, jaleco: 100 },
  bgp: { bolinhas: 30, listras: 30, ondas: 40, grade: 40, raios: 60, marca: { level: 5 } }
};
const itemKey = (k, v) => k + ':' + v;
function itemRule(k, v) { const r = (AV_SHOP[k] || {})[v]; return r == null ? null : typeof r === 'number' ? { price: r } : r; }
function itemOwned(k, v) {
  const r = itemRule(k, v); if (!r) return true;
  if (S.owned && S.owned[itemKey(k, v)]) return true;
  if (r.badge && S.badges && S.badges[r.badge]) return true;
  if (r.level && level() >= r.level) return true;
  return false;
}
function itemLockText(r) {
  const b = r.badge && BADGES.find((x) => x.id === r.badge);
  if (r.level) return 'Libera no nível ' + r.level;
  if (b && r.price) return `${r.price} moedas ou conquista “${b.l}”`;
  if (b) return 'Conquista “' + b.l + '”';
  return r.price + ' moedas';
}
function lockedInCfg(cfg) {
  const out = [];
  for (const k of Object.keys(AV_SHOP)) { const v = cfg[k]; if (!itemOwned(k, v)) out.push({ k, v, r: itemRule(k, v) }); }
  return out;
}

/* ---------- Objetivo com data ---------- */
function examInfo() {
  const e = S.user.exam; if (!e || !e.date) return null;
  const [y, m, d] = e.date.split('-').map(Number); const at = new Date(y, m - 1, d);
  const days = Math.ceil((at - new Date(new Date().toDateString())) / DAY);
  return { name: e.name || 'Sua prova', date: e.date, days, at };
}
function targetDecks() { return personaDecks().map(deckById).filter(Boolean); }
// Preparação: quanto do conteúdo-alvo você lembraria hoje (memória × cobertura).
function readiness() {
  let tot = 0, sum = 0, firm = 0;
  for (const d of targetDecks()) for (const q of d.questions) { tot++; const c = S.cards[q.id]; if (c && c.s) { sum += retr(c); if (c.s >= FIRM && c.g > 1) firm++; } }
  return { pct: tot ? Math.round((sum / tot) * 100) : 0, total: tot, firm };
}
function dailyPlan() {
  const ex = examInfo(), r = readiness(); const goal = S.user.goal;
  if (!ex || ex.days <= 0) return { n: goal, why: '' };
  const missing = Math.max(0, Math.ceil(r.total * 0.9) - r.firm);
  const need = Math.max(goal, Math.ceil((missing * 2.2) / Math.max(1, ex.days))); // cada questão firme pede ~2 a 3 revisões
  return { n: Math.min(60, need), why: need > goal ? 'para chegar a 90% até a prova' : 'mantém você no ritmo da prova' };
}
function examCard() {
  const ex = examInfo(); const r = readiness();
  if (!ex) return `<button class="goalcard empty" data-act="exam-open"><span class="tile c-blue">${ico('exam')}</span><div class="main"><b>Tem prova marcada?</b><span>Coloque a data e o Memory monta o ritmo até lá</span></div>${chev()}</button>`;
  if (ex.days < 0) return `<button class="goalcard" data-act="exam-open"><span class="tile c-mint">${ico('trophy')}</span><div class="main"><b>${esc(ex.name)} já passou</b><span>Como foi? Defina o próximo objetivo</span></div>${chev()}</button>`;
  const plan = dailyPlan(); const L = peekToday(); const done = Math.min(L.n, plan.n);
  return `<button class="goalcard" data-act="exam-open" aria-label="Objetivo: ${esc(ex.name)}">
    <div class="gc-top"><div><small>${esc(ex.name)}</small><b class="num">${ex.days === 0 ? 'É hoje!' : ex.days === 1 ? 'Falta 1 dia' : 'Faltam ' + ex.days + ' dias'}</b></div>
      <div class="ring" style="--p:${r.pct}"><span class="num">${r.pct}%</span><i>preparação</i></div></div>
    <div class="gc-plan"><span>Hoje: <b class="num">${done}/${plan.n}</b> questões${plan.why ? ' · ' + plan.why : ''}</span><div class="bar"><i class="${done >= plan.n ? 'g' : 'o'}" style="width:${Math.round((done / plan.n) * 100)}%"></i></div></div>
  </button>`;
}
function examSheet() {
  const e = S.user.exam || {}; const today = dayKey();
  const sug = [['ENEM', ''], ['Vestibular', ''], ['Concurso', ''], ['Prova da faculdade', ''], ['Certificação', '']];
  ui.sheet = `<form class="blk" data-form="exam" style="gap:16px"><div class="blk" style="gap:6px"><h2>Seu objetivo</h2><p class="muted small">Com a data, o Memory mostra quanto falta, sua preparação e quantas questões fazer por dia.</p></div>
    <div class="field"><label for="ex-name">Nome da prova</label><input id="ex-name" class="input" maxlength="40" placeholder="Ex.: ENEM, Concurso TRT, Prova de Anatomia" value="${esc(e.name || '')}"></div>
    <div class="chips">${sug.map(([s]) => `<button type="button" class="fchip" data-act="exam-sug" data-v="${s}">${s}</button>`).join('')}</div>
    <div class="field"><label for="ex-date">Data</label><input id="ex-date" class="input" type="date" min="${today}" value="${esc(e.date || '')}"></div>
    <div class="duo">${e.date ? '<button type="button" class="btn btn-ghost" data-act="exam-clear">Remover</button>' : '<button type="button" class="btn btn-ghost" data-act="sheet-close">Agora não</button>'}<button class="btn btn-orange" type="submit">Salvar objetivo</button></div></form>`;
  renderSheet();
}
document.addEventListener('submit', (e) => {
  if (!e.target.dataset || e.target.dataset.form !== 'exam') return;
  e.preventDefault();
  const name = document.getElementById('ex-name').value.trim().slice(0, 40), date = document.getElementById('ex-date').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { const f = document.getElementById('ex-date'); f.focus(); f.classList.add('shake'); setTimeout(() => f.classList.remove('shake'), 400); return; }
  S.user.exam = { name: name || 'Minha prova', date }; persist(); ui.sheet = null; renderSheet(); render();
  const ex = examInfo(); notify(ex.days > 0 ? `Objetivo salvo: ${ex.days} dias até ${ex.name}.` : 'Objetivo salvo.');
});

/* ---------- Baú do dia ---------- */
function chestReady() { const L = peekToday(); return L.n >= S.user.goal && S.chest !== dayKey(); }
function chestCard() {
  if (S.chest === dayKey()) return '';
  const L = peekToday(); const left = Math.max(0, S.user.goal - L.n);
  if (left > 0) return `<div class="chest locked"><span class="chest-ico">${chestSVG(false)}</span><div class="main"><b>Baú do dia</b><span>Faltam ${plural(left, 'questão', 'questões')} para abrir</span></div><div class="bar"><i class="o" style="width:${Math.round((L.n / S.user.goal) * 100)}%"></i></div></div>`;
  return `<button class="chest ready" data-act="chest-open"><span class="chest-ico">${chestSVG(false)}</span><div class="main"><b>Seu baú está pronto</b><span>Meta do dia batida. Toque para abrir</span></div><span class="btn btn-orange btn-sm">Abrir</span></button>`;
}
function chestSVG(open) {
  return `<svg viewBox="0 0 64 56" aria-hidden="true"><rect x="6" y="24" width="52" height="28" rx="6" fill="#FF7A22"/><rect x="6" y="36" width="52" height="4" fill="#D2550A"/>
    <g class="lid ${open ? 'up' : ''}"><path d="M6 26C6 12 16 6 32 6S58 12 58 26Z" fill="#FF9B55"/><path d="M6 26C6 12 16 6 32 6S58 12 58 26" fill="none" stroke="#D2550A" stroke-width="3"/></g>
    <rect x="27" y="22" width="10" height="14" rx="3" fill="#1F2A6B"/><circle cx="32" cy="29" r="2" fill="#FFD7B8"/></svg>`;
}
function openChest() {
  if (!chestReady()) return;
  const roll = Math.random();
  const coins = roll < 0.55 ? 10 + Math.floor(Math.random() * 11) : roll < 0.9 ? 21 + Math.floor(Math.random() * 15) : 50;
  const freeze = (S.freezes || 0) < 2 && Math.random() < 0.15;
  S.chest = dayKey(); earnCoins(coins); if (freeze) S.freezes = (S.freezes || 0) + 1;
  persist();
  ui.sheet = `<div class="reward"><div class="chest-big">${chestSVG(true)}<span class="burst"></span></div><h2>${coins === 50 ? 'Baú raro!' : 'Baú aberto'}</h2>
    <div class="reward-row"><span class="pill">${coinIco()}<b class="num">+${coins}</b> moedas</span>${freeze ? `<span class="pill">${ico('shield')}<b>+1</b> protetor de sequência</span>` : ''}</div>
    <p class="muted small">Volte amanhã: cada dia de meta batida abre um baú novo.</p><button class="btn btn-primary btn-block" data-act="chest-close">Continuar</button></div>`;
  renderSheet(); tone(true);
}

/* ---------- Comemoração da sequência ---------- */
const STREAK_MARKS = [3, 7, 14, 30, 50, 100, 365];
function streakSheet(n) {
  const next = STREAK_MARKS.find((m) => m > n) || n + 30;
  const days = []; const today = new Date();
  for (let i = 6; i >= 0; i--) { const d = new Date(today.getTime() - i * DAY); const on = (S.log[dayKey(d)] || {}).n > 0; days.push(`<span class="${on ? 'on' : ''}${i === 0 ? ' today' : ''}"><i>${on ? ico('check') : ''}</i>${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()]}</span>`); }
  ui.sheet = `<div class="reward streak"><div class="flame-big">${ico('flame')}<b class="num">${n}</b></div><h2>${n === 1 ? 'Sequência começou!' : n + ' dias seguidos!'}</h2>
    <p class="muted small">${n === 1 ? 'Volte amanhã para não quebrar a corrente.' : STREAK_MARKS.includes(n) ? 'Marco alcançado. Sua memória agradece a constância.' : 'Continue assim. Próximo marco: ' + next + ' dias.'}</p>
    <div class="wk7">${days.join('')}</div>
    <div class="bar"><i class="o" style="width:${Math.round((n / next) * 100)}%"></i></div><span class="tiny">${n} de ${next} dias · ${S.freezes || 0} ${(S.freezes || 0) === 1 ? 'protetor guardado' : 'protetores guardados'}</span>
    <button class="btn btn-orange btn-block" data-act="sheet-close">Continuar</button></div>`;
  renderSheet();
}

/* ---------- Lembrete diário (calendário) ---------- */
function reminderICS(hhmm) {
  const [h, m] = hhmm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1);
  const pad2 = (n) => String(n).padStart(2, '0');
  const dt = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(h)}${pad2(m)}00`;
  const url = /^https?:/.test(location.protocol) ? location.origin + location.pathname : '';
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Memory//Lembrete//PT-BR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:memory-lembrete-' + Date.now() + '@memory', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART:' + dt, 'DURATION:PT10M',
    'RRULE:FREQ=DAILY', 'SUMMARY:Memory · ' + S.user.goal + ' questões de hoje', 'DESCRIPTION:Mantenha sua sequência. ' + url, url ? 'URL:' + url : '',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hora do Memory', 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
}
function reminderSheet() {
  const cur = S.user.remind || '19:00';
  ui.sheet = `<div class="blk" style="gap:6px"><h2>Lembrete diário</h2><p class="muted small">Escolha um horário. O Memory cria um evento diário no calendário do seu celular, com alerta, para você não esquecer.</p></div>
    <div class="seg" role="group">${['07:00', '12:00', '19:00', '21:00'].map((t) => `<button data-act="remind-pick" data-t="${t}" aria-pressed="${cur === t}">${t}</button>`).join('')}</div>
    <div class="field"><label for="rm-time">Outro horário</label><input id="rm-time" class="input" type="time" value="${cur}"></div>
    <button class="btn btn-orange btn-block" data-act="remind-save">Adicionar ao calendário</button>`;
  renderSheet();
}

/* ---------- Ações ---------- */
Object.assign(ACT, {
  'exam-open': () => examSheet(),
  'exam-sug': (d) => { const n = document.getElementById('ex-name'); if (n) { n.value = d.v; n.focus(); } },
  'exam-clear': () => { delete S.user.exam; persist(); ui.sheet = null; renderSheet(); render(); },
  'chest-open': () => openChest(),
  'chest-close': () => { ACT['sheet-close'](); setTimeout(render, 220); },
  'remind-open': () => reminderSheet(),
  'remind-pick': (d) => { const t = document.getElementById('rm-time'); if (t) t.value = d.t; document.querySelectorAll('[data-act=remind-pick]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === d.t)); },
  'remind-save': () => {
    const t = (document.getElementById('rm-time') || {}).value || '19:00';
    S.user.remind = t; persist();
    const url = URL.createObjectURL(new Blob([reminderICS(t)], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'lembrete-memory.ics'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    ui.sheet = null; renderSheet(); render(); notify('Abra o arquivo para adicionar o lembrete das ' + t + '.');
  },
  'shop-buy': () => {
    const items = lockedInCfg(AVED.cfg); const buyable = items.filter((x) => x.r.price);
    const total = buyable.reduce((a, x) => a + x.r.price, 0);
    if (buyable.length !== items.length || !spendCoins(total)) return;
    S.owned = S.owned || {}; for (const x of buyable) S.owned[itemKey(x.k, x.v)] = Date.now();
    ui.sheet = null; renderSheet(); ACT['av-save'](); notify(`Compra feita · −${total} moedas`);
  }
});
