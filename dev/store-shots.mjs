// Capturas para a Play Store (1080×2338) com estado realista de uso: plano de concurso, progresso e aula.
import { createRequire } from 'node:module';
import { start } from './server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = 'android/store/';
const srv = await start(3967); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1080 / 390, serviceWorkers: 'block', locale: 'pt-BR', colorScheme: 'light' });
await c.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
const p = await c.newPage();
await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.toast{display:none!important}'; document.head.appendChild(st); }); });
await p.goto('http://localhost:3967/'); await p.waitForSelector('#view [data-act]');
await p.evaluate(async () => {
  await loadBodies();
  S.user.onboarded = true; S.user.name = 'Ana Beatriz'; S.user.termsAt = Date.now(); S.user.persona = 'concurso'; S.user.goal = 15;
  // 3 semanas de estudo
  const ids = ['port', 'dadm', 'dconst', 'etica', 'logica'].flatMap((d) => deckById(d).questions.slice(0, 26).map((q) => q.id));
  const now = Date.now();
  ids.forEach((id, k) => { const g = k % 5 === 0 ? 1 : k % 3 === 0 ? 2 : 3; schedule(id, g); const cc = S.cards[id]; cc.last = now - (k % 20) * 864e5; });
  for (let d = 0; d < 21; d++) { const k = dayKey(new Date(now - d * 864e5)); S.log[k] = Object.assign(LOG0(), { n: 12 + (d * 7) % 15, ok: 9 + (d * 5) % 10, cycles: 2 }); }
  S.streak = { count: 21, last: dayKey() }; S.xp = 4820; S.coins = { earned: 640, spent: 120 }; S.badges = S.badges || {}; for (const bd of BADGES.slice(0, 8)) S.badges[bd.id] = now;
  await loadConcursos();
  const c = CC.list.find((x) => /INSS|TRT|Tribunal|Pol[ií]cia/i.test(x.titulo + x.orgao)) || CC.list[0];
  planCreate({ ...c, prova: new Date(now + 46 * 864e5).toISOString().slice(0, 10) });
  persist();
});
const shot = async (name, fn, wait = 900) => { await p.evaluate(fn); await p.waitForTimeout(wait); await p.evaluate(() => { const v = document.getElementById('view'); if (v) v.scrollTop = 0; }); await p.waitForTimeout(150); await p.screenshot({ path: OUT + name + '.png' }); };
await shot('1-inicio', () => { ui.tab = 'home'; render(); });
await shot('2-concursos', () => { ui.tab = 'concursos'; render(); }, 1200);
await shot('3-plano', () => { ui.tab = 'plano'; render(); }, 1200);
await p.evaluate(() => { const v = document.getElementById('view'); const h = [...document.querySelectorAll('h2')].find((x) => /Mapa do edital/.test(x.textContent)); if (v && h) v.scrollTop = h.getBoundingClientRect().top - 90; });
await p.evaluate(() => { const i = edital().find((s) => s.d).i; ui.edOpen = i; render(); }); await p.waitForTimeout(500);
await p.evaluate(() => { const v = document.getElementById('view'); const h = [...document.querySelectorAll('h2')].find((x) => /Mapa do edital/.test(x.textContent)); if (v && h) v.scrollTop += h.getBoundingClientRect().top - 70; }); await p.waitForTimeout(200);
await p.screenshot({ path: OUT + '4-edital.png' });
await p.evaluate(() => { const v = document.getElementById('view'); if (v) v.scrollTop = 0; });
await shot('5-aula', () => { ACT.aula({ d: 'dadm', id: 'dadm-a1' }); }, 1500);
await p.evaluate(() => { ACT['aula-back'](); startCycle({ ids: ['dadm7'], size: 1, title: 'Direito Administrativo' }); }); await p.waitForTimeout(900);
await p.evaluate(() => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; s.pick = s.order.find((o) => o !== q.a); ACT.conf({ c: 'acho' }); }); await p.waitForTimeout(300);
await p.evaluate(() => ACT.consol()); await p.waitForTimeout(700); await p.screenshot({ path: OUT + '6-questao.png' });
await p.evaluate(() => { ui.session = null; ui.tab = 'progresso'; render(); }); await p.waitForTimeout(1000); await p.screenshot({ path: OUT + '7-progresso.png' });
await b.close(); srv.close(); console.log('ok'); process.exit(0);
