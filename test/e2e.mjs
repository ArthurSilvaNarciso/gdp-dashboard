// Teste de ponta a ponta: app + API + Postgres (PGlite), vários aparelhos (contextos de navegador).
import { createRequire } from 'node:module';
import { start } from '../dev/server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const SHOT = process.env.SHOT || '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/';
globalThis.__MEMORY_FAKE_AI = async ({ messages, system }) => {
  const prompt = messages[messages.length - 1].content;
  const q = (i) => ({ topic: 'Material', c: 'Caso ' + i + ': uma equipe aplica a regra no dia a dia.', q: 'Qual alternativa está de acordo com o material?', a: i % 4, src: 'p. ' + (i + 1), o: [0, 1, 2, 3].map((j) => ({ t: j === i % 4 ? 'A alternativa correta ' + i : 'Alternativa plausível ' + j, p: j === i % 4 ? 'correta' : ['troca', 'inversao', 'generalizacao', 'restricao'][j], w: 'Explicação ' + j })) });
  const n = prompt.includes('Crie 3 novas') ? 3 : (prompt.match(/crie (\d+) questões/) || [0, 5])[1] * 1;
  const text = prompt.includes('array JSON') ? JSON.stringify(Array.from({ length: n }, (_, i) => q(i))) : 'Pense assim: **a regra vale com exceções**. Por isso a alternativa marcada exagera.';
  const chunks = text.match(/.{1,12}/gs).map((t) => `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: t } })}\n\n`);
  return new Response(new ReadableStream({ async start(c) { for (const ch of chunks) { c.enqueue(new TextEncoder().encode(ch)); await new Promise((r) => setTimeout(r, 2)); } c.close(); } }), { status: 200 });
};
process.env.ADMIN_EMAILS = 'ruth@memory.app';
const PORT = 3931, URL0 = 'http://localhost:' + PORT + '/';
const srv = await start(PORT);
const b = await chromium.launch();
const log = []; const errs = [];
const ok = (name, cond) => { log.push((cond ? 'OK   ' : 'FAIL ') + name); };
async function device(name) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { 'x-forwarded-for': '10.1.0.' + Math.floor(Math.random() * 250) } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(name + ' PAGEERR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g|net::ERR|status of 40[14]/.test(m.text())) errs.push(name + ' ' + m.text()); });
  await p.goto(URL0); await p.waitForFunction(() => window.API && (API.on || API === null) !== undefined); await p.waitForTimeout(600);
  return p;
}
const shot = (p, f) => p.screenshot({ path: SHOT + f });
const toastText = (p) => p.evaluate(() => (document.querySelector('.toast') || {}).textContent || '');
async function onboard(p, name) {
  await p.click('[data-act=onb-next]'); await p.fill('#onb-name', name); await p.click('[data-act=persona][data-id=concurso]'); await p.click('[data-act=onb-next]'); await p.click('[data-act=goal][data-n="5"]'); await p.click('[data-act=onb-finish]');
  await p.waitForSelector('[data-act=diag-skip]', { timeout: 3000 }).catch(() => {}); if (await p.locator('[data-act=diag-skip]').count()) await p.click('[data-act=diag-skip]');
  await p.waitForSelector('form[data-form=exam]', { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(250);
  if (await p.locator('form[data-form=exam]').count()) { await p.click('.sheet [data-act=sheet-close]'); await p.waitForTimeout(300); }
}
async function playSession(p, right = true, stay = false) {
  for (let k = 0; k < 80; k++) {
    const st = await p.evaluate(() => ui.session && ui.session.phase); if (!st || st === 'summary') break;
    if (st === 'desafio') await p.click('[data-act=reveal]');
    else if (st === 'esforco') { const wi = await p.evaluate((r) => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; return s.order.findIndex((o) => (r ? o === q.a : o !== q.a)); }, right); await p.click(`.opt >> nth=${wi}`); await p.click('[data-act=conf][data-c=certeza]'); }
    else if (st === 'feedback') await p.click('.dock [data-act=consol]');
    else if (st === 'consol') await p.click('.dock [data-act=next]');
    await p.waitForTimeout(30);
  }
  await p.waitForTimeout(800);
  if (await p.locator('.scrim').count()) { await p.click('.sheet [data-act=sheet-close]'); await p.waitForTimeout(300); }
  if (!stay) await p.click('[data-act=end]');
}
const settle = (p) => p.waitForFunction(() => !API.inflight && !API.timer || API.sync === 'saved', null, { timeout: 8000 }).catch(() => {});
async function flush(p) { await p.evaluate(async () => { clearTimeout(API.timer); API.timer = null; await pushServer(); }); }

try {
  /* ---------- Sem servidor: modo local continua igual ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('LOCAL PAGEERR ' + e.message));
    await p.route('**/api/**', (r) => r.abort());
    await p.goto(URL0); await p.waitForTimeout(800);
    ok('sem servidor: API desligada e sem botão de entrar', await p.evaluate(() => API.on === false) && (await p.locator('text=Já tenho conta').count()) === 0);
    await onboard(p, 'Local'); await p.click('[data-act=quick]'); await playSession(p);
    await p.click('[data-tab=perfil]');
    await p.evaluate(() => ACT['open-deck']({ id: 'port' })); await p.waitForTimeout(300);
    ok('jornada da trilha em etapas', (await p.locator('.jmodule').count()) === Math.ceil(Math.ceil((await p.evaluate(() => deckById('port').questions.length)) / 4) / 5) && (await p.locator('.journey .jn-btn[data-act=unit-start]').count()) === 5);
    await p.click('.jn.current .jn-btn'); await p.waitForTimeout(200);
    ok('etapa abre um ciclo com as questões dela', await p.evaluate(() => ui.session && ui.session.params.unit && ui.session.queue.every((id) => id.startsWith('port'))));
    await p.evaluate(() => ACT.end());
    await p.click('[data-tab=perfil]'); ok('sem servidor: perfil sem bloco de conta', (await p.locator('.promo').count()) === 0 && await p.evaluate(() => Object.keys(S.cards).length === 3));
    await ctx.close();
  }

  /* ---------- Aparelho A: estuda sem conta e depois cria a conta ---------- */
  const A = await device('A');
  ok('servidor detectado com banco e IA', await A.evaluate(() => API.on && API.db && API.ai && !API.user));
  await shot(A, 'e1-onb.png');
  await onboard(A, 'Ruth');
  await A.click('[data-act=quick]'); await playSession(A);
  await A.click('[data-tab=perfil]');
  ok('perfil mostra convite para criar conta', (await A.locator('.promo').count()) === 1);
  await shot(A, 'e2-promo.png');
  await A.click('.promo [data-act=auth-open][data-m=signup]'); await A.waitForTimeout(150);
  ok('folha de cadastro abre com nome preenchido', await A.inputValue('#au-name') === 'Ruth');
  await A.fill('#au-email', 'ruth@memory.app'); await A.fill('#au-pass', 'curta');
  await A.click('.sheet button[type=submit]'); await A.waitForTimeout(100);
  ok('validação de senha curta', (await A.locator('#au-err .notice').textContent()).includes('8 caracteres'));
  await A.click('[data-act=auth-eye]');
  ok('mostrar senha', await A.getAttribute('#au-pass', 'type') === 'text');
  await A.fill('#au-pass', 'estudo-ativo-2026'); await shot(A, 'e3-signup.png');
  await A.click('.sheet button[type=submit]'); await A.waitForTimeout(150);
  ok('cadastro exige aceite dos termos', (await A.locator('.notice.err').textContent().catch(() => '')).includes('Termos'));
  await A.click('.terms-row [data-doc=privacidade]'); await A.waitForTimeout(150);
  ok('política de privacidade abre do cadastro', (await A.locator('.legal h2').textContent()) === 'Política de privacidade');
  await A.click('[data-act=legal-back]'); await A.waitForTimeout(150);
  ok('volta ao cadastro sem perder dados', await A.inputValue('#au-email') === 'ruth@memory.app');
  await A.check('#au-terms'); await A.fill('#au-pass', 'estudo-ativo-2026');
  await A.click('.sheet button[type=submit]');
  await A.waitForFunction(() => API.user && API.sync === 'saved', null, { timeout: 8000 });
  ok('conta criada e progresso enviado', await A.evaluate(async () => { const r = await (await fetch('/api/state')).json(); return Object.keys(r.state.cards).length === 3 && r.state.user.name === 'Ruth'; }));
  await A.waitForSelector('.page >> text=ruth@memory.app', { timeout: 4000 }).catch(() => {});
  ok('perfil mostra e-mail e sincronização', (await A.locator('.page >> text=ruth@memory.app').count()) === 1);

  /* ---------- Aparelho B: entra na mesma conta ---------- */
  const B = await device('B');
  await B.click('[data-act=auth-open][data-m=login]'); await B.waitForTimeout(100);
  await B.fill('#au-email', 'ruth@memory.app'); await B.fill('#au-pass', 'errada-123'); await B.click('.sheet button[type=submit]');
  await B.waitForSelector('#au-err .notice'); ok('senha errada mostra erro', (await B.locator('#au-err .notice').textContent()).includes('incorretos'));
  await B.fill('#au-pass', 'estudo-ativo-2026'); await B.click('.sheet button[type=submit]');
  await B.waitForFunction(() => API.user && S.user.onboarded, null, { timeout: 8000 }); await B.waitForTimeout(200);
  ok('login no aparelho B pula o onboarding e traz o progresso', await B.evaluate(() => Object.keys(S.cards).length === 3 && S.user.name === 'Ruth' && ui.tab === 'home' && !!document.querySelector('.hdr')));
  await B.click('[data-act=quick]'); await playSession(B, false); await flush(B);
  await A.evaluate(() => syncAll()); await A.waitForTimeout(200);
  ok('A recebe o que B estudou', await A.evaluate(() => Object.keys(S.cards).length >= 4));

  /* ---------- Trilhas próprias e código curto ---------- */
  const did = await A.evaluate(() => { const id = importCode(deckCode(deckById('excel'))); render(); return id; });
  await A.waitForTimeout(400);
  await B.evaluate(() => syncAll()); await B.waitForTimeout(200);
  ok('trilha criada em A aparece em B', await B.evaluate((id) => !!CUSTOM.find((d) => d.id === id), did));
  await A.evaluate((id) => ACT['open-deck']({ id }), did); await A.click('[data-act=share-deck]'); await A.waitForTimeout(100);
  await A.click('[data-act=share-short]'); await A.waitForSelector('#short-box .codebox');
  const code = (await A.locator('#short-box .codebox b').textContent()).trim();
  ok('código curto gerado', /^[A-Z2-9]{6}$/.test(code));
  await shot(A, 'e4-share.png');
  await A.click('.sheet [data-act=sheet-close]'); await A.waitForTimeout(250);
  const C = await device('C');
  await onboard(C, 'Caio');
  await C.click('[data-tab=trilhas]'); await C.click('[data-act=tab][data-tab=importar]');
  await C.fill('#imp-code', code.toLowerCase()); await C.click('[data-act=imp-code]'); await C.waitForTimeout(400);
  ok('código curto importa trilha sem conta', await C.evaluate(() => CUSTOM.length === 1 && CUSTOM[0].subtitle === 'Compartilhada por Ruth'));
  await C.evaluate(() => ACT['imp-reset']()); await C.fill('#imp-code', 'ZZZZZZ'); await C.click('[data-act=imp-code]'); await C.waitForTimeout(300);
  ok('código inexistente mostra erro', (await C.locator('.notice.err').count()) === 1);

  /* ---------- Turmas ---------- */
  await A.click('[data-tab=perfil]'); await A.click('[data-act=tab][data-tab=turmas]');
  await A.fill('#cls-name', 'Turma Concurso TRT'); await A.click('[data-act=cls-create]');
  await A.waitForSelector('.cls-hero .codebox b'); const tcode = (await A.locator('.cls-hero .codebox b').textContent()).trim();
  ok('turma criada com código', /^[A-Z2-9]{6}$/.test(tcode));
  await A.click('[data-act=cls-add-deck]'); await A.waitForTimeout(150);
  await A.click(`.sheet [data-act=cls-add][data-id=${did}]`); await A.waitForTimeout(500);
  await A.click('[data-act=cls-add-deck]'); await A.waitForTimeout(150);
  await A.click('.sheet [data-act=cls-add][data-id=dconst]'); await A.waitForTimeout(500);
  ok('professor indicou 2 trilhas', await A.evaluate(() => API.cls.decks.length === 2));
  // C entra na turma pelo código (precisa de conta) — via link
  const D = await device('D');
  await D.goto(URL0 + '?turma=' + tcode); await D.waitForTimeout(900);
  ok('link de turma abre cadastro com aviso', (await D.locator('.sheet >> text=participar da turma').count()) === 1);
  await D.fill('#au-name', 'Duda Lima'); await D.fill('#au-email', 'duda@memory.app'); await D.fill('#au-pass', 'turma-forte-2026'); await D.check('#au-terms'); await D.click('.sheet button[type=submit]');
  await D.waitForFunction(() => API.user && API.classes.length === 1, null, { timeout: 8000 });
  ok('aluno entrou na turma pelo link', await D.evaluate(() => API.classes[0].name === 'Turma Concurso TRT' && API.classes[0].role === 'student'));
  await onboard(D, 'Duda');
  ok('trilha da turma aparece para o aluno', await D.evaluate((id) => !!deckById(id) && deckById(id).classDeck && personaDecks().includes(id), did));
  await D.click('[data-tab=trilhas]'); await D.click('[data-act=cat][data-id=turma]'); await D.waitForTimeout(100);
  ok('filtro "Da turma" lista 2 trilhas', await D.evaluate(() => document.querySelectorAll('#deck-grid .ccard').length === 2));
  await D.evaluate((id) => startCycle({ decks: [id], size: 4, title: 'T' }), did); await playSession(D); await flush(D);
  ok('moedas ganhas ao estudar', await D.evaluate(() => coinsBal() >= 4 + 5));
  await D.evaluate(() => startCycle({ decks: ['neuro'], size: 3, title: 'Sessão' })); await playSession(D);
  await D.click('[data-tab=home]').catch(() => {}); await D.waitForTimeout(300);
  await D.click('[data-tab=progresso]'); await D.waitForTimeout(200);
  ok('resumo da semana no progresso', (await D.locator('.wreport .wb').count()) === 7);
  await D.click('[data-act=share-week]'); await D.waitForSelector('.share-prev img', { timeout: 8000 }).catch(() => {});
  ok('cartão da semana gera imagem', await D.evaluate(() => { const i = document.querySelector('.share-prev img'); return !!(i && i.naturalWidth === 1080); }));
  await D.click('.sheet [data-act=sheet-close]'); await D.waitForTimeout(200);
  if (await D.locator('[data-act=weak-train]').count()) { await D.click('[data-act=weak-train]'); ok('treino de pontos fracos abre ciclo', await D.evaluate(() => !!ui.session && ui.session.title === 'Pontos fracos')); await D.evaluate(() => ACT.end()); }
  await D.click('[data-tab=home]'); await D.waitForTimeout(200);
  ok('plano de hoje com passos e progresso', (await D.locator('.plan .ps').count()) >= 2 && (await D.locator('.plan-ring').count()) === 1);
  ok('baú do dia aparece ao bater a meta', (await D.locator('[data-act=chest-open]').count()) === 1);
  const c0 = await D.evaluate(() => coinsBal()); await D.click('[data-act=chest-open]'); await D.waitForSelector('.reward');
  ok('baú dá moedas e só abre uma vez por dia', await D.evaluate((c) => coinsBal() >= c + 10 && !chestReady(), c0)); await D.click('[data-act=chest-close]'); await D.waitForTimeout(300);
  await D.evaluate(() => startCycle({ decks: ['neuro'], size: 3, title: 'Sessão' })); await playSession(D, true, true);
  ok('fim de ciclo mostra o plano e o próximo passo', (await D.locator('.plan-mini').count()) === 1);
  if (await D.locator('[data-act=plan-go]').count()) { await D.click('[data-act=plan-go]'); await D.waitForTimeout(300); ok('próximo passo abre direto', await D.evaluate(() => !!(ui.session && ui.session.phase !== 'summary') || ui.tab === 'home')); if (await D.evaluate(() => !!ui.session)) await D.evaluate(() => ACT.end()); }
  else await D.click('[data-act=end]');
  await D.waitForTimeout(200);
  await D.click('[data-act=exam-open]'); await D.fill('#ex-name', 'ENEM'); await D.fill('#ex-date', new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + 30 * 864e5))); await D.click('form[data-form=exam] [type=submit]'); await D.waitForTimeout(300);
  ok('objetivo com contagem regressiva e preparação', (await D.locator('.goalcard .ring').count()) === 1 && (await D.locator('.goalcard >> text=Faltam 30 dias').count()) === 1);
  await flush(D);
  // E entra pelo campo de código
  const E = await device('E');
  await E.click('[data-act=auth-open][data-m=login]'); await E.click('[data-act=auth-mode][data-m=signup]'); await E.fill('#au-name', 'Enzo Prado'); await E.fill('#au-email', 'enzo@memory.app'); await E.fill('#au-pass', 'turma-forte-2027'); await E.check('#au-terms'); await E.click('.sheet button[type=submit]');
  await E.waitForFunction(() => API.user, null, { timeout: 8000 }); await onboard(E, 'Enzo');
  await E.click('[data-tab=perfil]'); await E.click('.list [data-act=tab][data-tab=turmas]');
  await E.fill('#cls-code', tcode.toLowerCase()); await E.click('[data-act=cls-join]');
  await E.waitForSelector('.cls-hero'); await E.waitForTimeout(300);
  ok('aluno vê trilhas e ranking (sem dados dos colegas)', (await E.locator('.rank .item').count()) === 2 && (await E.locator('text=duda@memory.app').count()) === 0);
  await shot(E, 'e5-aluno.png');
  ok('ranking mostra o avatar de cada aluno', (await E.locator('.rank .item .av svg').count()) === 2);
  /* ---------- Avatar ---------- */
  await E.click('[data-tab=perfil]'); await E.click('.phead [data-act=av-open]'); await E.waitForSelector('.avpreview svg');
  await E.click('[data-act=av-grp][data-k=cabelo]'); await E.click('[data-act=av-set][data-k=hair][data-v=coque]');
  await E.click('[data-act=av-grp][data-k=cabeca]'); await E.click('[data-act=av-set][data-k=hat][data-v=capelo]');
  await E.click('[data-act=av-grp][data-k=oculos]'); await E.click('[data-act=av-set][data-k=glasses][data-v=aviador]'); await E.click('[data-act=av-set][data-k=gc][data-v="2"]');
  await E.click('[data-act=av-grp][data-k=fundo]'); await E.click('[data-act=av-set][data-k=bgp][data-v=raios]');
  await E.click('[data-act=av-random]'); await E.click('[data-act=av-undo]');
  ok('desfazer volta ao visual anterior', await E.evaluate(() => AVED.cfg.hat === 'capelo' && AVED.cfg.bgp === 'raios' && AVED.cfg.glasses === 'aviador'));
  await E.click('[data-act=av-try-save]'); await E.waitForSelector('.sheet .list');
  ok('loja: item sem saldo não é salvo', (await E.locator('.sheet .notice >> text=Faltam').count()) === 1 && await E.evaluate(() => !S.user.avatar || S.user.avatar.hat !== 'capelo'));
  await E.click('.sheet [data-act=sheet-close]'); await E.waitForTimeout(250);
  await E.evaluate(() => { S.coins.earned += 400; }); const bal0 = await E.evaluate(() => coinsBal());
  await E.click('[data-act=av-try-save]'); await E.waitForSelector('.sheet [data-act=shop-buy]'); await E.click('.sheet [data-act=shop-buy]'); await E.waitForTimeout(300);
  ok('loja: compra desconta as moedas e libera os itens', await E.evaluate((b0) => coinsBal() === b0 - 290 && S.owned['hat:capelo'] && S.owned['glasses:aviador'] && S.owned['bgp:raios'], bal0));
  ok('avatar salvo no perfil', await E.evaluate(() => S.user.avatar.hair === 'coque' && S.user.avatar.hat === 'capelo' && S.user.avatar.gc === 2 && !!document.querySelector('.phead-av svg')));
  await flush(E);
  ok('avatar e compras sincronizados na conta', await E.evaluate(async () => { const st = (await (await fetch('/api/state')).json()).state; const a = st.user.avatar; return a.hair === 'coque' && a.hat === 'capelo' && a.bgp === 'raios' && a.gc === 2 && st.owned['hat:capelo'] && st.coins.spent === 290; }));
  await D.evaluate(() => openClass(API.classes[0].id)); await D.waitForSelector('.rank'); await D.waitForTimeout(300);
  ok('colega vê o avatar novo no ranking', await D.evaluate(() => API.cls.ranking.some((r) => r.avatar && r.avatar.hair === 'coque')));
  // Painel do professor
  await A.click('[data-act=cls-refresh]'); await A.waitForSelector('.member'); await A.waitForTimeout(300);
  ok('painel lista 2 alunos', (await A.locator('.member').count()) === 2);
  const duda = await A.evaluate(() => API.cls.students.find((s) => s.name === 'Duda Lima'));
  ok('progresso da aluna na trilha da turma', duda && duda.summary.week >= 4 && duda.decks[Object.keys(duda.decks).find((k) => k.startsWith('u'))].seen === 4);
  await A.click(`[data-act=cls-member][data-id="${duda.id}"]`); await A.waitForTimeout(200);
  ok('detalhe do aluno abre', (await A.locator('.mdetail .dprog').count()) === 2);
  await shot(A, 'e6-painel.png');
  await A.evaluate(() => document.querySelector('.mdetail').scrollIntoView()); await shot(A, 'e6b-painel-aluno.png');
  const [dl] = await Promise.all([A.waitForEvent('download'), A.click('[data-act=cls-report]')]);
  const csv = await (await import('node:fs')).promises.readFile(await dl.path(), 'utf8');
  ok('relatório CSV da turma baixado', dl.suggestedFilename().endsWith('.csv') && csv.includes('Duda Lima') && csv.includes('Enzo Prado'));
  /* ---------- Administração ---------- */
  await A.click('[data-tab=perfil]'); await A.waitForTimeout(200);
  ok('admin vê item de Administração', (await A.locator('[data-act=tab][data-tab=admin]').count()) === 1 && (await D.evaluate(() => !API.user.admin)));
  await A.click('[data-act=tab][data-tab=admin]'); await A.waitForSelector('.achart'); await A.waitForTimeout(400);
  ok('painel admin com métricas e gráfico', await A.evaluate(() => ADM.data.users.users >= 3 && document.querySelectorAll('.abar').length === 14));
  await shot(A, 'e10-admin.png');
  await A.fill('#adm-q', 'duda'); await A.waitForTimeout(700);
  ok('busca de usuários', await A.evaluate(() => ADM.users.length === 1 && ADM.users[0].email === 'duda@memory.app'));
  await A.click('[data-act=adm-action][data-a=class_joined]'); await A.waitForTimeout(500);
  ok('auditoria filtrada', await A.evaluate(() => ADM.audit.length >= 2 && ADM.audit.every((e) => e.action === 'class_joined')));
  await A.fill('#adm-q', 'duda'); await A.waitForTimeout(700);
  const dudaId = await A.evaluate(() => ADM.users[0].id);
  await A.click(`[data-act=adm-reset][data-id="${dudaId}"]`); await A.waitForSelector('.sheet #share-code');
  const link = await A.inputValue('#share-code'); await A.click('.sheet [data-act=sheet-close]');
  ok('admin gera link de redefinição', /\?redefinir=[A-Za-z0-9_-]{30,}/.test(link));
  await D.goto(link.replace(/^https?:\/\/[^/]+\//, URL0)); await D.waitForSelector('form[data-form=reset]', { timeout: 8000 });
  await D.fill('#rs-pass', 'duda-nova-2026'); await D.fill('#rs-pass2', 'duda-outra'); await D.click('form[data-form=reset] [type=submit]'); await D.waitForTimeout(150);
  ok('redefinir: senhas diferentes avisam', (await D.locator('.sheet .notice.err').textContent()).includes('iguais'));
  await D.fill('#rs-pass', 'duda-nova-2026'); await D.fill('#rs-pass2', 'duda-nova-2026'); await D.click('form[data-form=reset] [type=submit]');
  await D.waitForFunction(() => API.user && API.user.email === 'duda@memory.app' && !ui.sheet, null, { timeout: 8000 });
  ok('senha redefinida pelo link e já entra na conta', await D.evaluate(() => API.classes.length === 1));
  await C.click('[data-tab=perfil]'); await C.click('.promo [data-act=auth-open][data-m=login]'); await C.click('[data-act=forgot-open]');
  await C.fill('#fg-email', 'caio@memory.app'); await C.click('form[data-form=forgot] [type=submit]'); await C.waitForTimeout(300);
  ok('esqueci a senha orienta sem revelar contas', (await C.locator('.sheet h2').textContent()).includes('administração'));
  await C.click('.sheet [data-act=auth-open]'); await C.keyboard.press('Escape'); await C.waitForTimeout(300);
  /* ---------- Sem internet ---------- */
  await A.context().setOffline(true); await A.evaluate(() => window.dispatchEvent(new Event('offline'))); await A.waitForTimeout(200);
  ok('aviso de sem internet', (await A.locator('.offline').count()) === 1);
  await A.context().setOffline(false); await A.evaluate(() => window.dispatchEvent(new Event('online'))); await A.waitForTimeout(1900);
  ok('aviso some quando a conexão volta', (await A.locator('.offline').count()) === 0);
  /* ---------- PWA ---------- */
  ok('manifesto e service worker', await A.evaluate(async () => { const m = await (await fetch('/manifest.webmanifest')).json(); const reg = await navigator.serviceWorker.getRegistration(); return m.short_name === 'Memory' && !!reg; }));

  /* ---------- IA pelo servidor ---------- */
  await D.click('[data-tab=home]'); await D.click('[data-act=quick]');
  await D.click('[data-act=reveal]'); const wi = await D.evaluate(() => { const s = ui.session; const q = QINDEX[s.queue[s.i]].q; return s.order.findIndex((o) => o !== q.a); });
  await D.click(`.opt >> nth=${wi}`); await D.click('[data-act=conf][data-c=acho]'); await D.click('.dock [data-act=consol]'); await D.waitForTimeout(150);
  ok('tutor disponível para quem tem conta', (await D.locator('#tutor').count()) === 1);
  await D.click('[data-act=tutor-chip] >> nth=0'); await D.waitForFunction(() => ui.session.tutor.msgs.length === 2, null, { timeout: 8000 });
  ok('tutor respondeu via servidor', await D.evaluate(() => ui.session.tutor.msgs[1].content.includes('exceções')));
  await D.click('[data-act=train]'); await D.waitForFunction(() => ui.session.train.done === 3, null, { timeout: 8000 });
  ok('variações criadas via servidor', await D.evaluate(() => CUSTOM.some((d) => d.id === 'ureforco' && d.questions.length === 3)));
  await shot(D, 'e7-tutor.png');
  await D.evaluate(() => ACT.end());
  await D.click('[data-tab=trilhas]'); await D.click('[data-act=tab][data-tab=importar]');
  await D.fill('#imp-text', 'Material de estudo sobre a LGPD. '.repeat(20)); await D.click('[data-act=imp-qty][data-n="5"]');
  await D.click('[data-act=imp-generate]'); await D.waitForFunction(() => imp.done, null, { timeout: 10000 });
  ok('gerou trilha com IA pelo servidor', await D.evaluate(() => deckById(imp.done).questions.length === 5));
  const anon = await device('anon'); await onboard(anon, 'Visitante');
  await anon.click('[data-tab=trilhas]'); await anon.click('[data-act=tab][data-tab=importar]');
  ok('sem conta: IA pede login', (await anon.locator('.notice >> text=Entre na sua conta').count()) === 1);

  /* ---------- Simulado Cebraspe, módulos da jornada e filtros ---------- */
  await A.evaluate(() => ACT['sim-cespe']({ id: 'dconst' })); await A.waitForTimeout(200);
  ok('simulado Cebraspe abre só com Certo/Errado', await A.evaluate(() => ui.session.params.cespe && ui.session.queue.every((id) => QINDEX[id].q.type === 'ce')));
  await A.click('.opt >> nth=0'); await A.click('[data-act=sim-next]'); await A.click('[data-act=sim-skip]');
  await A.evaluate(() => { const s = ui.session; while (s.i + 1 < s.queue.length) nextQuestion(); }); await A.click('[data-act=sim-skip]'); await A.waitForTimeout(400);
  if (await A.locator('.scrim').count()) { await A.keyboard.press('Escape'); await A.waitForTimeout(300); }
  ok('nota líquida do Cebraspe', await A.evaluate(() => /Simulado Cebraspe/.test(document.querySelector('.result .lbl').textContent)));
  await A.evaluate(() => ACT.end()); await A.evaluate(() => ACT['open-deck']({ id: 'port' })); await A.waitForTimeout(200);
  ok('jornada em módulos', (await A.locator('.jmodule').count()) === 3 && (await A.locator('.jmodule .jn').count()) <= 6);
  await A.click('.jmod >> nth=2'); ok('abrir outro módulo', (await A.locator('.jmodule .jn').count()) > 6);
  ok('lista de questões limitada com ver todas', (await A.locator('[data-act=study-one]').count()) === 12 && (await A.locator('[data-act=qmore]').count()) === 1);
  await A.click('[data-act=qf][data-f=ce]'); ok('filtro Certo/Errado', (await A.locator('[data-act=study-one]').count()) === 12);
  await A.click('[data-act=qf][data-f=todas]');

  /* ---------- Reportar questão, liga, amigos e notificações ---------- */
  await A.click('[data-tab=home]').catch(() => {}); await A.waitForTimeout(200);
  await A.evaluate(() => startCycle({ decks: ['port'], size: 2, title: 'Rep' })); await A.click('[data-act=reveal]'); await A.click('.opt >> nth=0'); await A.click('[data-act=conf][data-c=acho]');
  await A.click('[data-act=report-open]'); await A.click('[data-act=report-kind][data-k=gabarito]'); await A.fill('#rp-note', 'Teste de reporte.'); await A.click('form[data-form=report] [type=submit]'); await A.waitForTimeout(500);
  ok('reportar problema na questão', (await toastText(A)).includes('Obrigado'));
  await A.evaluate(() => ACT.end()); await A.evaluate(() => { ui.tab = 'admin'; render(); }); await A.waitForSelector('[data-act=adm-rep]', { timeout: 5000 }).catch(() => {});
  ok('admin vê o reporte', (await A.locator('[data-act=adm-rep][data-s=resolved]').count()) >= 1);
  await A.click('[data-act=adm-rep][data-s=resolved]'); await A.waitForTimeout(500);
  ok('admin marca como corrigida', (await A.locator('[data-act=adm-rep]').count()) === 0);
  await A.evaluate(() => { ui.tab = 'liga'; render(); }); await A.waitForSelector('.lg-row', { timeout: 5000 }).catch(() => {});
  ok('liga semanal mostra ranking', (await A.locator('.lg-row.me').count()) === 1 && (await A.locator('.lg-head h2').textContent()).includes('Bronze'));
  await shot(A, 'e10-liga.png');
  await A.click('[data-act=league-tab][data-t=amigos]'); const fcode = await A.locator('.code-box .num').textContent();
  ok('código de convite', /^[A-Z0-9]{6}$/.test(fcode));
  await D.goto(URL0 + '?amigo=' + fcode); await D.waitForTimeout(1500);
  await D.evaluate(() => { ui.tab = 'liga'; LG.tab = 'amigos'; render(); }); await D.waitForTimeout(800);
  ok('convite por link adiciona amigo', await D.evaluate(() => !!(LG.friends && LG.friends.friends.some((f) => f.name === 'Ruth'))));
  await A.evaluate(() => { ui.tab = 'perfil'; render(); }); await A.click('[data-act=push-open]'); await A.waitForTimeout(200);
  ok('folha de notificações no celular', (await A.locator('.sheet [data-push-sheet] h2').textContent()) === 'Lembrete no celular');
  await A.keyboard.press('Escape'); await A.waitForTimeout(200);

  /* ---------- Segurança da conta ---------- */
  await A.click('[data-tab=perfil]'); await A.click('.list [data-act=tab][data-tab=conta]');
  await shot(A, 'e8-conta.png');
  await A.click('[data-act=acct-pw]'); await A.fill('#pw-cur', 'estudo-ativo-2026'); await A.fill('#pw-new', 'nova-senha-forte-1'); await A.click('form[data-form=pw] button[type=submit]');
  await A.waitForTimeout(500);
  ok('senha alterada', (await toastText(A)).includes('Senha alterada'));
  await B.evaluate(() => { S.xp += 1; persist(); }); await flush(B); await B.waitForTimeout(200);
  ok('aparelho B foi desconectado após troca de senha', await B.evaluate(() => API.user === null));
  await A.click('[data-act=acct-logout]'); await A.click('.sheet [data-act=acct-logout-go]'); await A.waitForTimeout(1200);
  ok('sair limpa o aparelho e volta ao início', await A.evaluate(() => !S.user.onboarded && API.user === null && CUSTOM.length === 0));
  await A.click('[data-act=auth-open][data-m=login]'); await A.fill('#au-email', 'ruth@memory.app'); await A.fill('#au-pass', 'nova-senha-forte-1'); await A.click('.sheet button[type=submit]');
  await A.waitForFunction(() => API.user && S.user.onboarded && CUSTOM.length >= 1, null, { timeout: 8000 });
  ok('entrar de novo restaura progresso e trilhas', await A.evaluate(() => Object.keys(S.cards).length >= 4));
  // Zerar progresso propaga
  await A.click('[data-tab=perfil]'); await A.click('[data-act=ask-reset]'); await A.click('[data-act=do-reset]'); await flush(A);
  ok('zerar progresso vale na nuvem', await A.evaluate(async () => Object.keys((await (await fetch('/api/state')).json()).state.cards).length === 0));
  await shot(A, 'e9-perfil.png');
  // Excluir conta
  await E.click('[data-tab=perfil]'); await E.click('.list [data-act=tab][data-tab=conta]'); await E.click('[data-act=acct-del]');
  await E.fill('#del-pass', 'turma-forte-2027'); await E.click('form[data-form=del] button[type=submit]'); await E.waitForTimeout(1500);
  ok('conta excluída', await E.evaluate(async () => (await (await fetch('/api/auth/me')).json()).user === null && !S.user.onboarded));
} catch (e) { log.push('ERRO ' + e.message.split('\n').slice(0, 3).join(' | ')); }
console.log(log.join('\n'));
console.log(errs.length ? 'ERROS:\n' + errs.join('\n') : 'Sem erros de console');
console.log(log.filter((l) => l.startsWith('OK')).length + '/' + log.length);
await b.close(); srv.close(); process.exit(0);
