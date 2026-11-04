// Gera capturas para o manifesto (instalação) e para a loja: node dev/store-shots.mjs
import { createRequire } from 'node:module';
import { start } from './server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const srv = await start(3968); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.77 }); const p = await c.newPage();
await p.goto('http://localhost:3968/'); await p.waitForTimeout(600);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ana'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForTimeout(600); await p.keyboard.press('Escape');
await p.evaluate(() => { const now = Date.now(); ['neuro', 'port', 'dconst'].forEach((id) => deckById(id).questions.slice(0, 9).forEach((q, i) => { S.cards[q.id] = { n: 3, ok: 2, lapses: 0, s: 4 + i * 3, d: 5, last: now - (i % 3) * 864e5, g: 3 + (i % 2), due: now + (i % 4 ? 9e8 : -1e5) }; }));
  [12, 10, 6, 14, 10, 8, 11].forEach((n, i) => { S.log[dayKey(new Date(now - i * 864e5))] = Object.assign(LOG0(), { n, ok: n - 2 }); }); S.streak = { count: 9, last: dayKey() }; S.xp = 980; S.coins = { earned: 140, spent: 20 }; persist(); render(); });
await p.waitForTimeout(700); await p.screenshot({ path: 'img/shots/1-inicio.png' });
await p.evaluate(() => startCycle({ decks: ['port'], size: 10, title: 'Sessão' })); await p.click('[data-act=reveal]'); await p.waitForTimeout(500); await p.screenshot({ path: 'img/shots/2-questao.png' });
await p.evaluate(() => { ACT.end(); ui.tab = 'progresso'; render(); }); await p.waitForTimeout(700); await p.screenshot({ path: 'img/shots/3-progresso.png' });
await b.close(); srv.close(); process.exit(0);
