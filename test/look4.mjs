import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/' + (process.argv[2] === 'dark' ? 'd4-' : 'l4-');
const dark = process.argv[2] === 'dark';
const srv = await start(3954); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: dark ? 'dark' : 'light' }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3954/'); await p.waitForTimeout(700);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth Narciso'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]');
await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'home.png' });
await p.click('[data-tab=perfil]'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'perfil.png' });
await p.click('.phead [data-act=av-open]'); await p.waitForTimeout(800); await p.screenshot({ path: OUT + 'ed-skin.png' });
for (const [k, n] of [['hair', 'ed-hair'], ['eyes', 'ed-eyes'], ['top', 'ed-top'], ['acc', 'ed-acc']]) { await p.click(`[data-act=av-cat][data-k=${k}]`); await p.waitForTimeout(400); await p.screenshot({ path: OUT + n + '.png' }); }
await p.click('[data-act=av-set][data-k=acc][data-v=fone]'); await p.click('[data-act=av-cat][data-k=hair]'); await p.click('[data-act=av-set][data-k=hair][data-v=cacheado]');
await p.click('[data-act=av-cat][data-k=tc]'); await p.click('[data-act=av-set][data-k=tc][data-v="1"]'); await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'ed-done.png' });
await p.click('[data-act=av-save]'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'perfil2.png' });
// grade de aleatórios
const grid = await p.evaluate(() => { let h = ''; for (let i = 0; i < 24; i++) { ACT['av-random'] ? 0 : 0; const r = (n) => Math.floor(Math.random() * n); const o = AV_OPTS; const cfg = avNormalize({ skin: i % 8, hair: o.hair[i % o.hair.length], hc: r(7), eyes: o.eyes[i % 6], brows: o.brows[i % 3], mouth: o.mouth[i % 6], beard: i % 5 === 0 ? 'cheia' : i % 7 === 0 ? 'bigode' : 'nenhuma', glasses: o.glasses[i % 4], acc: o.acc[i % 6], top: o.top[i % 6], tc: i % 10, bg: i % 8, blush: true }); h += `<div style="width:120px;height:120px;display:inline-block;margin:4px">${avatarSVG(cfg)}</div>`; } return h; });
await p.setContent(`<html><body style="margin:0;background:#fff;width:780px">${grid}</body></html>`); await p.screenshot({ path: OUT + 'grid.png', fullPage: true });
console.log(errs.join('\n') || 'sem erros');
await b.close(); srv.close(); process.exit(0);
