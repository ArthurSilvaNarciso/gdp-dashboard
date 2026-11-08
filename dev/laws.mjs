// Radar de lei: extrai as normas citadas nas fontes das questões e das aulas e monta o índice norma → questões.
// Usado pelo build (data/laws.json, para o app) e pelo gerador do servidor (lib/laws.js, para a verificação mensal).
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
import { contentJS } from './content.mjs';

// Data da última revisão independente de cada trilha (atualize ao revisar uma trilha).
export const REVIEWS = JSON.parse(fs.readFileSync('content/meta/reviews.json', 'utf8'));

const CODES = [
  [/\bCF\b|\bCF\/88\b|Constitui[cç][aã]o( Federal| da Rep[uú]blica)?\b|\bADCT\b/i, 'CF/1988', 'Constituição Federal'],
  [/\bCTN\b|C[oó]digo Tribut[aá]rio/i, 'L5172/1966', 'Código Tributário Nacional (Lei 5.172/1966)'],
  [/\bCPP\b|C[oó]digo de Processo Penal/i, 'DL3689/1941', 'Código de Processo Penal (DL 3.689/1941)'],
  [/\bCPC\b|C[oó]digo de Processo Civil/i, 'L13105/2015', 'Código de Processo Civil (Lei 13.105/2015)'],
  [/\bCP\b|C[oó]digo Penal/i, 'DL2848/1940', 'Código Penal (DL 2.848/1940)'],
  [/\bCC\b|C[oó]digo Civil/i, 'L10406/2002', 'Código Civil (Lei 10.406/2002)'],
  [/\bCDC\b|C[oó]digo de Defesa do Consumidor/i, 'L8078/1990', 'Código de Defesa do Consumidor (Lei 8.078/1990)'],
  [/\bECA\b|Estatuto da Crian[cç]a/i, 'L8069/1990', 'ECA (Lei 8.069/1990)'],
  [/\bLRF\b|Responsabilidade Fiscal/i, 'LC101/2000', 'Lei de Responsabilidade Fiscal (LC 101/2000)'],
  [/\bLINDB\b/i, 'DL4657/1942', 'LINDB (DL 4.657/1942)'],
  [/\bLDB\b/i, 'L9394/1996', 'LDB (Lei 9.394/1996)'],
  [/\bLGPD\b/i, 'L13709/2018', 'LGPD (Lei 13.709/2018)'],
  [/\bLAI\b|Acesso [àa] Informa[cç][aã]o/i, 'L12527/2011', 'Lei de Acesso à Informação (Lei 12.527/2011)'],
  [/\bLEP\b|Execu[cç][aã]o Penal/i, 'L7210/1984', 'Lei de Execução Penal (Lei 7.210/1984)'],
  [/\bCTB\b|C[oó]digo de Tr[aâ]nsito/i, 'L9503/1997', 'Código de Trânsito (Lei 9.503/1997)'],
  [/\bCLT\b/, 'DL5452/1943', 'CLT (DL 5.452/1943)']
];
const yr = (y) => (y.length === 2 ? (Number(y) > 30 ? '19' : '20') + y : y);
const num = (n) => n.replace(/\./g, '');
const fmtNum = (n) => Number(n).toLocaleString('pt-BR');
export function lawsIn(src) {
  const out = new Map(); if (!src) return out; const s = String(src);
  let m; const add = (k, n) => { if (!out.has(k)) out.set(k, n); };
  const reLC = /(?:Lei Complementar|\bLC)\s*(?:n[º°o.]*\s*)?(\d{1,3})\/(\d{2,4})/gi;
  while ((m = reLC.exec(s))) add(`LC${m[1]}/${yr(m[2])}`, `LC ${m[1]}/${yr(m[2])}`);
  const reDL = /Decreto-Lei\s*(?:n[º°o.]*\s*)?([\d.]{1,6})\/(\d{2,4})/gi;
  while ((m = reDL.exec(s))) add(`DL${num(m[1])}/${yr(m[2])}`, `Decreto-Lei ${fmtNum(num(m[1]))}/${yr(m[2])}`);
  const reD = /Decreto(?!-Lei)\s*(?:n[º°o.]*\s*)?([\d.]{1,7})\/(\d{2,4})/gi;
  while ((m = reD.exec(s))) add(`D${num(m[1])}/${yr(m[2])}`, `Decreto ${fmtNum(num(m[1]))}/${yr(m[2])}`);
  const reL = /\bLei(?! Complementar)\s*(?:n[º°o.]*\s*)?([\d.]{3,7})\/(\d{2,4})/gi;
  while ((m = reL.exec(s))) add(`L${num(m[1])}/${yr(m[2])}`, `Lei ${fmtNum(num(m[1]))}/${yr(m[2])}`);
  const reEC = /\bEC\s*(?:n[º°o.]*\s*)?(\d{1,3})\/(\d{2,4})/gi;
  while ((m = reEC.exec(s))) add('CF/1988', 'Constituição Federal');
  for (const [re, k, n] of CODES) if (re.test(s)) add(k, n);
  return out;
}
function loadDecks() {
  const code = fs.readFileSync('src/data.js', 'utf8') + '\n' + fs.readFileSync('src/data2.js', 'utf8') + '\n' + contentJS() + '\n;globalThis.__out = { BUILTIN_DECKS };';
  const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx); return ctx.__out.BUILTIN_DECKS;
}
// Índice: { laws: { chave: { n, q: [ids], decks: [ids] } }, q: { id: [chaves] }, reviewed: { deck: data } }
export function lawsIndex() {
  const laws = {}, byQ = {};
  for (const d of loadDecks()) {
    const lf = path.join('content/lessons', d.id + '.json');
    const lessonLaws = fs.existsSync(lf) ? JSON.parse(fs.readFileSync(lf, 'utf8')).lessons.map((l) => ({ ids: l.qids || [], laws: lawsIn(l.src) })) : [];
    for (const q of d.questions) {
      const L = lawsIn(q.src); if (!L.size) continue;
      byQ[q.id] = [...L.keys()];
      for (const [k, n] of L) { const x = (laws[k] = laws[k] || { n, q: [], decks: [] }); x.q.push(q.id); if (!x.decks.includes(d.id)) x.decks.push(d.id); }
    }
    for (const ll of lessonLaws) for (const [k, n] of ll.laws) { const x = (laws[k] = laws[k] || { n, q: [], decks: [] }); if (!x.decks.includes(d.id)) x.decks.push(d.id); }
  }
  for (const [re, k, n] of CODES) if (laws[k]) laws[k].n = n; // nome canônico dos códigos
  return { laws, q: byQ, reviewed: REVIEWS };
}
if (process.argv[1] && process.argv[1].endsWith('laws.mjs')) {
  const ix = lawsIndex(); const top = Object.entries(ix.laws).sort((a, b) => b[1].q.length - a[1].q.length);
  console.log(top.length + ' normas · ' + Object.keys(ix.q).length + ' questões com norma citada');
  console.log(top.slice(0, 25).map(([k, v]) => `${v.n}: ${v.q.length}`).join(' | '));
}
