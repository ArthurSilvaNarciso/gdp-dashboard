/* ================= Edital verticalizado =================
   Cada tópico do edital é ligado às questões da trilha (pelo tema da questão e pelas aulas). Com isso o plano mostra
   o progresso tópico a tópico, um mapa de pontos fortes e fracos, o ponto mais fraco para atacar e um cronograma
   semanal até a prova que se recalcula sozinho conforme a pessoa avança (ou atrasa). */
const ED_STOP = new Set('de da do das dos e em na no nas nos a o as os para por com sem sobre ao aos um uma lei leis nocoes geral gerais conceito conceitos aspectos principais demais outras outros suas seus tipos regras'.split(' '));
const edWords = (t) => norm(t).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !ED_STOP.has(w));
const edStem = (w) => w.slice(0, Math.max(5, w.length - 2));
function topicQs(d, t) {
  const W = edWords(t).map(edStem); if (!d || !W.length) return [];
  const hit = (txt) => { const n = norm(txt); return W.some((w) => n.includes(w)); };
  const ids = new Set(d.questions.filter((q) => hit(q.topic || '')).map((q) => q.id));
  for (const l of lessonsOf(d) || []) if (hit(l.title)) for (const id of l.qids || []) ids.add(id);
  return [...ids].filter((id) => QINDEX[id]);
}
// Pontuação de domínio 0–100 de um conjunto de questões: acerto ponderado pela memória atual.
function edScore(ids) {
  if (!ids.length) return null; const now = Date.now(); let s = 0;
  for (const id of ids) { const c = S.cards[id]; if (c && c.s) s += (c.ok / Math.max(1, c.n)) * retr(c, now); }
  return Math.round((s / ids.length) * 100);
}
const edSeen = (ids) => ids.filter((id) => S.cards[id] && S.cards[id].s).length;
function edLevel(ids, done) {
  if (!ids.length) return done ? 'ok' : 'novo';
  const seen = edSeen(ids); if (!seen) return done ? 'ok' : 'novo';
  const sc = edScore(ids); return sc >= 75 && seen >= ids.length * 0.7 ? 'dom' : sc >= 45 ? 'ok' : 'fraco';
}
const ED_LBL = { novo: 'Não estudado', fraco: 'Precisa reforçar', ok: 'Em andamento', dom: 'Dominado' };
const edKey = (i, t) => i + ':' + norm(t).slice(0, 48);
// Blocos do conteúdo de uma trilha: as aulas, com todas as questões distribuídas entre elas pelo tema.
function edUnits(d) {
  const L = lessonsOf(d) || []; if (!L.length) return [{ t: d.title, ids: d.questions.map((q) => q.id) }];
  const units = L.map((l) => ({ t: l.title, ids: (l.qids || []).filter((id) => QINDEX[id]), w: edWords(l.title).map(edStem) }));
  const taken = new Set(units.flatMap((u) => u.ids));
  const topicOf = {}; units.forEach((u, k) => u.ids.forEach((id) => { topicOf[norm(QINDEX[id].q.topic || '')] = k; }));
  const rest = [];
  for (const q of d.questions) {
    if (taken.has(q.id)) continue; const tn = norm(q.topic || '');
    let k = topicOf[tn]; if (k == null) k = units.findIndex((u) => u.w.some((w) => tn.includes(w)));
    if (k >= 0) units[k].ids.push(q.id); else rest.push(q.id);
  }
  if (rest.length) units.push({ t: 'Mais questões da trilha', ids: rest });
  return units;
}
// Monta a estrutura do edital do plano atual.
function edital() {
  const p = S.user.plan; if (!p) return null; p.done = p.done || {};
  return p.subjects.map((x, i) => {
    const d = x.deck && deckById(x.deck);
    const units = d ? edUnits(d) : [];
    const covered = (t) => d && topicQs(d, t).length > 0;
    const extra = (x.topicos || []).filter((t) => !covered(t)).map((t) => ({ t, ids: [] }));
    const topics = [...units, ...extra].map((u, j) => { const done = !!p.done[edKey(i, u.t)]; return { t: u.t, j, ids: u.ids, done, lv: edLevel(u.ids, done), sc: edScore(u.ids) }; });
    const all = d ? d.questions.map((q) => q.id) : [];
    const sc = all.length ? edScore(all) : null;
    const doneT = topics.filter((t) => t.lv === 'dom' || t.done).length;
    return { i, nome: x.nome, d, topics, all, sc: sc == null ? 0 : sc, seen: edSeen(all), doneT };
  });
}
// O ponto mais fraco: tópico com questões e menor domínio (os nunca vistos contam como 0, mas só depois dos fracos já vistos).
function edWeakest(E) {
  let best = null;
  for (const s of E) for (const t of s.topics) {
    if (!t.ids.length || t.lv === 'dom') continue;
    const k = t.lv === 'fraco' ? t.sc : 100 + (t.sc || 0);
    if (!best || k < best.k) best = { k, s, t };
  }
  if (best) return best;
  const s = E.filter((x) => x.d).sort((a, b) => a.sc - b.sc)[0]; return s ? { s, t: null } : null;
}
// Cronograma: distribui a carga diária entre as matérias, com mais peso para as mais fracas e com mais coisa por estudar.
function edSchedule(E, days, perDay) {
  const S0 = E.filter((s) => s.d).map((s) => ({ s, need: Math.max(4, s.all.length - Math.round(s.all.length * s.sc / 100)), w: 1 + (100 - s.sc) / 50 }));
  if (!S0.length) return [];
  const out = []; const now = new Date(); const finalWeek = (k) => days != null && days - k <= 7;
  for (let k = 0; k < 7 && (days == null || k <= days); k++) {
    const dt = new Date(now.getTime() + k * 864e5);
    if (finalWeek(k)) { out.push({ dt, k, review: true, items: [], total: perDay }); continue; }
    S0.sort((a, b) => b.need * b.w - a.need * a.w);
    const a = S0[0], b = S0[1]; const items = [];
    const qa = b ? Math.ceil(perDay * 0.6) : perDay; items.push({ s: a.s, n: Math.min(qa, Math.max(3, a.need)) }); a.need = Math.max(0, a.need - qa);
    if (b) { const qb = perDay - items[0].n; if (qb > 0) { items.push({ s: b.s, n: qb }); b.need = Math.max(0, b.need - qb); } }
    out.push({ dt, k, items, total: items.reduce((x, y) => x + y.n, 0) });
  }
  return out;
}
const ED_WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function edHeat(E) {
  return `<div class="blk"><div class="sec"><h2>Mapa do edital</h2><span class="tiny">${ico('info')} toque numa matéria</span></div>
    <div class="ed-legend tiny" aria-hidden="true"><span><i class="lv-novo"></i>Não estudado</span><span><i class="lv-fraco"></i>Reforçar</span><span><i class="lv-ok"></i>Em andamento</span><span><i class="lv-dom"></i>Dominado</span></div>
    <div class="list ed-list">${E.map((s) => {
      const open = ui.edOpen === s.i; const n = s.topics.length;
      return `<div class="ed-subj ${open ? 'open' : ''}"><button class="item ed-head" data-act="ed-open" data-i="${s.i}" aria-expanded="${open}"><div class="main"><b>${esc(s.nome)}</b>
        <div class="ed-cells" role="img" aria-label="${esc(s.nome)}: ${s.doneT} de ${n} tópicos dominados ou estudados">${s.topics.map((t) => `<i class="lv-${t.lv}"></i>`).join('') || '<i class="lv-novo"></i>'}</div>
        <span>${n ? s.doneT + '/' + n + ' tópicos' : 'sem tópicos no edital'}${s.d ? ' · domínio ' + s.sc + '%' : ' · sem trilha ainda'}</span></div>${ico(open ? 'up' : 'down', 'chev')}</button>
        ${open ? `<div class="ed-topics">${s.topics.map((t) => `<div class="ed-t"><button class="ed-chk" role="checkbox" aria-checked="${t.done}" data-act="ed-done" data-k="${esc(edKey(s.i, t.t))}" aria-label="Marcar “${esc(t.t)}” como estudado">${t.done ? ico('check') : ''}</button>
            <div class="main"><b>${esc(t.t)}</b><span><i class="dot lv-${t.lv}"></i>${ED_LBL[t.lv]}${t.ids.length ? ' · ' + edSeen(t.ids) + '/' + t.ids.length + ' questões' : ''}</span></div>
            ${t.ids.length ? `<button class="btn btn-ghost btn-sm" data-act="ed-go" data-i="${s.i}" data-j="${t.j}">Praticar</button>` : ''}</div>`).join('')}
          ${s.d ? `<button class="btn btn-text btn-sm" data-act="open-deck" data-id="${esc(s.d.id)}">Abrir a trilha completa</button>` : ''}</div>` : ''}</div>`;
    }).join('')}</div></div>`;
}
function edWeekHTML(E, days, perDay) {
  const W = edSchedule(E, days, perDay); if (!W.length) return '';
  return `<div class="blk"><div class="sec"><h2>Sua semana</h2><span class="tiny">recalcula a cada dia</span></div><div class="ed-week" role="region" aria-label="Cronograma da semana" tabindex="0">${W.map((d) => {
    const lbl = d.k === 0 ? 'Hoje' : d.k === 1 ? 'Amanhã' : ED_WD[d.dt.getDay()] + ' ' + d.dt.getDate();
    const body = d.review ? 'Revisão geral e simulado' : d.items.map((x) => `${esc(x.s.nome)} · ${x.n}`).join('<br>');
    return `<div class="ed-day ${d.k === 0 ? 'today' : ''}"><small>${lbl}</small><p>${body}</p></div>`;
  }).join('')}</div>
  ${W[0] ? `<button class="btn btn-orange btn-block" data-act="ed-today">${W[0].review ? 'Fazer a revisão de hoje' : 'Fazer o de hoje · ' + W[0].total + ' questões'}</button>` : ''}</div>`;
}
function edWeakHTML(E) {
  const w = edWeakest(E); if (!w) return '';
  const name = w.t ? w.t.t : w.s.nome; const why = w.t ? (w.t.lv === 'fraco' ? 'seu ponto mais fraco agora' : 'ainda não estudado') : 'matéria com menor domínio';
  return `<button class="callout ed-weak" data-act="ed-weak"><span class="tile c-peach">${ico('target')}</span><div><b>Atacar o ponto fraco: ${esc(name)}</b><p>${esc(w.s.nome)} · ${why}</p></div>${chev()}</button>`;
}
function edExamCard(p) {
  if (p.prova) return '';
  return `<button class="callout" data-act="ed-date"><span class="tile c-blue">${ico('calendar')}</span><div><b>Quando é a sua prova?</b><p>Com a data, o Memory monta o cronograma até o dia da prova.</p></div>${chev()}</button>`;
}
Object.assign(ACT, {
  'ed-open': (d) => { const i = Number(d.i); ui.edOpen = ui.edOpen === i ? null : i; rerender(); },
  'ed-done': (d) => { const p = S.user.plan; if (!p) return; p.done = p.done || {}; if (p.done[d.k]) delete p.done[d.k]; else p.done[d.k] = Date.now(); persist(); rerender(); },
  'ed-go': (d) => { const E = edital(); const s = E && E[Number(d.i)]; const t = s && s.topics[Number(d.j)]; if (!t || !t.ids.length) return; startCycle({ ids: t.ids, size: Math.min(12, t.ids.length), title: t.t.slice(0, 40) }); },
  'ed-weak': () => { track('weak_attack'); const E = edital(); const w = E && edWeakest(E); if (!w) return; if (w.t) startCycle({ ids: w.t.ids, size: Math.min(12, w.t.ids.length), title: w.t.t.slice(0, 40) }); else startCycle({ decks: [w.s.d.id], size: 10, title: w.s.nome }); },
  'ed-today': () => {
    const p = S.user.plan; const E = edital(); if (!E) return; const days = p.prova ? daysTo(p.prova) : null;
    const W = edSchedule(E, days, edPerDay(p, E)); const t = W[0]; if (!t) return;
    if (t.review) return startCycle({ decks: E.filter((s) => s.d).map((s) => s.d.id), size: Math.min(20, t.total), title: 'Revisão geral' });
    const ids = t.items.flatMap((x) => { const pool = x.s.all.slice().sort((a, b) => (S.cards[a] && S.cards[a].s ? retr(S.cards[a]) : -1) - (S.cards[b] && S.cards[b].s ? retr(S.cards[b]) : -1)); return pool.slice(0, x.n); });
    startCycle({ ids, size: ids.length, title: 'Plano de hoje' });
  },
  'ed-date': () => {
    const p = S.user.plan; const min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    ui.sheet = `<div class="blk" style="gap:12px"><h2>Data da prova</h2><p class="muted small">Se ainda não saiu a data, use uma estimativa. Dá para mudar depois.</p>
      <div class="field"><label for="ed-dt">Dia da prova</label><input id="ed-dt" class="input" type="date" min="${min}" value="${esc(p && p.prova || '')}"></div>
      <button class="btn btn-orange btn-block" data-act="ed-date-ok">Salvar data</button></div>`; renderSheet();
  },
  'ed-date-ok': () => {
    const v = ($('#ed-dt') || {}).value; const p = S.user.plan; if (!p) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '') || daysTo(v) < 1) return notify('Escolha uma data a partir de amanhã.');
    p.prova = v; S.user.exam = { name: (p.sigla || p.orgao || 'Prova').slice(0, 40), date: v }; persist(); ui.sheet = null; renderSheet(); rerender(); notify('Cronograma montado até ' + v.split('-').reverse().join('/') + '.');
  }
});
// Carga diária sugerida: o que falta (com folga para revisão) dividido pelos dias até a prova, sem passar de 60.
function edPerDay(p, E) {
  const dleft = p.prova ? daysTo(p.prova) : null; const left = E.reduce((a, s) => a + Math.max(0, s.all.length - s.seen), 0);
  return dleft && dleft > 7 ? Math.min(60, Math.max(8, Math.ceil((left * 1.6) / (dleft - 7)))) : Math.max(8, S.user.goal || 10);
}
