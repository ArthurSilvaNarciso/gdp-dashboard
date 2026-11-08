// Edital verticalizado: plano de concurso, mapa por tópico, ponto fraco, data da prova e cronograma.
import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = process.env.SHOTS || '';
const srv = await start(3964); const b = await chromium.launch(); let fail = 0;
const ok = (n, c) => { console.log((c ? 'OK   ' : 'FAIL ') + n); if (!c) fail++; };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3964/'); await p.waitForSelector('#view [data-act]');
await p.evaluate(() => { S.user.onboarded = true; S.user.name = 'Teste'; S.user.termsAt = Date.now(); persist(); });
await p.evaluate(() => loadConcursos()); await p.waitForFunction(() => CC.list && CC.list.length > 0);
const cid = await p.evaluate(() => { const best = CC.list.map((c) => ({ c, n: c.disciplinas.filter((x) => subjectDeck(x.nome, x.topicos)).length })).sort((a, b) => b.n - a.n)[0]; const c = { ...best.c, prova: null }; planCreate(c); ui.tab = 'plano'; render(); return c.id; });
await p.waitForTimeout(800);
ok('plano criado e aberto', await p.evaluate(() => ui.tab === 'plano' && !!S.user.plan));
ok('mostra o mapa do edital', await p.evaluate(() => /Mapa do edital/.test(document.body.innerText) && document.querySelectorAll('.ed-subj').length > 0));
ok('pede a data da prova', await p.evaluate(() => !!document.querySelector('[data-act=ed-date]')));
await p.waitForTimeout(800); const linked = await p.evaluate(() => { const E = edital(); return E.reduce((a, s) => a + s.topics.filter((t) => t.ids.length).length, 0); });
ok('tópicos do edital ligados a questões (' + linked + ')', linked > 0);
if (OUT) await p.screenshot({ path: OUT + 'ed-1.png', fullPage: true });
// Abre a primeira matéria com trilha e marca um tópico como estudado
const i = await p.evaluate(() => edital().find((s) => s.d).i);
await p.click(`[data-act=ed-open][data-i="${i}"]`); await p.waitForTimeout(200);
ok('abre os tópicos da matéria', await p.evaluate(() => document.querySelectorAll('.ed-t').length > 0));
await p.click('.ed-chk'); await p.waitForTimeout(150);
ok('marca tópico como estudado', await p.evaluate(() => Object.keys(S.user.plan.done || {}).length === 1 && document.querySelector('.ed-chk').getAttribute('aria-checked') === 'true'));
if (OUT) await p.screenshot({ path: OUT + 'ed-2.png', fullPage: true });
// Define a data da prova
await p.click('[data-act=ed-date]'); await p.waitForSelector('#ed-dt');
const dt = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
await p.fill('#ed-dt', dt); await p.click('[data-act=ed-date-ok]'); await p.waitForTimeout(300);
ok('data salva no plano e na prova', await p.evaluate((d) => S.user.plan.prova === d && S.user.exam.date === d, dt));
ok('mostra a semana com 7 dias', await p.evaluate(() => document.querySelectorAll('.ed-day').length === 7));
// Erra várias questões de um tópico para virar o ponto fraco
const weakT = await p.evaluate(() => { const E = edital(); const s = E.find((x) => x.topics.some((t) => t.ids.length >= 2)); const t = s.topics.find((t) => t.ids.length >= 2); t.ids.forEach((id) => schedule(id, 1)); persist(); rerender(); return t.t; });
await p.waitForTimeout(200);
ok('ponto fraco aponta o tópico errado (' + weakT + ')', await p.evaluate((t) => { const w = edWeakest(edital()); return w && w.t && w.t.t === t; }, weakT));
await p.click('[data-act=ed-weak]'); await p.waitForFunction(() => ui.session && ui.session.queue && ui.session.queue.length > 0, null, { timeout: 8000 });
ok('ataca o ponto fraco num ciclo', await p.evaluate(() => ui.tab === 'cycle' || !!ui.session));
await p.evaluate(() => { ui.session = null; ui.tab = 'plano'; render(); });
await p.click('[data-act=ed-today]'); await p.waitForFunction(() => ui.session && ui.session.queue && ui.session.queue.length > 0, null, { timeout: 8000 });
ok('“Fazer o de hoje” abre o ciclo do dia', await p.evaluate(() => ui.session.title === 'Plano de hoje'));
ok('sem erros na página', errs.length === 0); if (errs.length) console.log(errs.join('\n'));
await b.close(); srv.close(); console.log(fail ? fail + ' falha(s)' : 'tudo certo'); process.exit(fail ? 1 : 0);
