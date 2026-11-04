// Valida arquivos de aulas: node dev/validate-lessons.mjs content/lessons/*.json
import fs from 'node:fs'; import vm from 'node:vm'; import { contentJS } from './content.mjs';
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/data.js', 'utf8') + '\n' + fs.readFileSync('src/data2.js', 'utf8') + '\n' + contentJS() + '\nthis.D = BUILTIN_DECKS;', ctx);
const QIDS = new Map(); for (const d of ctx.D) for (const q of d.questions) QIDS.set(q.id, d.id);
let bad = 0;
for (const f of process.argv.slice(2)) {
  const errs = []; let d;
  try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log('✗', f, 'JSON inválido:', e.message); bad++; continue; }
  const L = d.lessons || []; const ids = new Set();
  if (!ctx.D.some((x) => x.id === d.id)) errs.push('trilha desconhecida: ' + d.id);
  if (L.length < 4) errs.push('poucas aulas: ' + L.length);
  L.forEach((l, i) => {
    const w = (m) => errs.push(`aula ${i + 1} (${l.id}): ${m}`);
    if (!/^[a-z]+-a\d+$/.test(l.id || '') || !l.id.startsWith(d.id + '-')) w('id inválido'); if (ids.has(l.id)) w('id repetido'); ids.add(l.id);
    if (!l.title || l.title.length > 60) w('título vazio ou longo');
    if (!(l.mins >= 3 && l.mins <= 12)) w('mins fora de 3–12');
    if (!Array.isArray(l.qids) || l.qids.length < 1) w('sem qids'); else for (const q of l.qids) if (QIDS.get(q) !== d.id) w('qid inexistente nesta trilha: ' + q);
    if (!l.intro || l.intro.length < 30) w('intro curta');
    if (!Array.isArray(l.sections) || l.sections.length < 3 || l.sections.length > 6) w('3 a 6 seções');
    else l.sections.forEach((s, j) => { if (!s.h || !Array.isArray(s.p) || !s.p.length) w('seção ' + (j + 1) + ' sem h/p'); for (const p of s.p || []) if (p.length > 520) w('parágrafo longo na seção ' + (j + 1)); if (s.list && (!Array.isArray(s.list) || s.list.some((x) => typeof x !== 'string'))) w('list inválida'); });
    if (!l.example || !l.example.c || !l.example.q || !l.example.a) w('example incompleto');
    if (!Array.isArray(l.traps) || l.traps.length < 1) w('sem traps');
    if (!Array.isArray(l.summary) || l.summary.length < 2 || l.summary.length > 5) w('summary com 2 a 5 itens');
    if (!l.src) w('sem src');
    const words = JSON.stringify(l).split(/\s+/).length; if (words < 250) w('conteúdo curto (' + words + ' palavras)');
  });
  if (errs.length) { bad++; console.log('✗', f, '\n  ' + errs.join('\n  ')); } else console.log('✓', f, '·', L.length, 'aulas');
}
process.exit(bad ? 1 : 0);
