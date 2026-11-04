/* ================= Aulas =================
   Teoria curta antes da prática: cada aula termina com um exemplo resolvido, as pegadinhas e o botão de praticar
   as questões ligadas a ela. Aulas das trilhas nativas ficam em data/lessons/<trilha>.json (carregadas sob demanda);
   as das trilhas geradas para concursos viajam dentro da própria trilha. */
const LES = { cache: {}, loading: {}, err: {} };
function lessonsOf(d) {
  if (!d) return [];
  if (d.custom || d.classDeck) return d.lessons || [];
  if (LES.cache[d.id]) return LES.cache[d.id];
  if (!LES.loading[d.id] && !LES.err[d.id]) {
    LES.loading[d.id] = true;
    loadJSONData('lessons/' + d.id + '.json').then((x) => { LES.cache[d.id] = (x && x.lessons) || []; }).catch(() => { LES.err[d.id] = true; LES.cache[d.id] = []; })
      .finally(() => { LES.loading[d.id] = false; if ((ui.tab === 'trilhas' && ui.deck === d.id) || ui.tab === 'aula') rerender(); });
  }
  return null;
}
const isRead = (l) => !!(S.read && S.read[l.id]);
function lessonsBlock(d) {
  const L = lessonsOf(d);
  if (L === null) return '<div class="blk"><div class="sec"><h2>Aulas</h2></div><div class="skel" style="height:120px"></div></div>';
  if (!L.length) return '';
  const done = L.filter(isRead).length; const nextI = Math.max(0, L.findIndex((l) => !isRead(l)));
  const show = ui.lmore === d.id ? L : L.slice(0, 3);
  return `<div class="blk"><div class="sec"><h2>Aulas</h2><span class="tiny num" style="font-weight:700">${done}/${L.length} estudadas</span></div>
    <div class="list lessons">${show.map((l, i) => { const r = isRead(l); const nx = !r && i === nextI; return `<button class="item lesson-it ${r ? 'read' : ''} ${nx ? 'next' : ''}" data-act="aula" data-d="${esc(d.id)}" data-id="${esc(l.id)}">
      <span class="tile ${r ? 'c-mint' : nx ? 'c-peach' : 'c-blue'} num">${r ? ico('check') : i + 1}</span><div class="main"><b>${esc(l.title)}</b><span>${l.mins} min de leitura${l.qids && l.qids.length ? ' · ' + l.qids.length + ' questões' : ''}${nx ? ' · próxima' : ''}</span></div>${chev()}</button>`; }).join('')}</div>
    ${L.length > 3 && ui.lmore !== d.id ? `<button class="btn btn-ghost btn-sm btn-block" data-act="lmore" data-id="${esc(d.id)}">Ver as ${L.length} aulas</button>` : ''}</div>`;
}
function viewAula() {
  const d = deckById(ui.aulaDeck); const L = lessonsOf(d);
  if (L === null) return '<div class="page"><div class="skel" style="height:300px"></div></div>';
  const i = (L || []).findIndex((l) => l.id === ui.aulaId); const l = L[i];
  if (!d || !l) { ui.tab = 'trilhas'; return viewTrilhas(); }
  const nxt = L[i + 1];
  const sec = (s) => `<section class="ls-sec"><h2>${esc(s.h)}</h2>${s.p.map((p) => `<p>${esc(p)}</p>`).join('')}${s.list && s.list.length ? `<ul>${s.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</section>`;
  return `<div class="aula">
    <div class="aula-top"><button class="icon-btn" data-act="aula-back" aria-label="Voltar para a trilha">${ico('back')}</button><div class="pline" role="progressbar" aria-label="Aulas da trilha" aria-valuemin="1" aria-valuenow="${i + 1}" aria-valuemax="${L.length}"><i style="width:${Math.round(((i + 1) / L.length) * 100)}%"></i></div><span class="num tiny" style="font-weight:700">${i + 1}/${L.length}</span>
      ${'speechSynthesis' in window ? `<button class="icon-btn flat" data-act="aula-tts" aria-label="${ui.tts ? 'Parar leitura' : 'Ouvir a aula'}" aria-pressed="${!!ui.tts}">${ico('sound')}</button>` : ''}</div>
    <article class="page aula-body">
      <span class="tag c-blue">${esc(d.title)} · Aula ${i + 1}</span>
      <h1>${esc(l.title)}</h1>
      <p class="aula-intro">${esc(l.intro)}</p>
      <p class="tiny">${ico('clock')} ${l.mins} min${isRead(l) ? ' · estudada' : ''}</p>
      ${l.sections.map(sec).join('')}
      ${l.example ? `<section class="ls-ex"><span class="ls-k">${ico('idea')} Exemplo resolvido</span><p class="ls-c">${esc(l.example.c)}</p><p class="ls-q">${esc(l.example.q)}</p>
        <details><summary>Ver a resposta</summary><p>${esc(l.example.a)}</p></details></section>` : ''}
      ${l.traps && l.traps.length ? `<section class="ls-traps"><span class="ls-k">${ico('warn')} Pegadinhas de prova</span><ul>${l.traps.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      ${l.summary && l.summary.length ? `<section class="ls-sum"><span class="ls-k">${ico('list')} Para lembrar</span><ol>${l.summary.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
      ${l.src ? `<p class="tiny">Fonte: ${esc(l.src)}</p>` : ''}
    </article>
    <div class="dock"><div class="duo">${l.qids && l.qids.filter((id) => QINDEX[id]).length ? `<button class="btn btn-orange" data-act="aula-praticar">Praticar ${l.qids.filter((id) => QINDEX[id]).length} questões</button>` : `<button class="btn btn-orange" data-act="aula-done">Marcar como estudada</button>`}${nxt ? `<button class="btn btn-ghost" data-act="aula" data-d="${esc(d.id)}" data-id="${esc(nxt.id)}">Próxima aula</button>` : ''}</div></div>
  </div>`;
}
function markRead(id) { S.read = S.read || {}; if (!S.read[id]) { S.read[id] = Date.now(); earnCoins(2); } persist(); }
Object.assign(ACT, {
  'aula': (d) => { if (ui.tts) ttsStop(); ui.aulaDeck = d.d; ui.aulaId = d.id; ui.tab = 'aula'; render(); $('#view').scrollTop = 0; },
  'aula-back': () => { if (ui.tts) ttsStop(); ui.tab = 'trilhas'; ui.deck = ui.aulaDeck; render(); },
  'lmore': (d) => { ui.lmore = d.id; rerender(); },
  'aula-done': () => { markRead(ui.aulaId); notify('Aula estudada · +2 moedas'); rerender(); },
  'aula-praticar': () => {
    const d = deckById(ui.aulaDeck); const l = (lessonsOf(d) || []).find((x) => x.id === ui.aulaId); if (!l) return;
    markRead(l.id); if (ui.tts) ttsStop(); const ids = l.qids.filter((id) => QINDEX[id]);
    startCycle({ ids, size: ids.length, title: l.title });
  },
  'aula-tts': () => {
    if (ui.tts) { ttsStop(); rerender(); return; }
    const d = deckById(ui.aulaDeck); const l = (lessonsOf(d) || []).find((x) => x.id === ui.aulaId); if (!l) return;
    const text = [l.title, l.intro, ...l.sections.flatMap((s) => [s.h, ...s.p, ...(s.list || [])]), l.example ? 'Exemplo. ' + l.example.c + ' ' + l.example.q + ' Resposta: ' + l.example.a : '', ...(l.traps || []).map((t) => 'Pegadinha: ' + t), 'Para lembrar: ' + (l.summary || []).join(' ')].join('. ');
    const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; const v = speechSynthesis.getVoices().find((x) => /^pt(-|_)BR/i.test(x.lang)); if (v) u.voice = v;
    u.onend = u.onerror = () => { ui.tts = false; const b = document.querySelector('[data-act=aula-tts]'); if (b) b.setAttribute('aria-pressed', 'false'); };
    ttsStop(); ui.tts = true; speechSynthesis.speak(u); rerender();
  }
});
