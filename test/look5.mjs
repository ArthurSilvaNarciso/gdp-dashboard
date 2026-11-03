import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/l5-';
const srv = await start(3955); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3955/'); await p.waitForTimeout(600);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth Narciso'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]');
await p.click('[data-tab=perfil]'); await p.click('.phead [data-act=av-open]'); await p.waitForTimeout(700);
for (const g of ['rosto', 'cabelo', 'roupa', 'cabeca', 'oculos', 'extras', 'fundo']) { await p.click(`[data-act=av-grp][data-k=${g}]`); await p.waitForTimeout(350); await p.screenshot({ path: OUT + g + '.png' }); }
await p.click('[data-act=av-grp][data-k=cabelo]'); await p.evaluate(() => { document.getElementById('view').scrollTop = 600; }); await p.waitForTimeout(300); await p.screenshot({ path: OUT + 'scroll.png' });
const t0 = Date.now(); for (let i = 0; i < 10; i++) await p.click('[data-act=av-random]'); console.log('10 sorteios em', Date.now() - t0, 'ms');
const grid = await p.evaluate(() => { let h = ''; for (let i = 0; i < 30; i++) { const o = AV_OPTS; const cfg = avNormalize({ skin: i % 12, hair: o.hair[i % o.hair.length], hc: (i * 5) % 16, eyes: o.eyes[i % o.eyes.length], brows: o.brows[i % 5], mouth: o.mouth[i % o.mouth.length], face: o.face[i % 5], beard: i % 6 === 0 ? 'cheia' : i % 7 === 0 ? 'cavanhaque' : 'nenhuma', hat: o.hat[(i * 7) % o.hat.length], hatc: (i * 3) % 16, glasses: o.glasses[(i * 5) % o.glasses.length], gc: i % 10, acc: o.acc[(i * 3) % o.acc.length], top: o.top[i % o.top.length], tc: (i * 7) % 16, bg: i % 16, bgp: o.bgp[i % 7], blush: true }); h += `<div style="width:124px;height:124px;display:inline-block;margin:3px">${avatarSVG(cfg)}</div>`; } return h; });
await p.setContent(`<html><body style="margin:0;background:#fff;width:780px">${grid}</body></html>`); await p.screenshot({ path: OUT + 'grid.png', fullPage: true });
console.log(errs.join('\n') || 'sem erros');
await b.close(); srv.close(); process.exit(0);
