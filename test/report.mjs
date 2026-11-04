import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/tour/rep-';
const srv = await start(3965); const b = await chromium.launch();
for (const dark of [false, true]) {
const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light' }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts/.test(m.text())) errs.push(m.text()); });
await p.goto('http://localhost:3965/'); await p.waitForTimeout(600);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth Narciso'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForTimeout(600); await p.keyboard.press('Escape');
await p.evaluate(() => { const now = Date.now(); const gs = [4, 1, 2, 3, 4, 2, 1, 4, 3, 2]; ['port', 'neuro', 'dconst'].forEach((id, k) => deckById(id).questions.slice(0, 8).forEach((q, i) => { S.cards[q.id] = { n: 2, ok: 1, lapses: gs[i] === 1 ? 1 : 0, s: 1 + i * 2, d: 5, last: now - (i % 4) * 864e5, g: gs[(i + k) % 10], due: now + 864e5 }; }));
  const ns = [12, 0, 7, 10, 15, 4, 9, 3, 5, 0, 6, 8, 2, 4]; ns.forEach((n, i) => { const d = new Date(now - i * 864e5); S.log[dayKey(d)] = Object.assign(LOG0(), { n, ok: Math.round(n * .78) }); });
  S.streak = { count: 6, last: dayKey() }; persist(); ui.tab = 'progresso'; render(); });
await p.waitForTimeout(600); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'top.png' });
await p.evaluate(() => document.querySelector('.card.weak').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'weak.png' });
await p.click('[data-act=share-week]'); await p.waitForSelector('.share-prev img', { timeout: 8000 }); await p.waitForTimeout(500); await p.screenshot({ path: OUT + (dark ? 'd-' : '') + 'share.png' });
if (!dark) { const data = await p.evaluate(async () => { const bl = await weekCardPNG(); const r = new FileReader(); return await new Promise((res) => { r.onload = () => res(r.result); r.readAsDataURL(bl); }); }); writeFileSync(OUT + 'card.png', Buffer.from(data.split(',')[1], 'base64')); }
await p.click('.sheet [data-act=sheet-close]'); await p.click('[data-act=weak-train]'); await p.waitForTimeout(300);
console.log(dark, await p.evaluate(() => ui.session && ui.session.title + ' ' + ui.session.queue.length), errs.join('\n') || 'sem erros'); await c.close();
}
await b.close(); srv.close(); process.exit(0);
