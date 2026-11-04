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
const MOD = 5;
function journeyHTML(d) {
  const us = units(d); if (us.length < 2) return '';
  const X = [0, 54, 78, 54, 0, -54, -78, -54];
  const doneN = us.filter((u) => u.done).length;
  const star = (on) => `<svg viewBox="0 0 24 24" class="jstar ${on ? 'on' : ''}" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>`;
  const node = (u, i) => {
    const label = u.state === 'done' ? `Etapa ${u.n} concluída, ${u.stars} de 3 estrelas` : u.state === 'current' ? `Etapa ${u.n}, próxima etapa` : `Etapa ${u.n}`;
    const inner = u.state === 'done' ? ico('check') : `<b class="num">${u.n}</b>`;
    return `<div class="jn ${u.state}" style="--x:${X[i % X.length]}px">
      ${u.state === 'current' ? `<span class="jn-tip">${u.seen ? 'Continuar' : 'Começar'}</span>` : ''}
      <button class="jn-btn" data-act="unit-start" data-id="${esc(d.id)}" data-n="${u.n}" aria-label="${label}">${inner}</button>
      ${u.state === 'done' ? `<span class="jn-stars">${star(u.stars >= 1)}${star(u.stars >= 2)}${star(u.stars >= 3)}</span>` : `<span class="jn-cap">${esc(u.topics[0])}</span>`}
    </div>`;
  };
  const trophy = `<div class="jn trophy ${doneN === us.length ? 'done' : ''}" style="--x:0px"><span class="jn-btn">${ico('trophy')}</span><span class="jn-cap">${doneN === us.length ? 'Trilha dominada' : 'Fim da trilha'}</span></div>`;
  let body;
  if (us.length <= MOD + 1) body = `<div class="journey">${us.map(node).join('')}${trophy}</div>`;
  else {
    const mods = []; for (let i = 0; i < us.length; i += MOD) mods.push(us.slice(i, i + MOD));
    const cur = Math.max(0, mods.findIndex((m) => m.some((u) => !u.done))); const curIdx = cur < 0 ? mods.length - 1 : cur;
    const open = (ui.jopen && ui.jopen[d.id]) || { [curIdx]: true };
    body = mods.map((m, k) => {
      const dn = m.filter((u) => u.done).length; const st = m.reduce((a, u) => a + u.stars, 0); const isOpen = !!open[k];
      const state = dn === m.length ? 'done' : k === curIdx ? 'cur' : 'todo';
      const head = `<button class="jmod ${state}" data-act="jmod" data-id="${esc(d.id)}" data-k="${k}" aria-expanded="${isOpen}">
        <span class="jm-n">${state === 'done' ? ico('check') : `<b class="num">${k + 1}</b>`}</span>
        <span class="jm-t"><b>Módulo ${k + 1}</b><span>${esc(m[0].topics[0])}${m.length > 1 ? ' → ' + esc(m[m.length - 1].topics[0]) : ''}</span></span>
        <span class="jm-p num">${dn === m.length ? `${star(true)} ${st}/${m.length * 3}` : `${dn}/${m.length}`}</span><span class="jm-c${isOpen ? ' open' : ''}">${chev()}</span></button>`;
      return `<div class="jmodule ${state}">${head}${isOpen ? `<div class="journey">${m.map((u, i) => node(u, k * MOD + i)).join('')}${k === mods.length - 1 ? trophy : ''}</div>` : ''}</div>`;
    }).join('');
  }
  return `<div class="blk"><div class="sec"><h2>Sua jornada</h2><span class="tiny num" style="font-weight:700">${doneN}/${us.length} etapas</span></div>${body}</div>`;
}
Object.assign(ACT, {
  'jmod': (d) => { ui.jopen = ui.jopen || {}; const units_ = units(deckById(d.id)); const mods = Math.ceil(units_.length / MOD); const cur = Math.floor(Math.max(0, units_.findIndex((u) => !u.done)) / MOD); const o = ui.jopen[d.id] || { [Math.min(cur, mods - 1)]: true }; o[d.k] = !o[d.k]; ui.jopen[d.id] = o; rerender(); },
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
  if (u && u.done) { earnCoins(10); notify(`Etapa ${p.n} concluída · +10 moedas`); S.units = (S.units || 0) + 1; todayLog().units++; }
}

// Próxima etapa: a etapa atual da trilha que você estudou por último (ou a primeira do seu plano).
function nextUnit() {
  const decks = personaDecks().map(deckById).filter(Boolean);
  let best = null, bestAt = -1;
  for (const d of decks) {
    let last = 0; for (const q of d.questions) { const c = S.cards[q.id]; if (c && c.last > last) last = c.last; }
    const dg = S.user.diag; if (dg && dg.start === d.id && last <= dg.at) last = dg.at + 1; // depois do diagnóstico, começa pela trilha mais fraca
    const u = units(d).find((x) => x.state === 'current');
    if (u && last > bestAt) { best = { d, u }; bestAt = last; }
  }
  return best;
}

/* ================= Plano de hoje =================
   Três passos curtos, sempre na mesma ordem: revisar o que está esquecendo, avançar uma etapa
   e bater a meta para abrir o baú. Dá um motivo concreto para abrir o app todo dia. */
function todayPlan() {
  const L = peekToday(), due = dueIds().length, g = S.user.goal, steps = [];
  const size = Math.max(5, Math.min(10, g));
  if (due || L.rev) steps.push({ done: !due, t: due ? 'Revisar ' + plural(Math.min(due, 20), 'questão', 'questões') : 'Revisões em dia', s: due ? 'Antes que a memória caia abaixo da meta' : plural(L.rev, 'revisão feita', 'revisões feitas') + ' hoje', act: 'review-all', cta: 'Revisar' });
  else steps.push({ done: L.cycles > 0, t: L.cycles ? 'Ciclo do dia feito' : 'Ciclo de ' + size + ' questões', s: L.cycles ? plural(L.n, 'questão respondida', 'questões respondidas') + ' hoje' : 'Leva uns 5 minutos', act: 'cycle-all', cta: 'Começar' });
  const nu = nextUnit();
  if (L.units) steps.push({ done: true, t: L.units > 1 ? L.units + ' etapas concluídas' : 'Etapa concluída', s: nu ? 'Próxima: etapa ' + nu.u.n + ' de ' + nu.d.title : 'Trilhas em dia' });
  else if (nu) steps.push({ done: false, t: 'Etapa ' + nu.u.n + ' · ' + nu.d.title, s: nu.u.topics.slice(0, 2).join(' e '), act: 'unit-start', ds: { id: nu.d.id, n: nu.u.n }, data: `data-id="${esc(nu.d.id)}" data-n="${nu.u.n}"`, cta: nu.u.seen ? 'Continuar' : 'Começar' });
  // Aula do dia: a próxima aula não lida da trilha em foco (carregada sob demanda).
  const ld = nu ? nu.d : null; const LL = ld && typeof lessonsOf === 'function' ? lessonsOf(ld) : null;
  if (LL && LL.length) {
    const readToday = Object.values(S.read || {}).some((t) => dayKey(new Date(t)) === dayKey());
    const nl = LL.find((l) => !(S.read && S.read[l.id]));
    if (readToday) steps.push({ done: true, t: 'Aula do dia lida', s: nl ? 'Próxima: ' + nl.title : 'Todas as aulas da trilha lidas' });
    else if (nl) steps.push({ done: false, t: 'Aula: ' + nl.title, s: nl.mins + ' min de leitura · ' + ld.title, act: 'aula', ds: { d: ld.id, id: nl.id }, data: `data-d="${esc(ld.id)}" data-id="${esc(nl.id)}"`, cta: 'Ler' });
  }
  const opened = S.chest === dayKey(), ready = chestReady(), n = Math.min(L.n, g);
  steps.push({ done: opened, chest: true, t: opened ? 'Baú do dia aberto' : ready ? 'Abrir o baú do dia' : 'Bater a meta e abrir o baú', s: opened ? 'Volte amanhã para um novo' : n + ' de ' + g + ' questões', bar: opened ? 0 : n / g, act: ready ? 'chest-open' : 'cycle-all', cta: ready ? 'Abrir' : 'Estudar', hot: ready });
  return steps;
}
function planCard() {
  const steps = todayPlan(); const done = steps.filter((x) => x.done).length; const all = done === steps.length;
  const cur = steps.findIndex((x) => !x.done || false);
  const li = steps.map((x, i) => {
    const state = x.done ? 'done' : i === cur ? 'cur' : 'todo';
    const dot = x.done ? tickIco() : x.chest ? chestSVG(false) : `<b class="num">${i + 1}</b>`;
    const body = `<span class="ps-txt"><b>${esc(x.t)}</b><span>${esc(x.s)}</span>${x.bar ? `<span class="bar"><i class="o" style="width:${Math.round(x.bar * 100)}%"></i></span>` : ''}</span>`;
    const pill = state === 'cur' || x.hot ? `<span class="btn ${x.hot ? 'btn-orange' : 'btn-orange'} btn-sm">${esc(x.cta)}</span>` : x.done ? '' : chev();
    return x.done || !x.act ? `<li class="ps ${state}${x.chest ? ' is-chest' : ''}"><span class="ps-dot">${dot}</span>${body}</li>`
      : `<li class="ps ${state}${x.chest ? ' is-chest' : ''}"><button class="ps-btn" data-act="${x.act}" ${x.data || ''}><span class="ps-dot">${dot}</span>${body}${pill}</button></li>`;
  }).join('');
  return `<section class="plan${all ? ' all' : ''}" aria-label="Plano de hoje">
    <div class="plan-h"><div><small>Plano de hoje</small><b>${all ? 'Dia completo. Mandou bem!' : done ? done + ' de ' + steps.length + ' passos feitos' : steps.length + ' passos curtos'}</b></div>
      <span class="plan-ring" style="--p:${Math.round((done / steps.length) * 100)}" aria-label="${done} de ${steps.length}"><span class="num">${done}/${steps.length}</span></span></div>
    <ol class="plan-steps">${li}</ol>
    ${all ? `<p class="plan-foot">${ico('flame')} Sequência garantida hoje. Amanhã tem baú novo.</p>` : ''}
  </section>`;
}

// Fim de ciclo: mostra o plano e leva direto ao próximo passo (evita o "e agora?").
function planNext() { const steps = todayPlan(); return { steps, done: steps.filter((x) => x.done).length, nx: steps.find((x) => !x.done && x.act) }; }
function planSummaryHTML() {
  const { steps, done, nx } = planNext(); const n = steps.length;
  const goLbl = !nx ? '' : nx.act === 'chest-open' ? 'Abrir o baú do dia' : nx.act === 'unit-start' ? (nx.cta === 'Continuar' ? 'Continuar a etapa ' : 'Começar a etapa ') + nx.ds.n : nx.act === 'review-all' ? 'Revisar o que falta' : nx.act === 'aula' ? 'Ler a aula do dia' : 'Mais um ciclo';
  const sub = !nx ? 'Plano de hoje completo' : nx.act === 'cycle-all' && nx.chest ? 'Faltam ' + plural(Math.max(0, S.user.goal - peekToday().n), 'questão', 'questões') + ' para abrir o baú' : 'Próximo: ' + nx.t;
  return `<div class="plan-mini"><span class="plan-ring" style="--p:${Math.round((done / n) * 100)}"><span class="num">${done}/${n}</span></span><div><small>Plano de hoje</small><b>${esc(sub)}</b></div></div>
    <div class="blk" style="gap:8px">${nx ? `<button class="btn btn-orange btn-block" data-act="plan-go">${esc(goLbl)}</button>${nx.act !== 'cycle-all' ? '<button class="btn btn-soft btn-block" data-act="again">Mais um ciclo</button>' : ''}` : '<button class="btn btn-orange btn-block" data-act="again">Mais um ciclo</button>'}<button class="btn btn-text btn-block" data-act="end">Voltar ao início</button></div>`;
}
ACT['plan-go'] = () => {
  const { nx } = planNext(); if (!nx) return ACT.end();
  if (nx.act === 'cycle-all' && ui.session) return ACT.again();
  ACT.end(); ACT[nx.act](nx.ds || {});
};
