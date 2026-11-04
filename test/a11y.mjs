import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const AXE = readFileSync(process.env.AXE || '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/axe/node_modules/axe-core/axe.min.js', 'utf8');
const srv = await start(3964); const b = await chromium.launch();
const all = {};
for (const dark of [false, true]) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' }); const p = await c.newPage();
  await p.goto('http://localhost:3964/'); await p.waitForTimeout(500);
  const run = async (name) => { await p.waitForTimeout(400); await p.addScriptTag({ content: AXE }).catch(() => {}); const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => ({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.any[0] && x.any[0].message || '').slice(0, 110)) }))); for (const v of r) { const k = (dark ? 'D ' : 'L ') + name + ' ' + v.id; all[k] = v; } };
  await run('onb0');
  await p.click('[data-act=onb-next]'); await p.fill('#onb-name', 'Ruth'); await p.click('[data-act=persona][data-id=concurso]'); await run('onb1');
  await p.click('[data-act=onb-next]'); await p.click('[data-act=onb-finish]'); await p.waitForTimeout(500); await run('exam'); await p.keyboard.press('Escape');
  await run('home');
  await p.evaluate(() => { const now = Date.now(); deckById('port').questions.slice(0, 6).forEach((q, i) => { S.cards[q.id] = { n: 2, ok: 1, lapses: 1, s: 2, d: 5, last: now - 3 * 864e5, g: i % 2 ? 2 : 1, due: now }; }); [5, 9, 0, 12].forEach((n, i) => { S.log[dayKey(new Date(now - i * 864e5))] = Object.assign(LOG0(), { n, ok: n - 1 }); }); persist(); });
  for (const t of ['trilhas', 'progresso', 'perfil']) { await p.click(`[data-tab=${t}]`); await run(t); }
  await p.evaluate(() => { ui.tab = 'avatar'; render(); }); await run('avatar');
  await p.evaluate(() => { ui.tab = 'trilhas'; ui.deck = 'port'; render(); }); await run('deck');
  await p.evaluate(() => ACT['cycle-deck']({ id: 'port' })); await run('q-desafio'); await p.click('[data-act=reveal]'); await run('q-esforco');
  await p.click('.opt >> nth=0'); await p.click('[data-act=conf][data-c=certeza]'); await run('q-feedback');
  await c.close();
}
for (const [k, v] of Object.entries(all)) console.log(k, v.n, '\n   ' + v.ex.join('\n   '));
console.log(Object.keys(all).length, 'violações');
await b.close(); srv.close(); process.exit(0);
