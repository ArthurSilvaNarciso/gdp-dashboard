import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const AXE = readFileSync(process.env.AXE || '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/axe/node_modules/axe-core/axe.min.js', 'utf8');
const srv = await start(3977); const b = await chromium.launch(); const all = {};
for (const dark of [false, true]) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' }); const p = await c.newPage();
  await p.goto('http://localhost:3977/'); await p.waitForTimeout(400);
  const run = async (name) => { await p.waitForTimeout(500); await p.addScriptTag({ content: AXE }).catch(() => {}); const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => ({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.any[0] && x.any[0].message || '').slice(0, 110)) }))); for (const v of r) all[(dark ? 'D ' : 'L ') + name + ' ' + v.id] = v; };
  await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForSelector('[data-act=diag-skip]'); await p.click('[data-act=diag-skip]'); await p.waitForTimeout(400); await p.keyboard.press('Escape');
  await run('home'); await p.click('[data-tab=concursos]'); await p.waitForSelector('.cc-card'); await run('concursos');
  await p.click('.cc-card >> nth=0'); await run('concurso'); await p.click('[data-act=cc-study]'); await run('plano');
  await p.evaluate(() => ACT['open-deck']({ id: 'neuro' })); await p.waitForSelector('.lesson-it'); await run('deck-aulas');
  await p.click('.lesson-it >> nth=0'); await run('aula');
  await p.evaluate(() => { ui.tab = 'progresso'; render(); }); await run('progresso-medalhas');
  await c.close();
}
for (const [k, v] of Object.entries(all)) console.log(k, v.n, '\n   ' + v.ex.join('\n   '));
console.log(Object.keys(all).length, 'violações'); await b.close(); srv.close(); process.exit(0);
