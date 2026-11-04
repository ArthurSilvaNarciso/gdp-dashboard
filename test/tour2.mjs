import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/tour/';
const srv = await start(3963); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3963/'); await p.waitForTimeout(600);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForTimeout(600); await p.keyboard.press('Escape');
await p.click('.ps.cur .ps-btn'); await p.waitForTimeout(300);
for (let k = 0; k < 120; k++) {
  const st = await p.evaluate(() => ui.session && ui.session.phase); if (!st || st === 'summary') break;
  if (st === 'desafio') await p.click('[data-act=reveal]');
  else if (st === 'esforco') { const wi = await p.evaluate((kk) => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; return s.order.findIndex((o) => (kk % 4 ? o === q.a : o !== q.a)); }, k); await p.click(`.opt >> nth=${wi}`); await p.click('[data-act=conf][data-c=certeza]'); }
  else if (st === 'feedback') await p.click('.dock [data-act=consol]');
  else if (st === 'consol') await p.click('.dock [data-act=next]');
  await p.waitForTimeout(30);
}
await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'sum-sheet.png' });
if (await p.locator('.scrim').count()) { await p.click('.sheet [data-act=sheet-close]'); await p.waitForTimeout(300); }
await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'sum.png', fullPage: true });
console.log(await p.evaluate(() => ui.session && ui.session.phase), errs.join('\n') || 'sem erros');
await p.setViewportSize({ width: 1366, height: 860 }); await p.evaluate(() => { ui.session = null; ui.tab = 'home'; render(); }); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'desk-home.png' });
await b.close(); srv.close(); process.exit(0);
