// Gera lib/builtin.js (ids das questões das trilhas nativas) a partir de src/data*.js
import fs from 'node:fs'; import vm from 'node:vm'; import { contentJS } from './content.mjs';
const code = fs.readFileSync('src/data.js', 'utf8') + '\n' + fs.readFileSync('src/data2.js', 'utf8') + '\n' + contentJS() + '\n;globalThis.__out = { BUILTIN_DECKS };';
const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
const out = {};
for (const d of ctx.__out.BUILTIN_DECKS) out[d.id] = { title: d.title, qids: d.questions.map((q) => q.id) };
fs.writeFileSync('lib/builtin.js', '// Gerado por dev/gen-builtin.mjs — não editar à mão\nexport const BUILTIN = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).map((k) => k + ':' + out[k].qids.length).join(' '));

// Índice de normas para o radar de lei do servidor (verificação periódica de alterações).
import('./laws.mjs').then(({ lawsIndex }) => {
  const ix = lawsIndex(); const out = {};
  for (const [k, v] of Object.entries(ix.laws)) out[k] = { n: v.n, nq: v.q.length, decks: v.decks, since: v.decks.map((d) => ix.reviewed[d]).filter(Boolean).sort()[0] || null };
  fs.writeFileSync('lib/laws.js', '// Gerado por dev/gen-builtin.mjs — não editar à mão\nexport const LAWS = ' + JSON.stringify(out) + ';\n');
  console.log('normas no radar: ' + Object.keys(out).length);
});
