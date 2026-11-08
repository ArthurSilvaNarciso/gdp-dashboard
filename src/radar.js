/* ================= Radar de lei =================
   Cada questão sabe quais normas cita (data/laws.json, gerado das fontes). Cada trilha tem a data da última revisão
   independente. O servidor verifica periodicamente se essas normas mudaram (com a IA pesquisando fontes oficiais);
   quando uma norma muda DEPOIS da revisão da trilha, as questões que a citam mostram um aviso até serem revisadas. */
const RADAR = { ix: null, flags: {}, loading: false, asked: false };
function radarLoad() {
  if (RADAR.ix || RADAR.loading) return; RADAR.loading = true;
  loadJSONData('laws.json').then((x) => { RADAR.ix = x; }).catch(() => { RADAR.ix = { q: {}, n: {}, reviewed: {} }; })
    .finally(() => { RADAR.loading = false; if (ui.tab === 'trilhas' && ui.deck) rerender(); });
  if (!RADAR.asked && API && API.on) { RADAR.asked = true; api('GET', 'law-radar').then((x) => { RADAR.flags = (x && x.flags) || {}; if (ui.tab === 'trilhas' && ui.deck) rerender(); }).catch(() => {}); }
}
const fmtMonth = (d) => { const [y, m] = String(d).split('-'); return ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(m) - 1] + '/' + y; };
const fmtDay = (d) => String(d).split('-').reverse().join('/');
// Mudanças de uma norma publicadas depois da revisão da trilha.
function lawChangesAfter(key, reviewed) {
  const f = RADAR.flags[key]; if (!f || !f.mudancas) return [];
  return f.mudancas.filter((m) => m.data && (!reviewed || m.data > reviewed));
}
function qLawAlerts(qid) {
  if (!RADAR.ix) return []; const x = QINDEX[qid]; if (!x) return [];
  const rev = RADAR.ix.reviewed[x.deck.id]; const keys = RADAR.ix.q[qid] || [];
  return keys.map((k) => ({ k, n: RADAR.ix.n[k] || k, ch: lawChangesAfter(k, rev) })).filter((a) => a.ch.length);
}
function qLawAlertHTML(qid) {
  const A = qLawAlerts(qid); if (!A.length) return '';
  const a = A[0], m = a.ch[a.ch.length - 1];
  return `<div class="callout law-alert" role="note"><span class="tile c-peach">${ico('warn')}</span><div><b>${esc(a.n)} mudou em ${fmtDay(m.data)}</b><p>${esc(m.norma || '')}${m.resumo ? ': ' + esc(m.resumo) : ''}. Esta questão está em revisão; confira o texto atualizado antes da prova.</p></div></div>`;
}
function deckReviewHTML(d) {
  radarLoad(); if (!RADAR.ix || d.custom || d.classDeck) return '';
  const rev = RADAR.ix.reviewed[d.id]; if (!rev) return '';
  const keys = new Set(); for (const q of d.questions) for (const k of RADAR.ix.q[q.id] || []) keys.add(k);
  const changed = [...keys].filter((k) => lawChangesAfter(k, rev).length);
  const affected = changed.length ? d.questions.filter((q) => (RADAR.ix.q[q.id] || []).some((k) => changed.includes(k))).length : 0;
  return `<div class="review-badge ${changed.length ? 'warn' : ''}">${ico(changed.length ? 'warn' : 'check')}<span>${changed.length
    ? `${changed.length === 1 ? esc(RADAR.ix.n[changed[0]] || changed[0]) + ' mudou' : changed.length + ' normas mudaram'} depois da revisão · ${affected} ${affected === 1 ? 'questão' : 'questões'} em revisão`
    : `Revisada em ${fmtMonth(rev)} por revisor independente${keys.size ? ' · ' + keys.size + (keys.size === 1 ? ' norma vigente conferida' : ' normas vigentes conferidas') : ''}`}</span></div>`;
}

/* Painel da administração: normas que mudaram depois da revisão, para corrigir as questões e dar baixa. */
const ADML = { d: null, loading: false, at: 0, busy: false };
async function loadAdminLaw() { ADML.loading = true; ADML.at = Date.now(); try { ADML.d = await api('GET', 'admin/law-radar'); } catch (e) { ADML.d = { error: e.message }; } ADML.loading = false; rerender(); }
function adminLawHTML() {
  if (!ADML.loading && (!ADML.d || Date.now() - ADML.at > 60000)) setTimeout(() => loadAdminLaw(), 0);
  if (!ADML.d) return '<div class="skel" style="height:70px"></div>';
  if (ADML.d.error) return `<p class="muted small">${esc(ADML.d.error)}</p>`;
  const F = Object.entries(ADML.d.flags || {}).filter(([, f]) => f.status !== 'resolvido');
  return `<div class="blk"><div class="sec"><h2>Radar de lei</h2><span class="tiny num">${ADML.d.checked}/${ADML.d.total} normas verificadas</span></div>
    <p class="muted small">Todo dia o servidor confere algumas normas citadas nas questões (cada uma a cada 30 dias). ${ADML.d.updated ? 'Última rodada: ' + fmtDay(ADML.d.updated) + '.' : 'Ainda não rodou.'}</p>
    ${F.length ? `<div class="list">${F.map(([k, f]) => `<div class="item" style="display:block"><b>${esc(f.n)}</b><span class="tiny">${f.nq} questões · trilhas: ${esc((f.decks || []).join(', '))}</span>
      <ul class="small">${(f.mudancas || []).map((m) => `<li>${esc(m.norma)} (${fmtDay(m.data)}): ${esc(m.resumo)}${m.artigos && m.artigos.length ? ' · ' + esc(m.artigos.join(', ')) : ''}</li>`).join('')}</ul>
      <button class="btn btn-primary btn-sm" data-act="adm-law-ok" data-k="${esc(k)}">Questões revisadas: dar baixa</button></div>`).join('')}</div>` : '<p class="small">Nenhuma norma mudou depois da última revisão das trilhas.</p>'}
    <button class="btn btn-soft btn-sm btn-block" data-act="adm-law-run" ${ADML.busy ? 'disabled' : ''}>${ADML.busy ? 'Verificando…' : 'Verificar as próximas normas agora'}</button></div>`;
}
Object.assign(ACT, {
  'adm-law-run': async () => { ADML.busy = true; rerender(); try { const r = await api('POST', 'admin/law-radar/refresh', {}); notify(r.skipped ? 'IA desligada no servidor (falta a chave).' : r.checked + ' normas verificadas.'); } catch (e) { notify(e.message); } ADML.busy = false; await loadAdminLaw(); },
  'adm-law-ok': async (d) => { try { await api('POST', 'admin/law-radar/' + encodeURIComponent(d.k) + '/resolve', {}); notify('Baixa registrada.'); } catch (e) { notify(e.message); } await loadAdminLaw(); }
});

/* Painel: saúde do app (erros nos aparelhos e uso anônimo dos últimos 14 dias). */
const ADMH = { d: null, loading: false, at: 0 };
async function loadAdminHealth() { ADMH.loading = true; ADMH.at = Date.now(); try { ADMH.d = await api('GET', 'admin/health'); } catch (e) { ADMH.d = { error: e.message }; } ADMH.loading = false; rerender(); }
const EV_L = { open: 'Aberturas', cycle_start: 'Ciclos iniciados', cycle_done: 'Ciclos concluídos', aula_read: 'Aulas estudadas', aula_audio: 'Aulas ouvidas', plan_create: 'Planos criados', plan_today: 'Planos do dia', weak_attack: 'Ponto fraco atacado', vespera: 'Revisões de véspera', sim_cespe: 'Simulados Cebraspe' };
function adminHealthHTML() {
  if (!ADMH.loading && (!ADMH.d || Date.now() - ADMH.at > 60000)) setTimeout(() => loadAdminHealth(), 0);
  if (!ADMH.d) return '<div class="skel" style="height:70px"></div>'; if (ADMH.d.error) return '';
  const tot = {}; for (const u of ADMH.d.usage || []) tot[u.ev] = (tot[u.ev] || 0) + u.n;
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return `<div class="blk"><div class="sec"><h2>Saúde do app</h2><span class="tiny">últimos 14 dias</span></div>
    ${top.length ? `<div class="kgrid">${top.map(([k, v]) => `<div class="kcard"><b class="num">${cnt(v)}</b><span>${esc(EV_L[k] || k)}</span></div>`).join('')}</div>` : '<p class="small muted">Ainda sem dados de uso.</p>'}
    ${aiUsageHTML(ADMH.d)}
    <div class="sec"><h2 style="font-size:16px">Erros nos aparelhos</h2><span class="tiny num">${(ADMH.d.errors || []).length}</span></div>
    ${(ADMH.d.errors || []).length ? `<div class="list">${ADMH.d.errors.slice(0, 12).map((e) => `<div class="item" style="display:block"><b style="overflow-wrap:anywhere">${esc(e.msg)}</b><span class="tiny">${e.n}× · ${esc(e.src || '')}${e.line ? ':' + e.line : ''} · v${esc(e.ver || '?')} · tela ${esc(e.tab || '?')} · ${esc(e.ua || '')}</span></div>`).join('')}</div>` : '<p class="small">Nenhum erro registrado.</p>'}</div>`;
}

function aiUsageHTML(d) {
  if (!d.aiOn) return '<div class="callout"><span class="tile c-peach">' + ico('warn') + '</span><div><b>IA desligada no servidor</b><p>Falta a variável ANTHROPIC_API_KEY na Vercel. Sem ela, gerar material, tutor e radar de lei não funcionam no site.</p></div></div>';
  const a = d.ai || { calls: 0, models: {} }; const M = Object.entries(a.models || {});
  const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' mi' : Math.round(n / 1000) + ' mil');
  return `<div class="ai-usage"><b>IA neste mês: ${a.calls} ${a.calls === 1 ? 'chamada' : 'chamadas'}</b>${M.map(([m, v]) => `<span class="tiny">${esc(m.replace('claude-', ''))}: ${v.calls}× · ${k(v.in)} tokens de entrada · ${k(v.out)} de saída</span>`).join('')}<span class="tiny muted">Acompanhe o saldo em console.anthropic.com → Billing.</span></div>`;
}
