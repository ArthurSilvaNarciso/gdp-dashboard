// Recursos de estudo: errou → revisar na aula; ouvir aulas em sequência; revisão de véspera.
import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const srv = await start(3965); const b = await chromium.launch(); let fail = 0;
const ok = (n, c) => { console.log((c ? 'OK   ' : 'FAIL ') + n); if (!c) fail++; };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); const p = await c.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:3965/'); await p.waitForSelector('#view [data-act]');
await p.evaluate(() => { S.user.onboarded = true; S.user.name = 'Teste'; S.user.termsAt = Date.now(); persist(); });
// 1) Errar uma questão que está numa aula
const qid = await p.evaluate(async () => { await loadBodies(); return 'dpen1'; });
await p.evaluate((id) => startCycle({ ids: [id], size: 1, title: 'T' }), qid);
await p.waitForFunction(() => ui.session && ui.session.queue.length === 1); await p.waitForTimeout(600);
await p.evaluate(() => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; const wrong = s.order.find((oi) => oi !== q.a); s.pick = wrong; ACT.conf({ c: 'acho' }); });
await p.waitForTimeout(200); await p.evaluate(() => ACT.consol()); await p.waitForTimeout(800);
ok('mostra “Revisar na aula” depois do erro', await p.evaluate(() => !!document.querySelector('[data-act=aula-peek]')));
await p.click('[data-act=aula-peek]'); await p.waitForTimeout(300);
ok('abre a aula por cima da questão', await p.evaluate(() => !!document.querySelector('.aula-sheet h2') && !!ui.session));
await p.click('.aula-sheet [data-act=sheet-close]'); await p.waitForTimeout(400);
ok('volta para a questão', await p.evaluate(() => !document.querySelector('.aula-sheet') && ui.session && ui.session.phase === 'consol'));
await p.evaluate(() => { ui.session = null; ui.tab = 'trilhas'; ui.deck = 'dpen'; render(); }); await p.waitForTimeout(800);
ok('botão de ouvir aulas em sequência na trilha', await p.evaluate(() => !!document.querySelector('[data-act=aula-seq]')));
// 3) Revisão de véspera: prova em 2 dias e cartões vistos
await p.evaluate(() => { const d = new Date(Date.now() + 2 * 864e5); S.user.exam = { name: 'TRT', date: d.toISOString().slice(0, 10) }; S.user.persona = 'concurso'; const ids = BUILTIN_DECKS.find((x) => x.id === 'port').questions.slice(0, 12).map((q) => q.id); ids.forEach((id, k) => schedule(id, k % 3 ? 3 : 1)); persist(); ui.tab = 'home'; render(); });
await p.waitForTimeout(300);
ok('card de revisão de véspera aparece', await p.evaluate(() => !!document.querySelector('[data-act=vespera]')));
await p.click('[data-act=vespera]'); await p.waitForFunction(() => ui.session && ui.session.queue.length > 0, null, { timeout: 8000 });
ok('véspera começa pelos mais esquecidos', await p.evaluate(() => { const s = ui.session; return s.title === 'Revisão de véspera' && s.queue.length >= 5; }));
// 4) Radar de lei: selo de revisão na trilha e aviso quando a norma mudou depois da revisão
await p.evaluate(() => { ui.session = null; ui.tab = 'trilhas'; ui.deck = 'dpen'; render(); }); await p.waitForTimeout(900);
ok('selo “Revisada em” na trilha', await p.evaluate(() => /Revisada em nov\/2026/.test((document.querySelector('.review-badge') || {}).textContent || '')));
await p.evaluate(() => { RADAR.flags = { 'DL2848/1940': { n: 'Código Penal', mudancas: [{ norma: 'Lei 99.999/2099', data: '2099-01-01', resumo: 'mudou o furto' }] } }; render(); }); await p.waitForTimeout(200);
const badge = await p.evaluate(() => [ui.tab, ui.deck, (document.querySelector('.review-badge') || {}).outerHTML || 'none'].join(' | ').slice(0, 300)); ok('selo vira alerta quando a norma muda depois da revisão', /review-badge warn/.test(badge) && /mudou/.test(badge)); if (!/warn/.test(badge)) console.log(badge);
const qcp = await p.evaluate(() => Object.keys(RADAR.ix.q).find((id) => id.startsWith('dpen') && RADAR.ix.q[id].includes('DL2848/1940')));
await p.evaluate((id) => startCycle({ ids: [id], size: 1, title: 'R' }), qcp); await p.waitForFunction(() => ui.session && ui.session.queue.length === 1);
await p.evaluate(() => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; s.pick = q.a; ACT.conf({ c: 'certeza' }); }); await p.waitForTimeout(150); await p.evaluate(() => ACT.consol()); await p.waitForTimeout(300);
ok('questão afetada mostra o aviso de lei alterada', await p.evaluate(() => /mudou em 01\/01\/2099/.test((document.querySelector('.law-alert') || {}).textContent || '')));
ok('sem erros na página', errs.length === 0); if (errs.length) console.log(errs.join('\n'));
await b.close(); srv.close(); console.log(fail ? fail + ' falha(s)' : 'tudo certo'); process.exit(fail ? 1 : 0);
