/* ================= Saúde do app (só no site, com servidor) =================
   1) Erros: mensagem, arquivo, linha, versão e tela; no máximo 5 por abertura. Nada de nome, e-mail ou conteúdo.
   2) Uso anônimo: contagem por dia de eventos de uma lista fechada (abrir, ciclo, aula…), enviada em lote.
   A pessoa pode desligar as estatísticas no Perfil. 3) Offline total: depois da primeira abertura, o app baixa em
   segundo plano as aulas, o índice de leis e as capas para funcionar sem internet. */
const APP_VER = '7.3';
const TEL = { errs: 0, seen: new Set(), ev: {}, timer: null };
function telErr(msg, src, line) {
  if (!API || !API.on || TEL.errs >= 5) return; const k = msg + '|' + src + '|' + line; if (TEL.seen.has(k)) return; TEL.seen.add(k); TEL.errs++;
  const ua = (navigator.userAgent.match(/(Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_]+)/) || [''])[0] + ' ' + ((navigator.userAgent.match(/(Chrome|Firefox|Safari|Edg)\/\d+/) || [''])[0]);
  try { fetch('/api/client-errors', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ msg: String(msg).slice(0, 300), src: String(src || '').replace(location.origin, '').slice(0, 120), line: Number(line) || 0, ver: APP_VER, tab: ui.tab, ua: ua.trim() }) }).catch(() => {}); } catch (e) { /* sem rede */ }
}
window.addEventListener('error', (e) => telErr(e.message || 'erro', e.filename, e.lineno));
window.addEventListener('unhandledrejection', (e) => { const r = e.reason; if (r && (r.code === 'offline' || r.name === 'AbortError')) return; telErr('promise: ' + ((r && (r.message || r.code)) || String(r)).slice(0, 200), '', 0); });
function track(ev) {
  if (!S.user || S.user.stats === false) return;
  TEL.ev[ev] = (TEL.ev[ev] || 0) + 1;
  if (!TEL.timer) TEL.timer = setTimeout(telFlush, 60000);
}
function telFlush() {
  clearTimeout(TEL.timer); TEL.timer = null; const ev = TEL.ev; TEL.ev = {};
  if (!Object.keys(ev).length || !API || !API.on || S.user.stats === false) return;
  const body = JSON.stringify({ ev });
  try { if (navigator.sendBeacon) navigator.sendBeacon('/api/usage', new Blob([body], { type: 'application/json' })); else fetch('/api/usage', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body }).catch(() => {}); } catch (e) { /* sem rede */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') telFlush(); });
// Offline total: com o service worker ativo, baixa o resto do conteúdo uma vez, em segundo plano.
function prefetchOffline() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller || !navigator.onLine) return;
  const c = navigator.connection; if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;
  if (lsGet('memory.offline.v') === APP_VER) return;
  const urls = ['data/laws.json', 'data/concursos.json', ...BUILTIN_DECKS.map((d) => 'data/lessons/' + d.id + '.json'), ...Object.keys(PHOTOS).filter((k) => PHOTOS[k] === 1).map((id) => 'img/' + id + '-640.webp')];
  let i = 0; const next = () => { if (i >= urls.length) { lsSet('memory.offline.v', APP_VER); return; } const u = urls[i++]; fetch(u).catch(() => {}).finally(() => setTimeout(next, 120)); };
  (window.requestIdleCallback || ((f) => setTimeout(f, 2500)))(next);
}
