// Valida arquivos de conteúdo do Memory: node dev/validate-content.mjs content/*.json
import fs from 'node:fs';
const PAT = ['inversao', 'generalizacao', 'restricao', 'extrapolacao', 'troca', 'calculo'];
let bad = 0;
for (const f of process.argv.slice(2)) {
  const errs = [];
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(f, 'JSON inválido:', e.message); bad++; continue; }
  if (!/^[a-z]{2,10}$/.test(d.id || '')) errs.push('id da trilha inválido');
  const qs = d.questions || []; const pos = [0, 0, 0, 0]; const ce = [0, 0]; const ids = new Set();
  qs.forEach((q, i) => {
    const w = (m) => errs.push(`questão ${i + 1} (${q.id}): ${m}`);
    if (!new RegExp('^' + d.id + '\\d+$').test(q.id || '')) w('id deve ser ' + d.id + '<n>');
    if (ids.has(q.id)) w('id repetido'); ids.add(q.id);
    for (const k of ['topic', 'c', 'q', 'src']) if (typeof q[k] !== 'string' || !q[k].trim()) w('faltou ' + k);
    if ((q.topic || '').split(/\s+/).length > 4) w('topic com mais de 4 palavras');
    if (q.type === 'ce') {
      if (!Array.isArray(q.o) || q.o.length !== 2 || q.o[0].t !== 'Certo' || q.o[1].t !== 'Errado') { w('Certo/Errado: o = [{t:"Certo"}, {t:"Errado"}]'); return; }
      if (q.a !== 0 && q.a !== 1) w('Certo/Errado: "a" deve ser 0 (Certo) ou 1 (Errado)');
      if (!q.o[q.a] || q.o[q.a].p !== 'correta') w('"a" não aponta para a correta');
      const wp = q.o[1 - q.a] && q.o[1 - q.a].p; if (!PAT.includes(wp)) w('Certo/Errado: o julgamento errado precisa de um padrão válido');
      if (!/[.]$/.test(q.q.trim())) w('Certo/Errado: o item (q) deve ser uma afirmação terminada em ponto');
      q.o.forEach((o, j) => { if (!o.w || o.w.length < 20) w(`explicação ${j + 1} curta demais`); });
      ce[q.a]++; return;
    }
    if (q.type) w('type desconhecido: ' + q.type);
    if (!Array.isArray(q.o) || q.o.length !== 4) { w('precisa de 4 alternativas'); return; }
    const corr = q.o.filter((o) => o.p === 'correta').length; if (corr !== 1) w('precisa de exatamente 1 correta');
    if (!Number.isInteger(q.a) || !q.o[q.a] || q.o[q.a].p !== 'correta') w('"a" não aponta para a correta');
    const wrong = q.o.filter((o) => o.p !== 'correta').map((o) => o.p);
    if (wrong.some((p) => !PAT.includes(p))) w('padrão inválido: ' + wrong.join(','));
    if (new Set(wrong).size !== wrong.length) w('padrões repetidos nas erradas');
    q.o.forEach((o, j) => { if (!o.t || o.t.length > 160) w(`alternativa ${j + 1} vazia ou com mais de 160 caracteres`); if (!o.w || o.w.length < 20) w(`explicação ${j + 1} curta demais`); });
    if (Number.isInteger(q.a)) pos[q.a]++;
  });
  const mc = pos.reduce((a, b) => a + b, 0);
  if (mc >= 8 && pos.some((n) => n < Math.max(2, Math.floor(mc / 8)))) errs.push('distribuição da correta por posição: ' + pos.join('/'));
  if (ce[0] + ce[1] >= 6 && Math.min(ce[0], ce[1]) < (ce[0] + ce[1]) * 0.35) errs.push('Certo/Errado desequilibrado: ' + ce.join(' certos / ') + ' errados');
  // Também confere ids repetidos entre arquivos da mesma trilha.
  for (const g of fs.readdirSync('content').filter((x) => x.startsWith(d.id + '.') && x.endsWith('.json'))) {
    if (('content/' + g) === f || f.endsWith('/' + g)) continue;
    try { for (const q of JSON.parse(fs.readFileSync('content/' + g, 'utf8')).questions || []) if (ids.has(q.id)) errs.push('id ' + q.id + ' já existe em ' + g); } catch (e) { /* outro arquivo inválido */ }
  }
  console.log(errs.length ? `✗ ${f}\n  ` + errs.join('\n  ') : `✓ ${f} · ${qs.length} questões · posições ${pos.join('/')}${ce[0] + ce[1] ? ' · C/E ' + ce.join('/') : ''}`);
  if (errs.length) bad++;
}
process.exit(bad ? 1 : 0);
