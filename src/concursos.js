/* ================= Concursos abertos e plano de estudo por edital =================
   Lista: data/concursos.json publicado com o app (pesquisado e conferido) ou a versão atualizada pelo servidor.
   "Estudar para este concurso": monta o plano com as matérias do edital. Matérias que o Memory já tem viram as
   trilhas prontas; as outras são geradas pela IA (aulas + questões no formato do app) e salvas como trilhas próprias. */
const CC = { list: null, updated: null, loading: false, err: '', more: 20 };
const UF_NAMES = { BR: 'Nacional', AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
const ESC_L = { fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior' };
const brl = (v) => (v == null ? '—' : 'R$ ' + Math.round(v).toLocaleString('pt-BR'));
const dmy = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—');
const daysTo = (d) => Math.round((new Date(d + 'T23:59:59-03:00').getTime() - Date.now()) / 864e5);

async function loadJSONData(path) {
  if (window.__INLINE && window.__INLINE[path]) return window.__INLINE[path];
  const r = await fetch('data/' + path, { cache: 'no-cache' }); if (!r.ok) throw new Error('http ' + r.status); return r.json();
}
async function loadConcursos(force) {
  if (CC.loading || (CC.list && !force)) return; CC.loading = true; CC.err = '';
  let d = null;
  if (API && API.on && API.db) { try { const r = await fetch('/api/concursos'); if (r.ok) d = await r.json(); } catch (e) { /* usa a lista publicada */ } }
  if (!d) { try { d = await loadJSONData('concursos.json'); } catch (e) { CC.err = 'Não foi possível carregar os concursos agora. Confira sua conexão.'; } }
  if (d) { const today = dayKey(); CC.list = (d.items || []).filter((c) => c.inscricoes && c.inscricoes.fim >= today); CC.updated = d.updated || null; }
  CC.loading = false; if (ui.tab === 'concursos' || ui.tab === 'concurso' || ui.tab === 'home') rerender();
}
function ccFiltered() {
  const f = ui.cf || {}; const k = norm(f.q || '').trim(); const uf = f.uf ?? (S.user.uf || '');
  let L = (CC.list || []).filter((c) => (!uf || c.uf === uf || (f.nac !== false && c.uf === 'BR')) && (!f.esc || c.escolaridade.includes(f.esc)) && (!f.esf || c.esfera === f.esf)
    && (!k || norm([c.orgao, c.sigla, c.titulo, c.local, c.banca, c.area, ...(c.cargos || []).map((x) => x.nome)].join(' ')).includes(k)));
  const s = f.sort || 'prazo';
  L = L.slice().sort((a, b) => (s === 'salario' ? (b.salario || 0) - (a.salario || 0) : s === 'vagas' ? (b.vagas || 0) - (a.vagas || 0) : a.inscricoes.fim.localeCompare(b.inscricoes.fim)));
  return L;
}
function ccMono(c) {
  const pal = ['c-blue', 'c-peach', 'c-mint', 'c-lilac', 'c-yellow']; let h = 0; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const t = (c.sigla || c.orgao.split(/\s+/).filter((w) => w.length > 2).map((w) => w[0]).join('')).replace(/[^A-Za-zÀ-ú0-9-]/g, '').slice(0, 6).toUpperCase();
  return `<span class="tile cc-mono ${pal[h % pal.length]}" aria-hidden="true">${esc(t || '•')}</span>`;
}
function ccDeadline(c) {
  if (c.status === 'em breve') return `<span class="cc-dl soon">Abre ${dmy(c.inscricoes.inicio)}</span>`;
  const d = daysTo(c.inscricoes.fim);
  return `<span class="cc-dl ${d <= 5 ? 'urgent' : ''}">${d <= 0 ? 'Último dia' : d === 1 ? 'Termina amanhã' : 'Até ' + dmy(c.inscricoes.fim).slice(0, 5) + ' · ' + d + ' dias'}</span>`;
}
function ccCard(c) {
  const planned = S.user.plan && S.user.plan.cid === c.id;
  return `<button class="cc-card${planned ? ' planned' : ''}" data-act="cc-open" data-id="${esc(c.id)}">
    <div class="cc-top">${ccMono(c)}<div class="main"><b>${esc(c.titulo)}</b><span>${esc(c.orgao)}</span></div>${planned ? '<span class="tag c-mint">Seu plano</span>' : ''}</div>
    <div class="cc-meta"><span class="chip-s">${ico('map')} ${esc(c.uf === 'BR' ? 'Nacional' : c.uf)}</span>${c.banca ? `<span class="chip-s">${esc(c.banca)}</span>` : ''}<span class="chip-s">${c.escolaridade.map((e) => ESC_L[e]).join(' · ')}</span></div>
    <div class="cc-nums"><div><b class="num">${c.vagas == null ? '—' : c.vagas ? c.vagas.toLocaleString('pt-BR') : 'CR'}</b><span>vagas</span></div><div><b class="num">${brl(c.salario)}</b><span>salário até</span></div>${ccDeadline(c)}</div>
  </button>`;
}
function viewConcursos() {
  if (!CC.list && !CC.loading) setTimeout(() => loadConcursos(), 0);
  const f = ui.cf || {}; const uf = f.uf ?? (S.user.uf || '');
  const ufOpts = ['', ...Object.keys(UF_NAMES).filter((k) => k !== 'BR')].map((k) => `<option value="${k}" ${k === uf ? 'selected' : ''}>${k ? UF_NAMES[k] : 'Todo o Brasil'}</option>`).join('');
  const chip = (key, val, label) => `<button class="fchip" data-act="cc-f" data-k="${key}" data-v="${val}" aria-pressed="${(f[key] || '') === val}">${label}</button>`;
  const plan = S.user.plan ? planBanner() : '';
  let body;
  if (CC.err && !CC.list) body = `<div class="notice err">${esc(CC.err)}</div>`;
  else if (!CC.list) body = '<div class="skel" style="height:150px"></div><div class="skel" style="height:150px"></div><div class="skel" style="height:150px"></div>';
  else {
    const L = ccFiltered(); const shown = L.slice(0, CC.more);
    body = L.length ? `<p class="tiny cc-count">${L.length} ${L.length === 1 ? 'concurso' : 'concursos'}${uf ? ' em ' + esc(UF_NAMES[uf]) + ' e nacionais' : ' no Brasil'} · atualizado em ${dmy(CC.updated)}</p><div class="cc-list">${shown.map(ccCard).join('')}</div>${L.length > shown.length ? `<button class="btn btn-ghost btn-block" data-act="cc-more">Ver mais ${L.length - shown.length}</button>` : ''}`
      : `<div class="empty-illo">${illo('concursos')}<b>Nenhum concurso com esses filtros</b><span>Tente outro estado ou limpe a busca.</span></div>`;
  }
  return `<div class="cc-hero"><img src="img/concursos-hero-640.webp" srcset="img/concursos-hero-640.webp 640w, img/concursos-hero-1280.webp 1280w" sizes="(max-width: 480px) 100vw, 480px" alt="" decoding="async" fetchpriority="high">
    <div class="cc-hero-t"><small>${CC.list ? CC.list.length + ' com inscrições abertas ou em breve' : 'Concursos públicos'}</small><h1>Concursos abertos</h1><p>Escolha o seu e o Memory monta o plano com as matérias do edital.</p></div></div>
    <div class="page" style="padding-top:16px">
    ${plan}
    <div class="cc-filters">
      <label class="search">${ico('search')}<input id="cc-q" placeholder="Buscar órgão ou cargo" value="${esc(f.q || '')}" autocomplete="off" aria-label="Buscar concurso"></label>
      <label class="cc-uf">${ico('map')}<select id="cc-uf" aria-label="Estado">${ufOpts}</select></label>
    </div>
    <div class="chips" role="group" aria-label="Nível">${chip('esc', '', 'Todos os níveis')}${chip('esc', 'medio', 'Médio')}${chip('esc', 'superior', 'Superior')}${chip('esc', 'fundamental', 'Fundamental')}</div>
    <div class="chips" role="group" aria-label="Ordenar">${chip('sort', '', 'Prazo mais próximo')}${chip('sort', 'salario', 'Maior salário')}${chip('sort', 'vagas', 'Mais vagas')}</div>
    ${body}
    <p class="tiny" style="text-align:center">Informações conferidas nas fontes indicadas em cada concurso. Antes de se inscrever, confira sempre o edital oficial.</p>
  </div>`;
}
document.addEventListener('input', (e) => {
  if (e.target.id === 'cc-q') { ui.cf = Object.assign({}, ui.cf, { q: e.target.value }); CC.more = 20; const box = document.querySelector('.cc-list'); const cnt = document.querySelector('.cc-count'); if (box) { const L = ccFiltered(); box.innerHTML = L.slice(0, CC.more).map(ccCard).join(''); if (cnt) cnt.textContent = L.length + (L.length === 1 ? ' concurso' : ' concursos'); } else rerender(); }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'cc-uf') { ui.cf = Object.assign({}, ui.cf, { uf: e.target.value }); S.user.uf = e.target.value || undefined; if (!S.user.uf) delete S.user.uf; persist(); CC.more = 20; rerender(); }
});

function viewConcurso() {
  const c = (CC.list || []).find((x) => x.id === ui.cid);
  if (!c) { if (!CC.list) { setTimeout(() => loadConcursos(), 0); return '<div class="page"><div class="skel" style="height:300px"></div></div>'; } ui.tab = 'concursos'; return viewConcursos(); }
  const planned = S.user.plan && S.user.plan.cid === c.id;
  const subj = c.disciplinas.map((x) => { const dk = subjectDeck(x.nome); return `<div class="item noicon cc-subj"><div class="main"><b>${esc(x.nome)}</b><span>${x.topicos.length ? esc(x.topicos.slice(0, 4).join(' · ')) + (x.topicos.length > 4 ? '…' : '') : 'Conteúdo conforme o edital'}</span></div>${dk ? '<span class="tag c-mint">Trilha pronta</span>' : '<span class="tag c-lilac">Gerada pela IA</span>'}</div>`; }).join('');
  const ready = c.disciplinas.filter((x) => subjectDeck(x.nome)).length;
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="concursos" aria-label="Voltar">${ico('back')}</button>${c.edital ? `<a class="icon-btn" href="${esc(c.edital)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir edital oficial">${ico('external')}</a>` : ''}</div>
    <div class="cc-head">${ccMono(c)}<div><span class="tag ${c.status === 'em breve' ? 'c-yellow' : 'c-mint'}">${c.status === 'em breve' ? 'Inscrições em breve' : 'Inscrições abertas'}</span><h1>${esc(c.titulo)}</h1><p class="muted small">${esc(c.orgao)}${c.local ? ' · ' + esc(c.local) : ''}</p></div></div>
    <div class="kgrid cc-k"><div class="kcard"><span class="num">${c.vagas == null ? '—' : c.vagas || 'CR'}</span><small>vagas${c.cr ? ' + cadastro reserva' : ''}</small></div><div class="kcard"><span class="num">${brl(c.salario)}</span><small>salário até</small></div>
      <div class="kcard"><span class="num">${dmy(c.inscricoes.fim).slice(0, 5)}</span><small>fim das inscrições</small></div><div class="kcard"><span class="num">${c.prova ? dmy(c.prova).slice(0, 5) : 'A definir'}</span><small>prova${c.prova ? ' · ' + Math.max(0, daysTo(c.prova)) + ' dias' : ''}</small></div></div>
    <div class="list"><div class="item noicon"><div class="main"><b>Banca</b></div><span class="end">${esc(c.banca || '—')}</span></div><div class="item noicon"><div class="main"><b>Escolaridade</b></div><span class="end">${c.escolaridade.map((e) => ESC_L[e]).join(', ')}</span></div>${c.taxa != null ? `<div class="item noicon"><div class="main"><b>Taxa de inscrição</b></div><span class="end">R$ ${c.taxa.toFixed(2).replace('.', ',')}</span></div>` : ''}<div class="item noicon"><div class="main"><b>Inscrições</b></div><span class="end">${dmy(c.inscricoes.inicio)} a ${dmy(c.inscricoes.fim)}</span></div></div>
    ${c.cargos && c.cargos.length ? `<div class="blk"><div class="sec"><h2>Cargos</h2></div><div class="list">${c.cargos.map((x) => `<div class="item noicon"><div class="main"><b>${esc(x.nome)}</b><span>${[x.escolaridade ? ESC_L[x.escolaridade] || x.escolaridade : '', x.vagas != null ? x.vagas + ' vagas' : '', x.salario ? brl(x.salario) : ''].filter(Boolean).join(' · ')}</span></div></div>`).join('')}</div></div>` : ''}
    <div class="blk"><div class="sec"><h2>O que cai</h2><span class="tiny num">${ready}/${c.disciplinas.length} prontas</span></div><div class="list">${subj}</div></div>
    <div class="callout" style="background:var(--t-blue)"><span class="tile" style="background:var(--navy);color:#fff">${ico('build')}</span><div><b>Como funciona</b><p>O Memory cria um plano até a prova: as matérias que já existem entram como trilhas prontas, e a IA gera aulas e questões no estilo da banca para as demais.</p></div></div>
    <button class="btn btn-orange btn-block" data-act="${planned ? 'plan-open' : 'cc-study'}" data-id="${esc(c.id)}">${planned ? 'Abrir meu plano' : 'Estudar para este concurso'}</button>
    <div class="duo">${c.edital ? `<a class="btn btn-soft" href="${esc(c.edital)}" target="_blank" rel="noopener noreferrer">Edital oficial</a>` : ''}${c.fonte && c.fonte !== c.edital ? `<a class="btn btn-ghost" href="${esc(c.fonte)}" target="_blank" rel="noopener noreferrer">Fonte</a>` : ''}</div>
    <p class="tiny">Dados coletados em ${dmy(CC.updated)}. Datas e números podem mudar por retificação: confira sempre o edital oficial.</p>
  </div>`;
}

/* ---------- Plano de estudo ---------- */
const SUBJECT_MAP = [[/l[ií]ngua portuguesa|portugu[eê]s|reda[cç][aã]o oficial|interpreta[cç][aã]o de texto/i, 'port'], [/racioc[ií]nio|l[oó]gica|rlm/i, 'logica'], [/inform[aá]tica|no[cç][oõ]es de computa|tecnologia da informa/i, 'info'],
  [/direito constitucional|constitucional/i, 'dconst'], [/direito administrativo|administrativo/i, 'dadm'], [/^matem[aá]tica|matem[aá]tica (b[aá]sica|financeira|e)/i, 'mat'], [/lgpd|prote[cç][aã]o de dados/i, 'lgpd'],
  [/seguran[cç]a da informa/i, 'seg'], [/hist[oó]ria do brasil/i, 'hist'], [/^biologia/i, 'bio'], [/excel|planilha/i, 'excel']];
function subjectDeck(nome) { for (const [re, id] of SUBJECT_MAP) if (re.test(nome)) return id; return null; }
const planDeckId = (cid, i) => ('uc_' + cid.replace(/[^a-z0-9]/g, '_').slice(0, 30) + '_' + i);
function planBanner() {
  const p = S.user.plan; const ready = p.subjects.filter((x) => x.deck && deckById(x.deck)).length;
  return `<button class="plan-banner" data-act="plan-open"><span class="tile c-navy" style="background:var(--navy);color:#fff">${ico('target')}</span><div class="main"><small>Seu plano</small><b>${esc(p.sigla ? p.sigla + ' · ' : '')}${esc(p.titulo)}</b><span>${p.prova ? (daysTo(p.prova) > 0 ? 'Prova em ' + daysTo(p.prova) + ' dias' : 'Prova hoje') : 'Data da prova a definir'} · ${ready}/${p.subjects.length} matérias prontas</span></div>${chev()}</button>`;
}
function ccPromo() {
  if (S.user.persona !== 'concurso' && S.user.persona !== null && S.user.persona !== undefined && S.user.persona !== 'faculdade') return '';
  if (!CC.list && !CC.loading) setTimeout(() => loadConcursos(), 0);
  const n = CC.list ? CC.list.filter((c) => !S.user.uf || c.uf === S.user.uf || c.uf === 'BR').length : null;
  return `<button class="plan-banner promo-cc" data-act="tab" data-tab="concursos"><span class="tile c-blue">${ico('concursos')}</span><div class="main"><small>Concursos abertos</small><b>${n == null ? 'Escolha seu concurso' : n + (n === 1 ? ' concurso aberto' : ' concursos abertos') + (S.user.uf ? ' para você' : ' no Brasil')}</b><span>O Memory monta o plano com as matérias do edital</span></div>${chev()}</button>`;
}
function planCreate(c) {
  const subjects = c.disciplinas.map((x, i) => ({ nome: x.nome, topicos: x.topicos.slice(0, 12), deck: subjectDeck(x.nome) || (deckById(planDeckId(c.id, i)) ? planDeckId(c.id, i) : null) }));
  S.user.plan = { cid: c.id, titulo: c.titulo, orgao: c.orgao, sigla: c.sigla || '', banca: c.banca || '', uf: c.uf, prova: c.prova || null, at: Date.now(), subjects };
  if (c.prova) S.user.exam = { name: (c.sigla || c.orgao).slice(0, 40), date: c.prova };
  S.user.persona = 'concurso'; persist(); reindex();
}
const GEN = {};
async function genSubject(i) {
  const p = S.user.plan; if (!p) return; const sj = p.subjects[i]; if (!sj || sj.deck || GEN[i] === 'run') return;
  if (!aiReady()) { if (aiNeedsLogin()) return openAuth('signup', { note: 'Crie sua conta para gerar o material com IA.', after: () => genSubject(i) }); GEN[i] = 'A geração com IA precisa do servidor com a chave da IA ligada (ou do app aberto no Claude).'; return rerender(); }
  GEN[i] = 'run'; rerender();
  const ce = /cebraspe|cespe/i.test(p.banca);
  try {
    let obj;
    if (SAMPLE) obj = await SAMPLE.json(SH.disciplinePrompt({ concurso: (p.sigla ? p.sigla + ' — ' : '') + p.titulo, cargo: p.titulo, banca: p.banca, disciplina: sj.nome, topicos: sj.topicos, nAulas: 4, nQ: 12, ce }), { modelTier: 'default', cache: false });
    else obj = SH.extractJsonObject(await aiStream('discipline', { concurso: (p.sigla ? p.sigla + ' — ' : '') + p.titulo, cargo: p.titulo, banca: p.banca, disciplina: sj.nome, topicos: sj.topicos }));
    if (!obj) throw { code: 'invalid_json' };
    const id = planDeckId(p.cid, i);
    const deck = SH.sanitizeDeck({ id, title: sj.nome.slice(0, 60), subtitle: (p.sigla || p.orgao).slice(0, 60), blurb: `Material gerado para ${p.titulo} (${p.banca || 'banca do edital'}): aulas e questões no estilo da prova.`, tag: 'Concursos', color: 'navy', source: 'Plano ' + (p.sigla || p.orgao), questions: obj.questoes || obj.questions || [], lessons: obj.aulas || obj.lessons || [] }, { id, renumber: true });
    if (!deck) throw { code: 'invalid_json' };
    deck.lessons.forEach((l) => { l.qids = deck.questions.filter((q) => l.title && norm(q.topic).split(' ').some((w) => w.length > 3 && norm(l.title).includes(w))).slice(0, 6).map((q) => q.id); });
    const old = CUSTOM.findIndex((d) => d.id === id); if (old >= 0) CUSTOM.splice(old, 1);
    addDeck(deck); sj.deck = id; persist(); delete GEN[i];
    notify(`${sj.nome}: ${deck.lessons.length} aulas e ${deck.questions.length} questões prontas`);
  } catch (e) { GEN[i] = aiError(e, 'Não foi possível gerar agora. Tente de novo.'); }
  rerender();
}
async function genAll() { const p = S.user.plan; if (!p) return; for (let i = 0; i < p.subjects.length; i++) if (!p.subjects[i].deck && S.user.plan === p) { await genSubject(i); if (typeof GEN[i] === 'string' && GEN[i] !== 'run') break; } }
function viewPlano() {
  const p = S.user.plan; if (!p) { ui.tab = 'concursos'; return viewConcursos(); }
  const dleft = p.prova ? daysTo(p.prova) : null;
  const decks = p.subjects.map((x) => x.deck && deckById(x.deck)).filter(Boolean);
  const totalQ = decks.reduce((a, d) => a + d.questions.length, 0); const seen = decks.reduce((a, d) => a + d.questions.filter((q) => S.cards[q.id] && S.cards[q.id].s).length, 0);
  const perDay = dleft && dleft > 0 ? Math.max(5, Math.ceil(((totalQ - seen) * 1.6) / Math.max(1, dleft - 3))) : S.user.goal;
  const pending = p.subjects.filter((x) => !x.deck).length;
  const rows = p.subjects.map((x, i) => {
    const d = x.deck && deckById(x.deck); const g = GEN[i];
    if (d) { const st = d.questions.filter((q) => S.cards[q.id] && S.cards[q.id].s).length; const pct = Math.round((st / d.questions.length) * 100); return `<button class="item" data-act="open-deck" data-id="${esc(d.id)}"><span class="tile ${pct >= 100 ? 'c-mint' : d.custom ? 'c-lilac' : 'c-blue'}">${ico(pct >= 100 ? 'check' : 'book')}</span><div class="main"><b>${esc(x.nome)}</b><span>${d.custom ? 'Gerada para o seu edital' : 'Trilha pronta'} · ${st}/${d.questions.length} estudadas</span><div class="bar"><i class="o" style="width:${pct}%"></i></div></div>${chev()}</button>`; }
    return `<div class="item gen ${g === 'run' ? 'running' : ''}"><span class="tile c-lilac">${ico(g === 'run' ? 'refresh' : 'build')}</span><div class="main"><b>${esc(x.nome)}</b><span>${g === 'run' ? 'Gerando aulas e questões… leva cerca de 1 minuto' : g ? esc(g) : x.topicos.length ? esc(x.topicos.slice(0, 3).join(' · ')) : 'Conteúdo do edital'}</span></div>${g === 'run' ? '<span class="spin sm"></span>' : `<button class="btn btn-soft btn-sm" data-act="plan-gen" data-i="${i}">Gerar</button>`}</div>`;
  }).join('');
  return `<div class="page">
    <div class="sec" style="padding-top:6px"><button class="icon-btn" data-act="tab" data-tab="concursos" aria-label="Voltar">${ico('back')}</button><button class="btn btn-text btn-sm" data-act="plan-end">Encerrar plano</button></div>
    <div class="plan-hero"><small>Plano de estudo</small><h1>${esc(p.sigla ? p.sigla + ' · ' : '')}${esc(p.titulo)}</h1><p>${esc(p.orgao)}${p.banca ? ' · banca ' + esc(p.banca) : ''}</p>
      <div class="ph-nums"><div><b class="num">${dleft == null ? '—' : Math.max(0, dleft)}</b><span>dias até a prova</span></div><div><b class="num">${perDay}</b><span>questões por dia</span></div><div><b class="num">${totalQ ? Math.round((seen / totalQ) * 100) : 0}%</b><span>do material visto</span></div></div></div>
    ${pending ? `<div class="callout" style="background:var(--t-lilac)"><span class="tile" style="background:var(--navy);color:#fff">${ico('build')}</span><div><b>${pending} ${pending === 1 ? 'matéria precisa' : 'matérias precisam'} de material</b><p>A IA cria 4 aulas e 12 questões no estilo ${esc(p.banca || 'da banca')} para cada uma, a partir do conteúdo do edital.</p></div></div>
      <button class="btn btn-orange btn-block" data-act="plan-gen-all" ${Object.values(GEN).includes('run') ? 'disabled' : ''}>Gerar todas as matérias</button>` : ''}
    <div class="blk"><div class="sec"><h2>Matérias do edital</h2><span class="tiny num">${p.subjects.length - pending}/${p.subjects.length} prontas</span></div><div class="list">${rows}</div></div>
    ${decks.length ? `<button class="btn btn-primary btn-block" data-act="plan-study">Estudar agora · ${Math.min(perDay, 15)} questões</button>` : ''}
  </div>`;
}
Object.assign(ACT, {
  'cc-open': (d) => { ui.cid = d.id; ui.tab = 'concurso'; render(); $('#view').scrollTop = 0; },
  'cc-f': (d) => { ui.cf = Object.assign({}, ui.cf, { [d.k]: d.v }); CC.more = 20; rerender(); },
  'cc-more': () => { CC.more += 20; rerender(); },
  'cc-study': (d) => { const c = (CC.list || []).find((x) => x.id === d.id); if (!c) return; if (S.user.plan && S.user.plan.cid !== c.id && !ui.planSwap) { ui.planSwap = c.id; ui.sheet = `<div class="blk" style="gap:12px"><h2>Trocar de plano?</h2><p class="muted small">Seu plano atual (${esc(S.user.plan.titulo)}) será substituído. As trilhas já geradas continuam salvas.</p><button class="btn btn-orange btn-block" data-act="cc-study" data-id="${esc(c.id)}">Trocar para ${esc(c.sigla || c.orgao)}</button><button class="btn btn-text btn-block" data-act="sheet-close">Cancelar</button></div>`; return renderSheet(); }
    ui.planSwap = null; ui.sheet = null; renderSheet(); planCreate(c); ui.tab = 'plano'; render(); $('#view').scrollTop = 0; notify('Plano criado. As matérias prontas já estão no seu Início.'); },
  'plan-open': () => { ui.tab = 'plano'; render(); $('#view').scrollTop = 0; },
  'plan-gen': (d) => genSubject(Number(d.i)),
  'plan-gen-all': () => genAll(),
  'plan-study': () => { const p = S.user.plan; const ids = p.subjects.map((x) => x.deck).filter((id) => id && deckById(id)); if (ids.length) startCycle({ decks: ids, size: 15, title: p.sigla || 'Plano' }); },
  'plan-end': () => { ui.sheet = `<div class="blk" style="gap:12px"><h2>Encerrar o plano?</h2><p class="muted small">O plano sai do Início. Seu progresso e as trilhas geradas continuam salvos.</p><button class="btn btn-danger btn-block" data-act="plan-end-ok">Encerrar plano</button><button class="btn btn-text btn-block" data-act="sheet-close">Cancelar</button></div>`; renderSheet(); },
  'plan-end-ok': () => { delete S.user.plan; persist(); ui.sheet = null; renderSheet(); ui.tab = 'concursos'; render(); }
});
