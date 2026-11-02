import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const SHOT = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/';
const srv = await start(3941); const b = await chromium.launch();
const mk = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await c.newPage(); await p.goto('http://localhost:3941/'); await p.waitForTimeout(700); return p; };
const wait = (p) => p.waitForTimeout(1100);
const P = await mk();
await P.click('[data-act=onb-next]'); await P.fill('#onb-name', 'Rita'); await P.click('[data-act=persona][data-id=faculdade]'); await P.click('[data-act=onb-next]'); await P.click('[data-act=onb-finish]');
await P.click('[data-tab=perfil]'); await wait(P); await P.screenshot({ path: SHOT + 'f1-perfil-promo.png' });
await P.click('.promo [data-act=auth-open][data-m=signup]'); await P.fill('#au-email', 'rita@escola.com'); await P.fill('#au-pass', 'professora-2026'); await P.click('.sheet button[type=submit]');
await P.waitForFunction(() => API.user && API.sync === 'saved'); await wait(P); await P.screenshot({ path: SHOT + 'f2-perfil-conta.png' });
await P.click('.list [data-act=tab][data-tab=conta]'); await wait(P); await P.screenshot({ path: SHOT + 'f3-conta.png' });
await P.click('[data-act=tab][data-tab=turmas]'); await wait(P); await P.screenshot({ path: SHOT + 'f4-turmas.png' });
await P.fill('#cls-name', '3º B · Biologia'); await P.click('[data-act=cls-create]'); await P.waitForSelector('.cls-hero .codebox'); await wait(P);
await P.click('[data-act=cls-add-deck]'); await P.waitForTimeout(500); await P.screenshot({ path: SHOT + 'f5-add.png' });
await P.click('.sheet [data-act=cls-add][data-id=neuro]'); await P.waitForTimeout(600);
const code = await P.evaluate(() => API.cls.joinCode);
for (const [n, e, right] of [['Gabriel Souza', 'gabi@x.com', 5], ['Larissa Melo', 'lari@x.com', 3], ['Pedro Alves', 'pedro@x.com', 1]]) {
  const S2 = await mk();
  await S2.goto('http://localhost:3941/?turma=' + code); await S2.waitForTimeout(800);
  await S2.fill('#au-name', n); await S2.fill('#au-email', e); await S2.fill('#au-pass', 'aluno-forte-2026'); await S2.click('.sheet button[type=submit]');
  await S2.waitForFunction(() => API.user && API.classes.length === 1);
  await S2.evaluate(async (r) => { S.user.onboarded = true; S.user.name = 'x'; const now = Date.now(); BUILTIN_DECKS[0].questions.forEach((q, i) => { if (i < 6) S.cards[q.id] = { n: 2, ok: i < r ? 2 : 0, lapses: i < r ? 0 : 1, s: i < r ? 12 : 0.5, d: 5, last: now - i * 3600e3, g: i < r ? 4 : 1, due: now + 9e8 }; }); const k = dayKey(); S.log[k] = { n: 12, ok: r * 2, cert: r, fixed: 0, rev: 0, cycles: 2, tutor: 0, mx: {} }; S.streak = { count: r + 1, last: k }; S.traps = { generalizacao: 6 - r, troca: 2 }; persist(); clearTimeout(API.timer); await pushServer(); }, right);
  if (n === 'Larissa Melo') { await S2.evaluate(() => { render(); }); await S2.click('[data-tab=perfil]'); await S2.click('.list [data-act=tab][data-tab=turmas]'); await S2.click('[data-act=cls-open]'); await S2.waitForSelector('.rank'); await wait(S2); await S2.screenshot({ path: SHOT + 'f8-aluno.png' }); }
}
await P.click('[data-act=cls-refresh]'); await P.waitForSelector('.member'); await wait(P); await P.screenshot({ path: SHOT + 'f6-painel.png' });
const gid = await P.evaluate(() => API.cls.students[0].id); await P.click(`[data-act=cls-member][data-id="${gid}"]`); await P.waitForTimeout(400);
await P.evaluate(() => { document.querySelector('.member').scrollIntoView({ block: 'start' }); }); await P.waitForTimeout(300); await P.screenshot({ path: SHOT + 'f7-aluno-det.png' });
await b.close(); srv.close(); process.exit(0);
