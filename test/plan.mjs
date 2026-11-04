import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/tour/plan-';
const srv = await start(3962); const b = await chromium.launch();
for (const dark of [false, true]) {
const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light' }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3962/'); await p.waitForTimeout(600);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForTimeout(600); await p.keyboard.press('Escape');
await p.waitForTimeout(500); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'new.png' });
await p.evaluate(() => { const now = Date.now(); const d = deckById('port'); d.questions.slice(0, 7).forEach((q, i) => { S.cards[q.id] = { n: 2, ok: 1, lapses: 0, s: 3, d: 5, last: now - 2 * 864e5, g: 3, due: now - 1e6 }; }); const L = todayLog(); L.n = 7; L.units = 1; persist(); render(); });
await p.waitForTimeout(500); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'mid.png' });
await p.evaluate(() => { for (const id in S.cards) S.cards[id].due = Date.now() + 9e8; const L = todayLog(); L.n = 12; L.rev = 7; persist(); render(); });
await p.waitForTimeout(400); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'ready.png' });
await p.click('.ps [data-act=chest-open]'); await p.waitForTimeout(500); await p.click('[data-act=chest-close]'); await p.waitForTimeout(500); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'all.png' });
console.log(dark, errs.join('\n') || 'sem erros'); await c.close();
}
await b.close(); srv.close(); process.exit(0);
