import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/tour/t3-';
const srv = await start(3967); const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const shot = async (n) => { await p.waitForTimeout(450); await p.screenshot({ path: OUT + n + '.png' }); };
await p.goto('http://localhost:3967/'); await p.waitForFunction(() => window.API && API.on); await p.waitForTimeout(400);
await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]');
await p.waitForSelector('[data-act=diag-start]'); await shot('01-diag-offer');
await p.click('[data-act=diag-start]');
for (let k = 0; k < 60; k++) {
  const st = await p.evaluate(() => ui.session && ui.session.phase); if (!st || st === 'summary') break;
  if (st === 'desafio') await p.click('[data-act=reveal]');
  else if (st === 'esforco') { const wi = await p.evaluate((kk) => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; return s.order.findIndex((o) => (kk % 3 ? o === q.a : o !== q.a)); }, k); await p.click(`.opt >> nth=${wi}`); await p.click('[data-act=conf][data-c=acho]'); }
  else if (st === 'feedback') { if (k === 5) await shot('02-feedback-report'); await p.click('.dock [data-act=consol]'); }
  else if (st === 'consol') await p.click('.dock [data-act=next]');
  await p.waitForTimeout(40);
}
await p.waitForTimeout(800); if (await p.locator('.scrim').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
await shot('03-diag-result');
await p.click('[data-act=diag-go]'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.evaluate(() => { ui.deck = 'dconst'; render(); });
await p.evaluate(() => document.querySelector('.ce-btn') && document.querySelector('.ce-btn').scrollIntoView({ block: 'center' })); await shot('04-deck-ce');
// conta + liga
await p.evaluate(() => { ui.tab = 'perfil'; ui.deck = null; render(); }); await p.click('.promo [data-act=auth-open][data-m=signup]'); await p.fill('#au-email', 'ruth@x.com'); await p.fill('#au-pass', 'senha-forte-123'); await p.check('#au-terms'); await shot('05-signup');
await p.click('.sheet button[type=submit]'); await p.waitForTimeout(1500);
await p.evaluate(() => { ui.tab = 'home'; render(); }); await p.waitForTimeout(1200); await p.evaluate(() => document.querySelector('.league-card') && document.querySelector('.league-card').scrollIntoView({ block: 'center' })); await shot('06-home-league');
await p.evaluate(() => { ui.tab = 'liga'; render(); }); await p.waitForTimeout(1200); await shot('07-liga');
await p.click('[data-act=league-tab][data-t=amigos]'); await shot('08-amigos');
await p.evaluate(() => ACT.legal({ doc: 'privacidade' })); await shot('09-privacidade');
await p.keyboard.press('Escape'); await p.evaluate(() => { ui.tab = 'perfil'; render(); }); await p.click('[data-act=push-open]'); await shot('10-push');
console.log(errs.join('\n') || 'sem erros'); await b.close(); srv.close(); process.exit(0);
