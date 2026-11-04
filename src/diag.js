/* ================= Diagnóstico inicial =================
   Logo depois do cadastro: algumas questões de cada trilha do plano mostram o ponto de partida
   e a trilha por onde começar. As respostas já entram na repetição espaçada. */
function diagIds() {
  const decks = personaDecks().map(deckById).filter((d) => d && !d.custom && !d.classDeck);
  const per = Math.max(1, Math.ceil(8 / Math.max(1, decks.length))); const cols = [];
  for (const d of decks) cols.push(shuffle(d.questions.slice(0, 12).filter((q) => q.type !== 'ce')).slice(0, per).map((q) => q.id));
  const out = []; for (let i = 0; i < per; i++) for (const c of cols) if (c[i]) out.push(c[i]);
  return out.slice(0, 9);
}
function diagOffer() {
  const n = diagIds().length;
  if (!n) { if (!S.user.exam) examSheet(); return; }
  ui.sheet = `<div class="blk diag-offer" style="gap:16px"><div class="illo-wrap sm">${illo('done')}</div>
    <div class="blk" style="gap:6px"><h2>Diagnóstico de 2 minutos</h2><p class="muted small">${n} questões rápidas, uma de cada assunto do seu plano. No fim você vê seu ponto de partida e por qual trilha começar. Não vale nota: errar aqui é útil.</p></div>
    <button class="btn btn-orange btn-block" data-act="diag-start">Fazer o diagnóstico</button>
    <button class="btn btn-text btn-block" data-act="diag-skip">Agora não</button></div>`;
  renderSheet();
}
function diagResult(s) {
  const by = {};
  for (const r of s.results.filter((x) => !x.second)) { const d = QINDEX[r.id].deck; const e = (by[d.id] = by[d.id] || { d, n: 0, ok: 0, ill: 0 }); e.n++; if (r.correct) e.ok++; if (!r.correct && r.conf === 'certeza') e.ill++; }
  return Object.values(by).map((e) => Object.assign(e, { p: e.ok / e.n })).sort((a, b) => a.p - b.p || b.ill - a.ill);
}
function viewDiagSummary() {
  const s = ui.session; const rs = diagResult(s);
  const tot = rs.reduce((a, e) => a + e.n, 0), ok = rs.reduce((a, e) => a + e.ok, 0);
  const lvl = (p) => (p >= 1 ? ['Domina a base', 'c-mint'] : p >= 0.5 ? ['Base boa', 'c-blue'] : ['Começar daqui', 'c-peach']);
  const first = rs[0];
  S.user.diag = { at: Date.now(), ok, n: tot, start: first ? first.d.id : null }; persist();
  return `<div class="sess"><div class="result"><span class="lbl">Diagnóstico concluído</span><div class="big num">${cnt(ok)}<small>/${tot}</small></div><p>${ok === tot ? 'Começo forte. Agora é manter com revisões espaçadas.' : 'Ótimo ponto de partida. Os erros de hoje viram as revisões de amanhã.'}</p></div>
    <div class="page" style="padding-top:18px">
      <div class="card diag-list">${rs.map((e) => { const [l, c] = lvl(e.p); return `<div class="dg-row"><div class="main"><b>${esc(e.d.title)}</b><div class="bar"><i class="${e.p >= 1 ? 'g' : 'o'}" style="width:${Math.max(4, Math.round(e.p * 100))}%"></i></div></div><span class="tag ${c}">${l}</span></div>`; }).join('')}</div>
      ${first && first.p < 1 ? `<div class="callout" style="background:var(--t-peach)"><span class="tile" style="background:var(--orange);color:#141B4D">${ico('target')}</span><div><b>Comece por ${esc(first.d.title)}</b><p>É onde você tem mais a ganhar agora. O plano de hoje já começa por ela.</p></div></div>` : ''}
      <div class="blk" style="gap:8px">${first && first.p < 1 ? `<button class="btn btn-orange btn-block" data-act="diag-go" data-id="${esc(first.d.id)}">Começar por ${esc(first.d.title)}</button><button class="btn btn-text btn-block" data-act="diag-home">Ir para o início</button>` : '<button class="btn btn-orange btn-block" data-act="diag-home">Ver meu plano de hoje</button>'}</div>
    </div></div>`;
}
Object.assign(ACT, {
  'diag-start': () => { ui.sheet = null; renderSheet(); const ids = diagIds(); startCycle({ ids, size: ids.length, title: 'Diagnóstico', diag: true }); },
  'diag-skip': () => { ui.sheet = null; renderSheet(); if (!S.user.exam) setTimeout(examSheet, 150); },
  'diag-go': (d) => { ACT.end(); ui.tab = 'trilhas'; ui.deck = d.id; render(); if (!S.user.exam) setTimeout(examSheet, 400); },
  'diag-home': () => { ACT.end(); if (!S.user.exam) setTimeout(examSheet, 300); }
});
