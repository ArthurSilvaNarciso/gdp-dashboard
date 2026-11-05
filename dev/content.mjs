// Junta content/*.json às trilhas nativas (gera o código que roda depois de data.js e data2.js).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
// stub = true: deixa só o índice leve das questões (id, tema, tipo, gabarito); o texto vai para data/questions.json.
export function questionBodies(dir = 'content') {
  const out = {};
  for (const x of readExtra(dir)) for (const q of x.questions) { const { id, topic, type, a, ...rest } = q; out[id] = rest; }
  return out;
}
function readExtra(dir) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  return files.map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { console.warn('conteúdo ignorado (JSON inválido):', f); return null; } }).filter(Boolean);
}
export function contentJS(dir = 'content', stub = false) {
  let extra = readExtra(dir);
  if (stub) extra = extra.map((x) => ({ ...x, questions: x.questions.map((q) => { const o = { id: q.id, topic: q.topic, a: q.a }; if (q.type) o.type = q.type; return o; }) }));
  const colors = { Escola: 'orange', Concursos: 'navy', Corporativo: 'navy' };
  return `/* ===== Conteúdo ampliado (content/*.json) ===== */
var Q_STUB = ${stub ? 'true' : 'false'}, Q_VER = '${stub ? crypto.createHash('sha1').update(JSON.stringify(questionBodies(dir))).digest('hex').slice(0, 10) : ''}';
(function () {
  const EXTRA = ${JSON.stringify(extra)};
  for (const x of EXTRA) {
    const d = BUILTIN_DECKS.find((b) => b.id === x.id);
    if (d) { const have = new Set(d.questions.map((q) => q.id)); d.questions.push(...x.questions.filter((q) => !have.has(q.id))); }
    else BUILTIN_DECKS.push({ id: x.id, title: x.title, subtitle: x.subtitle || '', blurb: x.blurb || '', color: ${JSON.stringify(colors)}[x.tag] || 'navy', tag: x.tag || 'Trilha', questions: x.questions });
  }
  const has = (id) => BUILTIN_DECKS.some((d) => d.id === id);
  const set = (p, list) => { const x = PERSONAS.find((y) => y.id === p); if (x) x.decks = list.filter(has); };
  set('concurso', ['neuro', 'port', 'dconst', 'dadm', 'logica', 'info']);
  set('faculdade', ['neuro', 'logica', 'mat', 'port', 'bio']);
  set('escola', ['neuro', 'mat', 'port', 'bio', 'hist', 'logica']);
  set('empresa', ['neuro', 'excel', 'lgpd', 'seg']);
})();
`;
}
