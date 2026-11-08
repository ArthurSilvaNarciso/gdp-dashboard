// Testes de ponta a ponta da API contra Postgres real em memória (PGlite).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../dev/server.mjs';

const PORT = 3911, BASE = 'http://localhost:' + PORT;
let server;
before(async () => {
  globalThis.__MEMORY_FAKE_AI = async ({ messages }) => {
    const prompt = messages[messages.length - 1].content;
    const text = prompt.includes('array JSON')
      ? JSON.stringify([{ topic: 'Teste', c: 'Caso', q: 'Pergunta?', a: 1, src: 'p. 1', o: [{ t: 'x', p: 'troca', w: 'w' }, { t: 'y', p: 'correta', w: 'w' }, { t: 'z', p: 'inversao', w: 'w' }, { t: 'k', p: 'restricao', w: 'w' }] }])
      : 'Resposta do **tutor**.';
    const chunks = text.match(/.{1,7}/gs).map((t) => `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: t } })}\n\n`);
    return new Response(new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(new TextEncoder().encode(ch)); c.close(); } }), { status: 200 });
  };
  process.env.ADMIN_EMAILS = 'chefe@ex.com, outra@ex.com';
  server = await start(PORT);
});
after(() => server.close());

let ipn = 0;
function client() {
  let cookie = ''; const ip = '10.0.0.' + (++ipn);
  return async function call(method, path, body, extra = {}) {
    const r = await fetch(BASE + '/api/' + path, {
      method, headers: Object.assign({ 'content-type': 'application/json', cookie, origin: BASE, 'x-forwarded-for': ip }, extra.headers || {}),
      body: body === undefined ? undefined : JSON.stringify(path === 'auth/signup' && body && !('terms' in body) ? Object.assign({ terms: true }, body) : body)
    });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const ct = r.headers.get('content-type') || '';
    const data = ct.includes('json') ? await r.json() : await r.text();
    return { status: r.status, data, headers: r.headers };
  };
}
const day = (o = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + o * 864e5)); // mesmo dia que o app usa (horário de Brasília)
const state = (over = {}) => Object.assign({ v: 2, user: { name: 'Ana', persona: 'concurso', goal: 10, onboarded: true, retention: 0.9 }, cards: {}, log: {}, xp: 0, streak: { count: 0, last: null }, freezes: 0, calib: {}, traps: {}, badges: {}, sims: [], totals: { fixed: 0, cycles: 0 }, updatedAt: Date.now() }, over);

test('saúde e banco', async () => {
  const r = await client()('GET', 'health');
  assert.equal(r.status, 200); assert.equal(r.data.db, true); assert.equal(r.data.ok, true);
});

test('cadastro, login, sessão e erros de validação', async () => {
  const a = client();
  assert.equal((await a('POST', 'auth/signup', { name: '', email: 'x@y.com', password: 'abcdefgh1' })).data.error, 'name_required');
  assert.equal((await a('POST', 'auth/signup', { name: 'Ana', email: 'ana@ex.com', password: 'memoria-forte-1', terms: false })).data.error, 'terms_required');
  assert.equal((await a('POST', 'auth/signup', { name: 'Ana', email: 'nao-email', password: 'abcdefgh1' })).data.error, 'invalid_email');
  assert.equal((await a('POST', 'auth/signup', { name: 'Ana', email: 'ana@ex.com', password: 'curta' })).data.error, 'weak_password');
  assert.equal((await a('POST', 'auth/signup', { name: 'Ana', email: 'ana@ex.com', password: '12345678' })).data.error, 'weak_password');
  const s = await a('POST', 'auth/signup', { name: '  Ana   Souza ', email: 'Ana@Ex.com', password: 'memoria-forte-1' });
  assert.equal(s.status, 201); assert.equal(s.data.user.email, 'ana@ex.com'); assert.equal(s.data.user.name, 'Ana Souza');
  assert.match(s.headers.get('set-cookie'), /HttpOnly/); assert.match(s.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal((await a('GET', 'auth/me')).data.user.email, 'ana@ex.com');
  const dup = await client()('POST', 'auth/signup', { name: 'Outra', email: 'ana@ex.com', password: 'memoria-forte-2' });
  assert.equal(dup.status, 409);
  const b = client();
  assert.equal((await b('POST', 'auth/login', { email: 'ana@ex.com', password: 'errada-123' })).status, 401);
  assert.equal((await b('GET', 'auth/me')).data.user, null);
  assert.equal((await b('POST', 'auth/login', { email: 'ANA@ex.com ', password: 'memoria-forte-1' })).status, 200);
  assert.equal((await b('GET', 'auth/me')).data.user.name, 'Ana Souza');
  assert.equal((await b('PATCH', 'auth/me', { name: 'Ana S.' })).data.user.name, 'Ana S.');
  await b('POST', 'auth/logout');
  assert.equal((await b('GET', 'auth/me')).data.user, null);
  assert.equal((await b('GET', 'state')).status, 401);
});

test('proteções: origem, JSON, rotas e métodos', async () => {
  const a = client();
  assert.equal((await a('POST', 'auth/login', { email: 'a@b.co', password: 'x' }, { headers: { origin: 'https://malicioso.com' } })).status, 403);
  const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' });
  assert.equal(r.status, 415);
  assert.equal((await a('GET', 'nada')).status, 404);
  assert.equal((await a('DELETE', 'health')).status, 405);
  const bad = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);
  const forged = await fetch(BASE + '/api/auth/me', { headers: { cookie: 'mem_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.abc' } });
  assert.equal((await forged.json()).user, null);
});

test('limite de tentativas de login', async () => {
  const a = client();
  await a('POST', 'auth/signup', { name: 'Rate', email: 'rate@ex.com', password: 'memoria-forte-9' });
  let last;
  for (let i = 0; i < 11; i++) last = await a('POST', 'auth/login', { email: 'rate@ex.com', password: 'errada-' + i });
  assert.equal(last.status, 429); assert.ok(Number(last.headers.get('retry-after')) > 0);
});

test('sincronização: mescla entre dois aparelhos', async () => {
  const a = client();
  await a('POST', 'auth/signup', { name: 'Bia', email: 'bia@ex.com', password: 'memoria-forte-3' });
  const b = client(); await b('POST', 'auth/login', { email: 'bia@ex.com', password: 'memoria-forte-3' });
  const t0 = Date.now() - 864e5 * 3;
  // Celular: respondeu neuro1 e neuro2 ontem
  const r1 = await a('PUT', 'state', { state: state({ xp: 40, cards: { neuro1: { n: 1, ok: 1, s: 3, d: 5, last: t0, g: 3, due: t0 + 3 * 864e5 }, neuro2: { n: 1, ok: 0, s: 0.4, d: 7, last: t0, g: 1, due: t0 } }, log: { [day(-1)]: { n: 2, ok: 1 } }, streak: { count: 1, last: day(-1) }, badges: { first: 100 }, updatedAt: t0 }) });
  assert.equal(r1.status, 200); assert.equal(r1.data.version, 1);
  // PC: revisou neuro2 depois e respondeu port1 hoje
  const r2 = await b('PUT', 'state', { state: state({ xp: 25, cards: { neuro2: { n: 2, ok: 1, s: 2, d: 6, last: t0 + 1000, g: 3, due: t0 + 3e8 }, port1: { n: 1, ok: 1, s: 3, d: 5, last: Date.now(), g: 4, due: Date.now() + 3e8 } }, log: { [day(0)]: { n: 2, ok: 2 } }, streak: { count: 2, last: day(0) }, badges: { first: 50 }, sims: [{ at: 5, title: 'Sim', score: 80, n: 10 }], user: { name: 'Bia PC', goal: 20, onboarded: true }, updatedAt: Date.now() }) });
  const m = r2.data.state;
  assert.equal(r2.data.version, 2);
  assert.deepEqual(Object.keys(m.cards).sort(), ['neuro1', 'neuro2', 'port1']);
  assert.equal(m.cards.neuro2.n, 2); assert.equal(m.xp, 40); assert.equal(m.streak.count, 2); assert.equal(m.badges.first, 50);
  assert.equal(m.user.goal, 20); assert.equal(m.sims.length, 1); assert.equal(Object.keys(m.log).length, 2);
  const g = await a('GET', 'state');
  assert.deepEqual(g.data.state.cards, m.cards);
  // Lixo é descartado pelo saneamento
  const junk = await a('PUT', 'state', { state: state({ cards: { 'x y': { n: 1 }, '<script>': {}, ok_id: { n: 'abc', s: -5, last: 'x' } }, log: { 'not-a-day': { n: 9 } }, xp: -100 }) });
  assert.equal(junk.status, 200);
  assert.ok(!junk.data.state.cards['x y']); assert.ok(!junk.data.state.log['not-a-day']);
  assert.equal(junk.data.state.cards.ok_id.n, 0);
  assert.equal((await a('PUT', 'state', { state: 'oi' })).status, 400);
  // Zerar no PC vence o celular desatualizado
  const reset = await b('PUT', 'state', { state: state({ resetAt: Date.now(), updatedAt: Date.now() }) });
  assert.equal(Object.keys(reset.data.state.cards).length, 0); assert.equal(reset.data.state.xp, 0);
  const stale = await a('PUT', 'state', { state: Object.assign({}, m, { updatedAt: Date.now() - 1000 }) });
  assert.equal(Object.keys(stale.data.state.cards).length, 0); assert.equal(stale.data.state.xp, 0); assert.equal(stale.data.state.sims.length, 0);
});

test('escritas concorrentes não perdem progresso', async () => {
  const a = client();
  await a('POST', 'auth/signup', { name: 'Caio', email: 'caio@ex.com', password: 'memoria-forte-4' });
  const now = Date.now();
  const puts = Array.from({ length: 6 }, (_, i) => a('PUT', 'state', { state: state({ cards: { ['neuro' + (i + 1)]: { n: 1, ok: 1, s: 3, d: 5, last: now + i, g: 3, due: now + 3e8 } } }) }));
  const rs = await Promise.all(puts);
  assert.ok(rs.every((r) => r.status === 200), rs.map((r) => r.status + JSON.stringify(r.data).slice(0, 80)).join(','));
  const g = await a('GET', 'state');
  assert.equal(Object.keys(g.data.state.cards).length, 6);
});

test('trilhas próprias: criar, listar, excluir (com marcação)', async () => {
  const a = client();
  await a('POST', 'auth/signup', { name: 'Duda', email: 'duda@ex.com', password: 'memoria-forte-5' });
  const deck = { id: 'uabc123', title: 'Minha trilha', questions: [{ id: 'uabc123_0', topic: 'T', c: 'c', q: 'q?', a: 0, o: [{ t: 'a', p: 'correta', w: '' }, { t: 'b', p: 'troca', w: '' }, { t: 'c', p: 'xx', w: '' }] }] };
  assert.equal((await a('PUT', 'decks/uabc123', { deck })).status, 200);
  assert.equal((await a('PUT', 'decks/neuro', { deck })).status, 400);
  assert.equal((await a('PUT', 'decks/uvazio', { deck: { title: 'x', questions: [] } })).status, 400);
  let l = await a('GET', 'decks');
  assert.equal(l.data.decks.length, 1); assert.equal(l.data.decks[0].questions[0].o[2].p, 'troca');
  assert.equal((await a('DELETE', 'decks/uabc123')).status, 200);
  l = await a('GET', 'decks');
  assert.equal(l.data.decks.length, 0); assert.deepEqual(l.data.deleted, ['uabc123']);
  assert.equal((await a('PUT', 'decks/uabc123', { deck })).status, 410);
});

test('compartilhar trilha por código curto', async () => {
  const a = client();
  await a('POST', 'auth/signup', { name: 'Edu Lima', email: 'edu@ex.com', password: 'memoria-forte-6' });
  const deck = { id: 'ux1', title: 'Direito', blurb: 'b', questions: [{ id: 'ux1_0', q: 'q?', a: 1, o: [{ t: 'a' }, { t: 'b' }, { t: 'c' }] }] };
  const s = await a('POST', 'share', { deck });
  assert.equal(s.status, 201); assert.match(s.data.code, /^[A-Z2-9]{6}$/);
  const anon = client();
  const g = await anon('GET', 'share/' + s.data.code.toLowerCase());
  assert.equal(g.status, 200); assert.equal(g.data.deck.title, 'Direito'); assert.equal(g.data.deck.by, 'Edu'); assert.equal(g.data.deck.questions[0].a, 1);
  assert.equal((await anon('GET', 'share/ZZZZZZ')).status, 404);
  assert.equal((await anon('POST', 'share', { deck })).status, 401);
});

test('turmas: criar, entrar, painel do professor, ranking e permissões', async () => {
  const prof = client(); await prof('POST', 'auth/signup', { name: 'Prof Rita', email: 'rita@ex.com', password: 'memoria-forte-7' });
  const al1 = client(); await al1('POST', 'auth/signup', { name: 'Gabi Rocha', email: 'gabi@ex.com', password: 'memoria-forte-8' });
  const al2 = client(); await al2('POST', 'auth/signup', { name: 'Hugo Dias', email: 'hugo@ex.com', password: 'memoria-forte-0' });
  assert.equal((await prof('POST', 'classes', { name: 'x' })).status, 400);
  const c = await prof('POST', 'classes', { name: 'Turma 3B · Noite' });
  assert.equal(c.status, 201); const cid = c.data.class.id; const code = c.data.class.joinCode;
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.equal((await prof('POST', 'classes/' + cid + '/decks', { builtin: 'neuro' })).status, 200);
  const own = { id: 'uprof1', title: 'Revisão da prova', questions: [{ id: 'uprof1_0', q: 'q?', a: 0, o: [{ t: 'a' }, { t: 'b' }, { t: 'c' }] }] };
  assert.equal((await prof('POST', 'classes/' + cid + '/decks', { deck: own })).status, 200);
  assert.equal((await al1('POST', 'classes/join', { code: 'XXXXXX' })).status, 404);
  assert.equal((await al1('POST', 'classes/join', { code: code.toLowerCase().split('').join(' ') })).status, 200);
  assert.equal((await al1('POST', 'classes/join', { code })).data.already, true);
  await al2('POST', 'classes/join', { code });
  // Alunos estudam
  const now = Date.now();
  await al1('PUT', 'state', { state: state({ cards: { neuro1: { n: 2, ok: 2, s: 12, d: 4, last: now, g: 4, due: now + 9e8 }, uprof1_0: { n: 1, ok: 1, s: 3, d: 5, last: now, g: 3, due: now + 3e8 } }, log: { [day(0)]: { n: 3, ok: 3 } }, streak: { count: 4, last: day(0) }, traps: { troca: 2 } }) });
  await al2('PUT', 'state', { state: state({ cards: { neuro2: { n: 1, ok: 0, s: 0.4, d: 7, last: now, g: 1, due: now } }, log: { [day(0)]: { n: 1, ok: 0 } }, streak: { count: 1, last: day(0) }, traps: { troca: 1, inversao: 1 } }) });
  // Painel do professor
  const d = await prof('GET', 'classes/' + cid);
  assert.equal(d.status, 200);
  const k = d.data.class;
  assert.equal(k.role, 'owner'); assert.equal(k.students.length, 2); assert.equal(k.decks.length, 2);
  const gabi = k.students.find((s) => s.name === 'Gabi Rocha');
  assert.equal(gabi.summary.week, 3); assert.equal(gabi.summary.accuracy, 100); assert.equal(gabi.summary.streak, 4);
  assert.equal(gabi.decks.neuro.seen, 1); assert.equal(gabi.decks.neuro.firm, 1); assert.equal(gabi.decks.uprof1.seen, 1);
  assert.equal(k.overview.activeWeek, 2); assert.equal(k.overview.weekAnswers, 4); assert.equal(k.overview.traps[0][0], 'troca');
  assert.equal(k.ranking[0].name, 'Gabi');
  // Visão do aluno: sem e-mails, sem dados dos colegas, com ranking
  const v = await al2('GET', 'classes/' + cid);
  assert.equal(v.data.class.role, 'student'); assert.equal(v.data.class.students, undefined); assert.equal(v.data.class.joinCode, undefined);
  assert.equal(v.data.class.ranking.find((r) => r.me).name, 'Hugo');
  assert.ok(!JSON.stringify(v.data).includes('@ex.com'));
  const list = await al1('GET', 'classes');
  assert.equal(list.data.classes[0].decks.length, 2); assert.equal(list.data.classes[0].owner, 'Prof Rita'); assert.equal(list.data.classes[0].joinCode, undefined);
  // Permissões
  assert.equal((await al1('POST', 'classes/' + cid + '/decks', { builtin: 'port' })).status, 403);
  assert.equal((await al1('DELETE', 'classes/' + cid)).status, 403);
  const stranger = client(); await stranger('POST', 'auth/signup', { name: 'Ivo', email: 'ivo@ex.com', password: 'memoria-forte-x' });
  assert.equal((await stranger('GET', 'classes/' + cid)).status, 404);
  assert.equal((await stranger('GET', 'classes/nao-e-uuid')).status, 404);
  // Novo código invalida o antigo
  const nc = await prof('POST', 'classes/' + cid + '/code');
  assert.notEqual(nc.data.joinCode, code);
  assert.equal((await stranger('POST', 'classes/join', { code })).status, 404);
  // Remover aluno, aluno sair, professor não sai
  assert.equal((await prof('DELETE', 'classes/' + cid + '/members/' + gabi.id)).status, 200);
  assert.equal((await al1('GET', 'classes/' + cid)).status, 404);
  assert.equal((await al2('POST', 'classes/' + cid + '/leave')).status, 200);
  assert.equal((await prof('POST', 'classes/' + cid + '/leave')).status, 400);
  assert.equal((await prof('DELETE', 'classes/' + cid + '/decks/neuro')).status, 200);
  assert.equal((await prof('GET', 'classes/' + cid)).data.class.decks.length, 1);
  assert.equal((await prof('DELETE', 'classes/' + cid)).status, 200);
  assert.equal((await prof('GET', 'classes')).data.classes.length, 0);
});

test('IA: tutor, variações e geração com streaming e cota', async () => {
  const a = client(); await a('POST', 'auth/signup', { name: 'Juli', email: 'juli@ex.com', password: 'memoria-forte-y' });
  const question = { topic: 'T', c: 'caso', q: 'q?', a: 0, o: [{ t: 'a', p: 'correta', w: 'w' }, { t: 'b', p: 'troca', w: 'w' }, { t: 'c', p: 'inversao', w: 'w' }] };
  const t = await a('POST', 'ai/tutor', { question, pick: 1, deckTitle: 'X', messages: [{ role: 'user', content: 'Por que errei?' }] });
  assert.equal(t.status, 200); assert.equal(t.data, 'Resposta do **tutor**.');
  assert.equal((await a('POST', 'ai/tutor', { question, messages: [] })).status, 400);
  const v = await a('POST', 'ai/variations', { question, deckTitle: 'X', n: 3 });
  assert.equal(JSON.parse(v.data)[0].a, 1);
  assert.equal((await a('POST', 'ai/questions', { material: 'curto', n: 5 })).data.error, 'material_short');
  const g = await a('POST', 'ai/questions', { material: 'Lorem ipsum '.repeat(30), n: 5, title: 'Apostila' });
  assert.equal(g.status, 200); assert.ok(Array.isArray(JSON.parse(g.data)));
  assert.equal((await client()('POST', 'ai/tutor', { question, messages: [{ role: 'user', content: 'oi' }] })).status, 401);
  process.env.AI_DAILY_UNITS = '12';
  const over = await a('POST', 'ai/variations', { question, n: 3 });
  assert.equal(over.status, 429); assert.equal(over.data.error, 'ai_quota');
  delete process.env.AI_DAILY_UNITS;
});

test('senha, sair de todos os aparelhos, exportar e excluir conta', async () => {
  const a = client(); await a('POST', 'auth/signup', { name: 'Leo', email: 'leo@ex.com', password: 'memoria-forte-z' });
  const b = client(); await b('POST', 'auth/login', { email: 'leo@ex.com', password: 'memoria-forte-z' });
  assert.equal((await a('POST', 'auth/password', { current: 'errada', next: 'nova-senha-123' })).status, 401);
  assert.equal((await a('POST', 'auth/password', { current: 'memoria-forte-z', next: 'nova-senha-123' })).status, 200);
  assert.ok((await a('GET', 'auth/me')).data.user, 'quem trocou continua logado');
  assert.equal((await b('GET', 'auth/me')).data.user, null, 'outros aparelhos saem');
  await b('POST', 'auth/login', { email: 'leo@ex.com', password: 'nova-senha-123' });
  await a('POST', 'auth/logout-all');
  assert.equal((await b('GET', 'auth/me')).data.user, null);
  await a('PUT', 'state', { state: state({ xp: 99 }) });
  const ex = await a('GET', 'export');
  assert.equal(ex.data.progress.xp, 99); assert.match(ex.headers.get('content-disposition'), /attachment/);
  assert.ok(Array.isArray(ex.data.activity) && ex.data.activity.some((x) => x.action === 'password_changed'));
  assert.equal((await a('DELETE', 'auth/me', { password: 'errada' })).status, 401);
  assert.equal((await a('DELETE', 'auth/me', { password: 'nova-senha-123' })).status, 200);
  assert.equal((await a('GET', 'auth/me')).data.user, null);
  assert.equal((await client()('POST', 'auth/login', { email: 'leo@ex.com', password: 'nova-senha-123' })).status, 401);
});

test('relatório CSV da turma e área de administração', async () => {
  const prof = client(); await prof('POST', 'auth/signup', { name: 'Prof Nina', email: 'nina@ex.com', password: 'memoria-forte-n' });
  const al = client(); await al('POST', 'auth/signup', { name: 'Otto; "Aluno"', email: 'otto@ex.com', password: 'memoria-forte-o' });
  const c = (await prof('POST', 'classes', { name: 'Relatório 1' })).data.class;
  await prof('POST', 'classes/' + c.id + '/decks', { builtin: 'neuro' });
  await al('POST', 'classes/join', { code: c.joinCode });
  const now = Date.now();
  await al('PUT', 'state', { state: state({ cards: { neuro1: { n: 1, ok: 1, s: 12, d: 4, last: now, g: 4, due: now + 9e8 } }, log: { [day(0)]: { n: 5, ok: 4 } }, traps: { troca: 3 } }) });
  const r = await prof('GET', 'classes/' + c.id + '/report');
  assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /text\/csv/); assert.match(r.headers.get('content-disposition'), /memory-relatorio-1/);
  const lines = r.data.replace(/^﻿/, '').trim().split('\r\n');
  assert.equal(lines.length, 2); assert.match(lines[0], /Trilha: Hackeando o estudo/);
  assert.ok(lines[1].startsWith('"Otto; ""Aluno"""'), lines[1]); assert.match(lines[1], /;5;4;5;80;/); assert.match(lines[1], /;troca;/);
  assert.equal((await al('GET', 'classes/' + c.id + '/report')).status, 403);
  assert.equal((await prof('GET', 'admin/overview')).status, 403);
  const adm = client(); const su = await adm('POST', 'auth/signup', { name: 'Chefe', email: 'Chefe@ex.com', password: 'memoria-forte-c' });
  assert.equal(su.data.user.admin, true);
  const o = await adm('GET', 'admin/overview');
  assert.equal(o.status, 200); assert.ok(o.data.users.users >= 3); assert.equal(o.data.days.length, 14); assert.ok(o.data.classes.classes >= 1);
  assert.ok(o.data.days[13].answers >= 5, JSON.stringify(o.data.days.slice(-2)));
  const us = await adm('GET', 'admin/users?q=otto');
  assert.equal(us.data.users.length, 1); assert.equal(us.data.users[0].week, 5); assert.equal(us.data.users[0].joined, 1);
  const au = await adm('GET', 'admin/audit?action=class_joined');
  assert.ok(au.data.events.length >= 1 && au.data.events.every((e) => e.action === 'class_joined'));
});

test('recuperação de senha: link do administrador, uso único e expiração', async () => {
  const u = client(); const su = await u('POST', 'auth/signup', { name: 'Pia', email: 'pia@ex.com', password: 'memoria-forte-p' });
  const other = client(); await other('POST', 'auth/login', { email: 'pia@ex.com', password: 'memoria-forte-p' });
  const f = await client()('POST', 'auth/forgot', { email: 'pia@ex.com' });
  assert.equal(f.status, 200); assert.equal(f.data.email, false);
  assert.equal((await client()('POST', 'auth/forgot', { email: 'ninguem@ex.com' })).status, 200, 'não revela se existe');
  const adm = client(); await adm('POST', 'auth/login', { email: 'chefe@ex.com', password: 'memoria-forte-c' });
  assert.equal((await u('POST', 'admin/users/' + su.data.user.id + '/reset-link')).status, 403);
  const l = await adm('POST', 'admin/users/' + su.data.user.id + '/reset-link');
  assert.equal(l.status, 200); const token = new URL(l.data.url).searchParams.get('redefinir'); assert.ok(token.length > 30);
  const anon = client();
  assert.equal((await anon('POST', 'auth/reset', { token, check: true })).data.email, 'pia@ex.com');
  assert.equal((await anon('POST', 'auth/reset', { token, password: 'curta' })).data.error, 'weak_password');
  assert.equal((await anon('POST', 'auth/reset', { token, password: 'senha-nova-da-pia' })).status, 200);
  assert.equal((await anon('GET', 'auth/me')).data.user.email, 'pia@ex.com', 'entra direto após redefinir');
  assert.equal((await anon('POST', 'auth/reset', { token, password: 'outra-senha-nova' })).data.error, 'invalid_token', 'uso único');
  assert.equal((await other('GET', 'auth/me')).data.user, null, 'outros aparelhos saem');
  assert.equal((await client()('POST', 'auth/login', { email: 'pia@ex.com', password: 'senha-nova-da-pia' })).status, 200);
  assert.equal((await anon('POST', 'auth/reset', { token: 'x'.repeat(40), password: 'qualquer-coisa-1' })).data.error, 'invalid_token');
  // Um link novo invalida o anterior
  const l1 = await adm('POST', 'admin/users/' + su.data.user.id + '/reset-link'); const l2 = await adm('POST', 'admin/users/' + su.data.user.id + '/reset-link');
  const t1 = new URL(l1.data.url).searchParams.get('redefinir'), t2 = new URL(l2.data.url).searchParams.get('redefinir');
  assert.equal((await anon('POST', 'auth/reset', { token: t1, check: true })).data.error, 'invalid_token');
  assert.equal((await anon('POST', 'auth/reset', { token: t2, check: true })).status, 200);
  const r = await fetch('http://localhost:3911/api/health'); assert.ok(r.headers.get('x-request-id'));
});

test('reporte de problema em questão e revisão pelo administrador', async () => {
  const anon = client();
  assert.equal((await anon('POST', 'reports', { questionId: 'port3', deckId: 'port', kind: 'xx' })).data.error, 'invalid_kind');
  assert.equal((await anon('POST', 'reports', { questionId: '<x>', kind: 'gabarito' })).data.error, 'invalid_question');
  assert.equal((await anon('POST', 'reports', { questionId: 'port3', deckId: 'port', kind: 'gabarito', note: 'Acho que a correta é a C.' })).status, 201);
  const u = client(); await u('POST', 'auth/signup', { name: 'Rafa Reporte', email: 'rafa@ex.com', password: 'memoria-forte-r' });
  assert.equal((await u('POST', 'reports', { questionId: 'port3', deckId: 'port', kind: 'enunciado' })).status, 201);
  assert.equal((await u('POST', 'reports', { questionId: 'port3', deckId: 'port', kind: 'portugues' })).data.updated, true, 'mesmo usuário atualiza o reporte aberto');
  assert.equal((await u('GET', 'admin/reports')).status, 403);
  const adm = client(); await adm('POST', 'auth/login', { email: 'chefe@ex.com', password: 'memoria-forte-c' });
  const l = await adm('GET', 'admin/reports'); assert.equal(l.status, 200);
  const mine = l.data.reports.filter((r) => r.questionId === 'port3'); assert.equal(mine.length, 2); assert.equal(mine[0].same, 2); assert.equal(l.data.kinds.gabarito, 'Gabarito errado');
  assert.equal((await adm('PATCH', 'admin/reports/' + mine[0].id, { status: 'resolved' })).status, 200);
  assert.equal((await adm('GET', 'admin/reports')).data.reports.filter((r) => r.questionId === 'port3').length, 0, 'resolver fecha todos da questão');
});

test('notificações push: chave VAPID, inscrição, teste e rotina diária', async () => {
  const sent = []; globalThis.__MEMORY_FAKE_PUSH = async (sub, payload) => { if (sub.endpoint.includes('gone')) { const e = new Error('gone'); e.statusCode = 410; throw e; } sent.push({ ep: sub.endpoint, payload }); };
  const k1 = await client()('GET', 'push/key'); const k2 = await client()('GET', 'push/key');
  assert.equal(k1.status, 200); assert.ok(k1.data.publicKey.length > 80); assert.equal(k1.data.publicKey, k2.data.publicKey, 'chave estável');
  const u = client(); const nsu = await u('POST', 'auth/signup', { name: 'Nina Push', email: 'nina.push@ex.com', password: 'memoria-forte-n' }); assert.equal(nsu.status, 201, JSON.stringify(nsu.data));
  const sub = (ep) => ({ subscription: { endpoint: 'https://push.example.com/' + ep, keys: { p256dh: 'BP' + 'a'.repeat(80), auth: 'abcdefghijklmnop' } }, hour: 19 });
  assert.equal((await u('POST', 'push/subscribe', { subscription: { endpoint: 'http://inseguro' } })).data.error, 'invalid_subscription');
  assert.equal((await u('POST', 'push/subscribe', sub('nina-1'))).status, 200);
  assert.equal((await u('POST', 'push/subscribe', sub('gone-1'))).status, 200);
  await u('PUT', 'state', { state: state({ log: { [day(-1)]: { n: 5, ok: 4 } }, streak: { count: 4, last: day(-1) }, user: { name: 'Nina', goal: 10, onboarded: true } }) });
  const t = await u('POST', 'push/test'); assert.equal(t.data.sent, 1);
  sent.length = 0;
  const c = await client()('GET', 'cron/daily'); assert.equal(c.status, 200);
  const toNina = sent.filter((x) => x.ep.endsWith('nina-1')); assert.equal(toNina.length, 1); assert.match(toNina[0].payload.title, /sequência de 4 dias/);
  sent.length = 0; process.env.CRON_SECRET = 'segredo-cron';
  assert.equal((await client()('GET', 'cron/daily')).status, 401);
  const c2 = await client()('GET', 'cron/daily', undefined, { headers: { authorization: 'Bearer segredo-cron' } });
  assert.equal(c2.status, 200); assert.equal(sent.filter((x) => x.ep.endsWith('nina-1')).length, 0, 'não repete no mesmo dia');
  delete process.env.CRON_SECRET;
  // Quem já estudou hoje não recebe lembrete
  const v = client(); await v('POST', 'auth/signup', { name: 'Vivi Hoje', email: 'vivi@ex.com', password: 'memoria-forte-v' });
  await v('POST', 'push/subscribe', sub('vivi-1')); await v('PUT', 'state', { state: state({ log: { [day(0)]: { n: 3, ok: 3 } }, streak: { count: 1, last: day(0) } }) });
  sent.length = 0; process.env.CRON_SECRET = 's2';
  await client()('GET', 'cron/daily', undefined, { headers: { authorization: 'Bearer s2' } }); delete process.env.CRON_SECRET;
  assert.equal(sent.filter((x) => x.ep.endsWith('vivi-1')).length, 0);
  assert.equal((await u('DELETE', 'push/subscribe', { endpoint: 'https://push.example.com/nina-1' })).status, 200);
  delete globalThis.__MEMORY_FAKE_PUSH;
});

test('liga semanal e amigos por convite', async () => {
  const mk = async (name, email, n, ok) => { const c = client(); await c('POST', 'auth/signup', { name, email, password: 'memoria-forte-l' }); await c('PUT', 'state', { state: state({ log: { [day(0)]: { n, ok } }, streak: { count: 1, last: day(0) } }) }); return c; };
  const a = await mk('Lia Liga', 'lia@ex.com', 10, 8); const b = await mk('Beto Liga', 'beto@ex.com', 4, 2);
  assert.equal((await client()('GET', 'league')).status, 401);
  const la = await a('GET', 'league'); assert.equal(la.status, 200); assert.equal(la.data.tierName, 'Bronze');
  const lb = await b('GET', 'league'); assert.ok(lb.data.members.length >= 2);
  const me = lb.data.members.find((m) => m.me); const lia = lb.data.members.find((m) => m.name === 'Lia');
  assert.equal(lia.points, 8 * 10 + 10 * 2); assert.equal(me.points, 2 * 10 + 4 * 2); assert.ok(lia.pos < me.pos);
  assert.ok(lb.data.endsAt > Date.now());
  // Pontos atualizam quando o progresso sincroniza
  await b('PUT', 'state', { state: state({ log: { [day(0)]: { n: 20, ok: 18 } }, streak: { count: 1, last: day(0) } }) });
  const lb2 = await b('GET', 'league'); assert.equal(lb2.data.members[0].name, 'Beto');
  // Amigos
  const fa = await a('GET', 'friends'); assert.match(fa.data.code, /^[A-Z0-9]{6}$/); assert.equal(fa.data.friends.length, 1);
  assert.equal((await a('POST', 'friends', { code: fa.data.code })).data.error, 'self_invite');
  assert.equal((await b('POST', 'friends', { code: 'ZZZZZZ' })).status, 404);
  const add = await b('POST', 'friends', { code: fa.data.code.toLowerCase() }); assert.equal(add.data.friend.name, 'Lia');
  const fb = await b('GET', 'friends'); assert.equal(fb.data.friends.length, 2); assert.equal(fb.data.friends[0].name, 'Beto');
  const fa2 = await a('GET', 'friends'); assert.equal(fa2.data.friends.length, 2, 'amizade nos dois sentidos');
  const liaId = fb.data.friends.find((f) => f.name === 'Lia').id;
  assert.equal((await b('DELETE', 'friends/' + liaId)).status, 200);
  assert.equal((await a('GET', 'friends')).data.friends.length, 1);
});

test('concursos: lista atualizada pela IA com busca e material por disciplina', async () => {
  const fim = day(20), passado = day(-2);
  assert.equal((await client()('GET', 'concursos')).status, 404, 'sem atualização usa a lista publicada');
  globalThis.__MEMORY_FAKE_SEARCH = async (body) => {
    assert.equal(body.tools[0].name, 'web_search');
    return { content: [{ type: 'server_tool_use' }, { type: 'text', text: 'Segue:\n' + JSON.stringify([
      { id: 'tj-teste-2026', orgao: 'Tribunal de Teste', sigla: 'TJT', titulo: 'Analista', esfera: 'estadual', uf: 'SP', banca: 'Vunesp', escolaridade: ['superior'], vagas: 30, salario: 9000, inscricoes: { inicio: day(-5), fim }, prova: null, status: 'abertas', disciplinas: [{ nome: 'Língua Portuguesa', topicos: ['Crase'] }], edital: 'https://exemplo.org/edital', fonte: 'https://exemplo.org' },
      { id: 'velho-2026', orgao: 'Órgão Velho', titulo: 'Técnico', esfera: 'municipal', uf: 'RJ', banca: 'X', escolaridade: ['medio'], inscricoes: { fim: passado }, disciplinas: [{ nome: 'Português', topicos: [] }], edital: 'https://exemplo.org/v' },
      { id: 'sem-link', orgao: 'Sem link', titulo: 'x', escolaridade: ['medio'], inscricoes: { fim }, edital: 'javascript:alert(1)' }
    ]) }] };
  };
  const adm = client(); await adm('POST', 'auth/login', { email: 'chefe@ex.com', password: 'memoria-forte-c' });
  assert.equal((await client()('POST', 'admin/concursos/refresh', {})).status, 401);
  const r = await adm('POST', 'admin/concursos/refresh', {}); assert.equal(r.status, 200); assert.equal(r.data.added, 1);
  const l = await client()('GET', 'concursos'); assert.equal(l.status, 200); assert.equal(l.data.items.length, 1); assert.equal(l.data.items[0].id, 'tj-teste-2026');
  delete globalThis.__MEMORY_FAKE_SEARCH;
  // Material da disciplina (IA de mentira)
  const u = client(); await u('POST', 'auth/signup', { name: 'Caio Concurso', email: 'caio.concurso@ex.com', password: 'memoria-forte-k' });
  assert.equal((await u('POST', 'ai/discipline', {})).data.error, 'invalid_discipline');
  const g = await u('POST', 'ai/discipline', { concurso: 'TJT Analista', banca: 'Vunesp', disciplina: 'Língua Portuguesa', topicos: ['Crase'] });
  assert.equal(g.status, 200);
});

test('radar de lei: verifica normas com a IA, registra mudanças posteriores à revisão e permite resolver', async () => {
  const { LAWS } = await import('../lib/laws.js');
  const key = 'DL2848/1940'; assert.ok(LAWS[key], 'Código Penal está no índice');
  assert.deepEqual((await client()('GET', 'law-radar')).data.flags, {}, 'sem verificação, nenhum alerta');
  const seen = [];
  globalThis.__MEMORY_FAKE_SEARCH = async (body) => {
    assert.equal(body.tools[0].name, 'web_search'); const txt = body.messages[0].content; seen.push(txt);
    const isCP = txt.includes('Código Penal');
    return { content: [{ type: 'text', text: 'Resultado: ' + JSON.stringify(isCP
      ? { alterada: true, mudancas: [{ norma: 'Lei 99.999/2099', data: day(0), resumo: 'Mudou a pena do furto', artigos: ['art. 155'] }, { norma: 'Lei antiga', data: '2001-01-01', resumo: 'antes da revisão' }, { norma: 'Sem data' }] }
      : { alterada: false, mudancas: [] }) }] };
  };
  const adm = client(); await adm('POST', 'auth/login', { email: 'chefe@ex.com', password: 'memoria-forte-c' });
  assert.equal((await client()('POST', 'admin/law-radar/refresh', {})).status, 401, 'só administração');
  const r = await adm('POST', 'admin/law-radar/refresh', { keys: [key, 'CF/1988'] });
  assert.equal(r.status, 200); assert.equal(r.data.checked, 2); assert.equal(seen.length, 2);
  const pub = await client()('GET', 'law-radar'); assert.equal(pub.status, 200);
  assert.ok(pub.data.flags[key], 'Código Penal com alerta'); assert.equal(pub.data.flags[key].mudancas.length, 1, 'só a mudança válida e posterior à revisão');
  assert.equal(pub.data.flags[key].mudancas[0].artigos[0], 'art. 155'); assert.ok(!pub.data.flags['CF/1988'], 'sem mudança, sem alerta');
  // Rodada automática: não repete norma verificada há menos de 30 dias
  seen.length = 0; const again = await adm('POST', 'admin/law-radar/refresh', { keys: [key] }); assert.equal(again.data.checked, 0); assert.equal(seen.length, 0);
  const panel = await adm('GET', 'admin/law-radar'); assert.equal(panel.status, 200); assert.ok(panel.data.total > 50); assert.equal(panel.data.flags[key].status, 'aberto');
  assert.equal((await adm('POST', 'admin/law-radar/' + encodeURIComponent(key) + '/resolve', {})).status, 200);
  assert.ok(!(await client()('GET', 'law-radar')).data.flags[key], 'resolvido some do app');
  delete globalThis.__MEMORY_FAKE_SEARCH;
});

test('saúde do app: erros agrupados sem dados pessoais e contagens anônimas de uso', async () => {
  const anon = client();
  for (let i = 0; i < 3; i++) assert.equal((await anon('POST', 'client-errors', { msg: 'TypeError: x is undefined', src: 'https://memory.app/index.html?v=1#a', line: 42, ver: '7.3', tab: 'home', ua: 'Android 14 Chrome/130' })).status, 200);
  await anon('POST', 'client-errors', { msg: '' });
  const u = await anon('POST', 'usage', { ev: { open: 2, cycle_done: 1, 'hack; DROP': 5, 'aula_read:x': 1, plan_create: -3, answer: 9999 } });
  assert.equal(u.status, 200); assert.equal(u.data.n, 4, 'só eventos da lista e contagens válidas');
  assert.equal((await anon('GET', 'admin/health')).status, 401);
  const adm = client(); await adm('POST', 'auth/login', { email: 'chefe@ex.com', password: 'memoria-forte-c' });
  const h = await adm('GET', 'admin/health'); assert.equal(h.status, 200);
  const e = h.data.errors.find((x) => x.msg.startsWith('TypeError')); assert.ok(e); assert.equal(e.n, 3, 'agrupado por impressão digital'); assert.equal(e.src, 'https://memory.app/index.html', 'sem query nem hash');
  const ev = Object.fromEntries(h.data.usage.map((x) => [x.ev, x.n])); assert.equal(ev.open, 2); assert.equal(ev.answer, 500, 'teto por envio'); assert.ok(!ev['hack; DROP']);
});
