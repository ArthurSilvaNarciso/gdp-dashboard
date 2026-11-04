/* ================= Relatório da semana, pontos fracos e cartão para compartilhar ================= */
const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
function weekStats(back = 0) {
  const days = []; let n = 0, ok = 0, act = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - (i + back * 7) * DAY); const L = S.log[dayKey(d)] || {};
    const x = { d, n: L.n || 0, ok: L.ok || 0 }; days.push(x); n += x.n; ok += x.ok; if (x.n) act++;
  }
  return { days, n, ok, act, acc: n ? Math.round((ok / n) * 100) : null };
}
function weekHeadline(w, p) {
  if (!w.n) return 'Sua semana começa hoje';
  if (p.n && w.n >= p.n * 2) return 'Você dobrou o ritmo da semana passada';
  if (p.n && w.n > p.n * 1.1) return 'Ritmo ' + Math.round(((w.n - p.n) / p.n) * 100) + '% maior que na semana passada';
  if (w.act >= 5) return 'Semana de constância: ' + w.act + ' de 7 dias';
  if (w.acc >= 80) return 'Acerto alto: ' + w.acc + '% na semana';
  return plural(w.n, 'questão', 'questões') + ' na semana. Siga no ritmo';
}
function weekReportHTML() {
  const w = weekStats(), p = weekStats(1); const g = S.user.goal;
  const max = Math.max(g, ...w.days.map((x) => x.n));
  const delta = p.n ? Math.round(((w.n - p.n) / p.n) * 100) : null;
  const dl = delta == null || !w.n ? '' : `<em class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%</em>`;
  const bars = w.days.map((x, i) => `<span class="wb${i === 6 ? ' today' : ''}${x.n >= g ? ' hit' : ''}" title="${x.d.toLocaleDateString('pt-BR')}: ${x.n} questões"><span class="col"><i class="${x.n ? '' : 'z'}" style="height:${x.n ? Math.max(6, Math.round((x.n / max) * 100)) : 4}%"></i></span><small>${WD[x.d.getDay()]}</small></span>`).join('');
  return `<section class="wreport" aria-label="Resumo dos últimos 7 dias">
    <div class="wr-h"><div><small>Últimos 7 dias</small><b>${esc(weekHeadline(w, p))}</b></div>
      ${w.n ? `<button class="btn btn-soft btn-sm" data-act="share-week" aria-label="Compartilhar resumo da semana">${ico('share')}<span>Compartilhar</span></button>` : ''}</div>
    <div class="wr-body"><div class="wr-nums">
      <div><b class="num">${w.n}</b><span>questões ${dl}</span></div>
      <div><b class="num">${w.acc == null ? '–' : w.acc + '%'}</b><span>de acerto</span></div>
      <div><b class="num">${w.act}/7</b><span>dias ativos</span></div></div>
      <div class="wr-bars" role="img" aria-label="Questões por dia na última semana">${bars}<span class="wr-goal" style="bottom:calc(18px + (100% - 18px) * ${(g / max).toFixed(3)})" title="Meta diária"></span></div></div>
  </section>`;
}

// Pontos fracos: domínio = memória atual × confiança da última resposta.
function weakCards() {
  const conf = { 1: 0.25, 2: 0.55, 3: 0.85, 4: 1 };
  return seenIds().map((id) => { const c = S.cards[id]; const x = QINDEX[id]; return { id, dom: retr(c) * (conf[c.g] || 0.85), topic: x.q.topic, deck: x.deck }; })
    .filter((x) => x.dom < 0.8).sort((a, b) => a.dom - b.dom);
}
function weakHTML() {
  const ws = weakCards(); if (!ws.length) return '';
  return `<div class="blk"><div class="sec"><h2>Pontos fracos</h2><span class="tiny num" style="font-weight:700">${ws.length} ${ws.length === 1 ? 'tópico' : 'tópicos'}</span></div>
    <div class="card weak">${ws.slice(0, 5).map((x) => { const p = Math.round(x.dom * 100); return `<div class="wk"><div class="main"><b>${esc(x.topic)}</b><span>${esc(x.deck.title)}</span></div><div class="wk-m"><span class="bar"><i class="${p < 50 ? 'r' : 'o'}" style="width:${Math.max(6, p)}%"></i></span><span class="num">${p}%</span></div></div>`; }).join('')}
      <p class="small muted">Mistura memória que está caindo com respostas no chute ou com dúvida.</p>
      <button class="btn btn-primary btn-block" data-act="weak-train">Treinar ${ws.length > 10 ? 'os 10 mais fracos' : ws.length === 1 ? 'este tópico' : 'estes ' + ws.length}</button></div></div>`;
}

/* ---------- Cartão da semana (imagem 1080×1920 para stories/status) ---------- */
function rrect(x, ctx, X, Y, W, H, r) { r = Math.min(r, W / 2, H / 2); ctx.beginPath(); ctx.moveTo(X + r, Y); ctx.arcTo(X + W, Y, X + W, Y + H, r); ctx.arcTo(X + W, Y + H, X, Y + H, r); ctx.arcTo(X, Y + H, X, Y, r); ctx.arcTo(X, Y, X + W, Y, r); ctx.closePath(); if (x) ctx.fill(); }
async function weekCardPNG() {
  const w = weekStats(), p = weekStats(1); const W = 1080, H = 1920;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]); } catch (e) { /* fontes do sistema */ }
  const D = 'Poppins, "Nunito Sans", system-ui, sans-serif', B = '"Nunito Sans", system-ui, sans-serif';
  c.fillStyle = '#1F2A6B'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#FF7A22'; c.beginPath(); c.arc(W + 40, 260, 330, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 3; for (const r of [420, 520, 620]) { c.beginPath(); c.arc(W + 40, 260, r, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.arc(-80, H - 180, 300, 0, Math.PI * 2); c.fill();
  // marca
  c.fillStyle = '#4A5BD6'; c.beginPath(); c.arc(112, 140, 34, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#FF7A22'; c.beginPath(); c.arc(150, 140, 34, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.font = `700 46px ${D}`; c.textBaseline = 'middle'; c.fillText('Memory', 204, 144);
  // avatar
  try {
    const svg = avatarSVG(avatarConfig()).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" ');
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    c.save(); c.beginPath(); c.arc(W / 2, 520, 200, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.clip(); c.drawImage(img, W / 2 - 200, 320, 400, 400); c.restore();
    c.strokeStyle = '#FF7A22'; c.lineWidth = 12; c.beginPath(); c.arc(W / 2, 520, 206, 0, Math.PI * 2); c.stroke();
  } catch (e) { /* sem avatar */ }
  c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.72)'; c.font = `700 34px ${B}`;
  const first = (S.user.name || '').trim().split(/\s+/)[0]; c.fillText((first ? first + ' · ' : '') + 'minha semana', W / 2, 790);
  const st = streakNow();
  c.fillStyle = '#fff'; c.font = `700 210px ${D}`; c.fillText(String(st), W / 2, 960);
  c.fillStyle = '#FFB27A'; c.font = `700 52px ${D}`; c.fillText(st === 1 ? 'dia seguido estudando' : 'dias seguidos estudando', W / 2, 1100);
  // números
  const mem = memoryNow(); const cards = [[String(w.n), 'questões'], [w.acc == null ? '–' : w.acc + '%', 'de acerto'], [mem == null ? '–' : Math.round(mem * 100) + '%', 'memória']];
  cards.forEach(([v, l], i) => {
    const X = 70 + i * 323, Y = 1190; c.fillStyle = 'rgba(255,255,255,.1)'; rrect(true, c, X, Y, 293, 220, 36);
    c.fillStyle = '#fff'; c.font = `700 84px ${D}`; c.fillText(v, X + 146, Y + 100); c.fillStyle = 'rgba(255,255,255,.72)'; c.font = `700 32px ${B}`; c.fillText(l, X + 146, Y + 170);
  });
  // barras da semana
  const max = Math.max(S.user.goal, ...w.days.map((x) => x.n)), bx = 150, bw = 780 / 7;
  w.days.forEach((x, i) => {
    const h = x.n ? Math.max(18, Math.round((x.n / max) * 190)) : 10; const X = bx + i * bw + bw / 2 - 30;
    c.fillStyle = x.n >= S.user.goal ? '#FF7A22' : x.n ? '#7C8BF0' : 'rgba(255,255,255,.14)'; rrect(true, c, X, 1680 - h, 60, h, 16);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = `700 30px ${B}`; c.fillText(WD[x.d.getDay()], X + 30, 1722);
  });
  c.fillStyle = 'rgba(255,255,255,.85)'; c.font = `600 36px ${B}`;
  c.fillText(p.n && w.n >= p.n * 2 ? 'Dobrei o ritmo da semana passada' : p.n && w.n > p.n ? 'Ritmo ' + Math.round(((w.n - p.n) / p.n) * 100) + '% maior que na semana passada' : w.act + ' de 7 dias com estudo ativo', W / 2, 1480);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.font = `600 30px ${B}`; c.fillText('Estudo por recuperação ativa · Memory', W / 2, 1820);
  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'));
}
Object.assign(ACT, {
  'weak-train': () => { const ids = weakCards().slice(0, 10).map((x) => x.id); if (ids.length) startCycle({ ids, size: ids.length, title: 'Pontos fracos' }); },
  'share-week': async () => {
    ui.sheet = `<div class="share-sheet"><h2>Seu cartão da semana</h2><div class="share-prev"><span class="spin"></span></div></div>`; render();
    let blob; try { blob = await weekCardPNG(); } catch (e) { blob = null; }
    if (!blob) { ui.sheet = null; render(); return notify('Não deu para gerar a imagem agora'); }
    const file = new File([blob], 'memory-semana.png', { type: 'image/png' }); const url = URL.createObjectURL(blob);
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    ACT['share-week'].file = file;
    ui.sheet = `<div class="share-sheet"><h2>Seu cartão da semana</h2><p class="small muted">Poste no story ou no status e chame alguém para estudar junto.</p>
      <div class="share-prev"><img src="${url}" width="1080" height="1920" alt="Cartão com o resumo da sua semana no Memory"></div>
      ${canShare ? '<button class="btn btn-orange btn-block" data-act="share-week-go">Compartilhar</button>' : `<a class="btn btn-orange btn-block" href="${url}" download="memory-semana.png">Salvar imagem</a><p class="tiny" style="text-align:center">No celular, você também pode tocar e segurar a imagem para salvar.</p>`}
      <button class="btn btn-text btn-block" data-act="sheet-close">Fechar</button></div>`;
    render();
  },
  'share-week-go': async () => { const f = ACT['share-week'].file; if (!f) return; try { await navigator.share({ files: [f], title: 'Minha semana no Memory' }); } catch (e) { /* cancelado */ } }
});
