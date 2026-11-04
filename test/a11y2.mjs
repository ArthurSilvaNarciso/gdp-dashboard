import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const AXE = readFileSync(process.env.AXE || '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/axe/node_modules/axe-core/axe.min.js', 'utf8');
const srv = await start(3969); const b = await chromium.launch(); const all = {};
for (const dark of [false, true]) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' }); const p = await c.newPage();
  await p.goto('http://localhost:3969/'); await p.waitForFunction(() => window.API && API.on); await p.waitForTimeout(300);
  const run = async (name) => { await p.waitForTimeout(450); await p.addScriptTag({ content: AXE }).catch(() => {}); const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => ({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.any[0] && x.any[0].message || '').slice(0, 110)) }))); for (const v of r) all[(dark ? 'D ' : 'L ') + name + ' ' + v.id] = v; };
  await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForSelector('[data-act=diag-start]'); await run('diag-offer');
  await p.click('[data-act=diag-skip]'); await p.waitForTimeout(400); await p.keyboard.press('Escape');
  await p.evaluate(() => { const ce = deckById('dconst').questions.find((q) => q.type === 'ce'); startCycle({ ids: [ce.id], size: 1, title: 'CE' }); }); await p.click('[data-act=reveal]'); await run('ce');
  await p.click('.opt >> nth=0'); await p.click('[data-act=conf][data-c=acho]'); await p.click('[data-act=report-open]'); await run('report');
  await p.keyboard.press('Escape'); await p.evaluate(() => ACT.end());
  await p.evaluate(() => { ui.tab = 'perfil'; render(); }); await p.click('.promo [data-act=auth-open][data-m=signup]'); await run('signup');
  await p.fill('#au-email', 'x' + (dark ? 'd' : 'l') + '@x.com'); await p.fill('#au-pass', 'senha-forte-123'); await p.check('#au-terms'); await p.click('.sheet button[type=submit]'); await p.waitForTimeout(1500);
  await p.evaluate(() => { ui.tab = 'home'; render(); }); await p.waitForTimeout(1000); await run('home-logged');
  await p.evaluate(() => { ui.tab = 'liga'; render(); }); await p.waitForTimeout(1200); await run('liga');
  await p.click('[data-act=league-tab][data-t=amigos]'); await run('amigos');
  await p.evaluate(() => ACT.legal({ doc: 'termos' })); await run('termos');
  await p.keyboard.press('Escape'); await p.evaluate(() => { ui.tab = 'perfil'; render(); }); await p.click('[data-act=push-open]'); await run('push');
  await c.close();
}
for (const [k, v] of Object.entries(all)) console.log(k, v.n, '\n   ' + v.ex.join('\n   '));
console.log(Object.keys(all).length, 'violações'); await b.close(); srv.close(); process.exit(0);
