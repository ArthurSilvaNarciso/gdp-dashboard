import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/l7-';
const srv = await start(3957); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3957/'); await p.waitForTimeout(600);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=goal][data-n="5"]'); await p.click('[data-act=onb-finish]');
await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'exam.png' });
await p.fill('#ex-name', 'Concurso TRT'); const d = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10); await p.fill('#ex-date', d); await p.click('form[data-form=exam] [type=submit]'); await p.waitForTimeout(900);
await p.screenshot({ path: OUT + 'home.png' });
async function play(right) { for (let k = 0; k < 80; k++) { const st = await p.evaluate(() => ui.session && ui.session.phase); if (!st || st === 'summary') break;
  if (st === 'desafio') await p.click('[data-act=reveal]'); else if (st === 'esforco') { const wi = await p.evaluate((r) => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; return s.order.findIndex((o) => (r ? o === q.a : o !== q.a)); }, right); await p.click(`.opt >> nth=${wi}`); await p.click('[data-act=conf][data-c=certeza]'); }
  else if (st === 'feedback') { if (await p.locator('.combo').count() && !play.shot) { play.shot = 1; await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'combo.png' }); } await p.click('.dock [data-act=consol]'); } else if (st === 'consol') await p.click('.dock [data-act=next]'); await p.waitForTimeout(30); } }
await p.evaluate(() => startCycle({ decks: ['neuro'], size: 5, title: 'Sessão' })); await play(true);
await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'streak.png' });
await p.click('.sheet [data-act=sheet-close]'); await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'summary.png' });
await p.click('[data-act=end]'); await p.waitForTimeout(700); await p.evaluate(() => document.getElementById('view').scrollTo(0, 0)); await p.screenshot({ path: OUT + 'home2.png' });
await p.click('[data-act=chest-open]'); await p.waitForTimeout(1200); await p.screenshot({ path: OUT + 'chest.png' });
await p.click('[data-act=chest-close]'); await p.waitForTimeout(500);
await p.click('[data-tab=perfil]'); await p.click('.phead [data-act=av-open]'); await p.click('[data-act=av-grp][data-k=oculos]'); await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'shop.png' });
await p.click('[data-act=av-set][data-k=glasses][data-v=aviador]'); await p.click('[data-act=av-grp][data-k=cabeca]'); await p.click('[data-act=av-set][data-k=hat][data-v=fedora]'); await p.click('[data-act=av-try-save]'); await p.waitForTimeout(600); await p.screenshot({ path: OUT + 'buy.png' });
console.log('saldo', await p.evaluate(() => coinsBal()), errs.join('\n') || 'sem erros');
await b.close(); srv.close(); process.exit(0);
