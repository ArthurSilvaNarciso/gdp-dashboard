import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/l3-';
const srv = await start(3953); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3953/'); await p.waitForTimeout(700);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]');
await p.click('[data-tab=trilhas]'); await p.fill('#deck-q', 'zzzz'); await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'search.png' });
await p.click('[data-tab=perfil]'); await p.click('.promo [data-act=auth-open][data-m=signup]'); await p.waitForTimeout(700); await p.screenshot({ path: OUT + 'signup.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.evaluate(() => { ui.tab = 'turmas'; render(); }); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'turmas.png' });
await p.evaluate(() => { ui.tab = 'home'; render(); startCycle({ decks: ['neuro'], size: 3, title: 'Sessão' }); });
for (let k = 0; k < 40; k++) { const st = await p.evaluate(() => ui.session && ui.session.phase); if (!st || st === 'summary') break;
  if (st === 'desafio') await p.click('[data-act=reveal]'); else if (st === 'esforco') { const wi = await p.evaluate(() => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; return s.order.findIndex((o) => o === q.a); }); await p.click(`.opt >> nth=${wi}`); await p.click('[data-act=conf][data-c=certeza]'); }
  else if (st === 'feedback') await p.click('.dock [data-act=consol]'); else if (st === 'consol') await p.click('.dock [data-act=next]'); await p.waitForTimeout(30); }
await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'summary.png' });
console.log(errs.join('\n') || 'sem erros');
await b.close(); srv.close(); process.exit(0);
