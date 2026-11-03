Object.assign(DECK_LOOK, { bio: { pal: 'mint', v: 1, glyph: 'DNA' }, hist: { pal: 'yellow', v: 0, glyph: '1822' }, dadm: { pal: 'blue', v: 3, glyph: 'Adm' }, info: { pal: 'lilac', v: 2, glyph: '</>' }, seg: { pal: 'navy', v: 2, icon: 'shield' } });
/* ================= Jornada da trilha (etapas em caminho) ================= */
// Cada trilha vira um caminho de etapas de 4 questões. A etapa fecha quando todas foram acertadas ao menos uma vez.
// As estrelas mostram a memória atual da etapa (caem com o tempo e voltam com a revisão).
const UNIT = 4;
function units(d) {
  const out = [];
  for (let i = 0; i < d.questions.length; i += UNIT) {
    const qs = d.questions.slice(i, i + UNIT);
    let ok = 0, seen = 0, rs = 0;
    for (const q of qs) { const c = S.cards[q.id]; if (c && c.s) { seen++; rs += retr(c); if (c.ok > 0) ok++; } }
    const done = ok === qs.length; const mem = seen ? rs / seen : 0;
    out.push({ n: out.length + 1, ids: qs.map((q) => q.id), topics: qs.map((q) => q.topic), done, seen, mem, stars: done ? (mem >= 0.9 ? 3 : mem >= 0.75 ? 2 : 1) : 0 });
  }
  const cur = out.findIndex((u) => !u.done);
  out.forEach((u, i) => { u.state = u.done ? 'done' : i === cur ? 'current' : 'todo'; });
  return out;
}
function journeyHTML(d) {
  const us = units(d); if (us.length < 2) return '';
  const X = [0, 54, 78, 54, 0, -54, -78, -54];
  const doneN = us.filter((u) => u.done).length;
  const star = (on) => `<svg viewBox="0 0 24 24" class="jstar ${on ? 'on' : ''}" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>`;
  const nodes = us.map((u, i) => {
    const label = u.state === 'done' ? `Etapa ${u.n} concluída, ${u.stars} de 3 estrelas` : u.state === 'current' ? `Etapa ${u.n}, próxima etapa` : `Etapa ${u.n}`;
    const inner = u.state === 'done' ? ico('check') : u.state === 'current' ? `<b class="num">${u.n}</b>` : `<b class="num">${u.n}</b>`;
    return `<div class="jn ${u.state}" style="--x:${X[i % X.length]}px">
      ${u.state === 'current' ? `<span class="jn-tip">${u.seen ? 'Continuar' : 'Começar'}</span>` : ''}
      <button class="jn-btn" data-act="unit-start" data-id="${esc(d.id)}" data-n="${u.n}" aria-label="${label}">${inner}</button>
      ${u.state === 'done' ? `<span class="jn-stars">${star(u.stars >= 1)}${star(u.stars >= 2)}${star(u.stars >= 3)}</span>` : `<span class="jn-cap">${esc(u.topics[0])}</span>`}
    </div>`;
  }).join('');
  return `<div class="blk"><div class="sec"><h2>Sua jornada</h2><span class="tiny num" style="font-weight:700">${doneN}/${us.length} etapas</span></div>
    <div class="journey">${nodes}<div class="jn trophy ${doneN === us.length ? 'done' : ''}" style="--x:0px"><span class="jn-btn">${ico('trophy')}</span><span class="jn-cap">${doneN === us.length ? 'Trilha dominada' : 'Fim da trilha'}</span></div></div></div>`;
}
Object.assign(ACT, {
  'unit-start': (d) => {
    const dk = deckById(d.id); if (!dk) return;
    const u = units(dk)[Number(d.n) - 1]; if (!u) return;
    startCycle({ ids: u.ids, size: u.ids.length, title: 'Etapa ' + u.n + ' · ' + dk.title, unit: { deck: dk.id, n: u.n, was: u.done } });
  }
});
// Fecha a etapa ao fim do ciclo: comemora e dá moedas na primeira vez.
function checkUnit(s) {
  const p = s.params && s.params.unit; if (!p || p.was) return;
  const dk = deckById(p.deck); if (!dk) return;
  const u = units(dk)[p.n - 1];
  if (u && u.done) { earnCoins(10); notify(`Etapa ${p.n} concluída · +10 moedas`); S.units = (S.units || 0) + 1; }
}

// Próximo passo no Início: a etapa atual da trilha que você estudou por último (ou a primeira do seu plano).
function nextStepCard() {
  const decks = personaDecks().map(deckById).filter(Boolean);
  let best = null, bestAt = -1;
  for (const d of decks) {
    let last = 0; for (const q of d.questions) { const c = S.cards[q.id]; if (c && c.last > last) last = c.last; }
    const u = units(d).find((x) => x.state === 'current');
    if (u && last > bestAt) { best = { d, u }; bestAt = last; }
  }
  if (!best) return '';
  const { d, u } = best; const us = units(d); const done = us.filter((x) => x.done).length;
  return `<button class="nextstep" data-act="unit-start" data-id="${esc(d.id)}" data-n="${u.n}">
    <span class="ns-node"><b class="num">${u.n}</b></span>
    <div class="main"><small>Próxima etapa · ${esc(d.title)}</small><b>${esc(u.topics.slice(0, 2).join(' e '))}</b><div class="bar"><i class="o" style="width:${Math.round((done / us.length) * 100)}%"></i></div><span>${done} de ${us.length} etapas concluídas</span></div>
    ${chev()}</button>`;
}
