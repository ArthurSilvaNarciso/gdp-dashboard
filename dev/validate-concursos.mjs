// Valida arquivos de concursos: node dev/validate-concursos.mjs content/concursos/*.json
import fs from 'node:fs';
const UFS = 'BR AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const D = /^\d{4}-\d{2}-\d{2}$/; let bad = 0; const seen = new Set();
for (const f of process.argv.slice(2)) {
  const errs = []; let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log('✗', f, e.message); bad++; continue; }
  (d.items || []).forEach((c, i) => {
    const w = (m) => errs.push(`${i + 1} (${c.id}): ${m}`);
    if (!/^[a-z0-9-]{4,60}$/.test(c.id || '')) w('id inválido'); if (seen.has(c.id)) w('id repetido'); seen.add(c.id);
    for (const k of ['orgao', 'titulo', 'banca', 'edital', 'fonte']) if (!c[k]) w('sem ' + k);
    if (!['federal', 'estadual', 'municipal'].includes(c.esfera)) w('esfera'); if (!UFS.includes(c.uf)) w('uf');
    if (!Array.isArray(c.escolaridade) || !c.escolaridade.length || c.escolaridade.some((x) => !['fundamental', 'medio', 'superior'].includes(x))) w('escolaridade');
    if (c.vagas != null && !(Number.isInteger(c.vagas) && c.vagas >= 0)) w('vagas'); if (c.salario != null && !(c.salario > 0)) w('salario');
    if (!c.inscricoes || !D.test(c.inscricoes.fim || '')) w('inscricoes.fim'); else if (c.inscricoes.fim < '2026-11-04') w('inscrições já encerradas');
    if (c.prova != null && !D.test(c.prova)) w('prova');
    if (!['abertas', 'em breve'].includes(c.status)) w('status');
    if (!/^https?:\/\//.test(c.edital || '') || !/^https?:\/\//.test(c.fonte || '')) w('links');
    if (!Array.isArray(c.disciplinas) || !c.disciplinas.length) w('sem disciplinas'); else for (const x of c.disciplinas) if (!x.nome || !Array.isArray(x.topicos)) w('disciplina inválida');
  });
  if (errs.length) { bad++; console.log('✗', f, '\n  ' + errs.join('\n  ')); } else console.log('✓', f, '·', (d.items || []).length, 'concursos');
}
process.exit(bad ? 1 : 0);
