// Gera lib/builtin.js (ids das questões das trilhas nativas) a partir de src/data*.js
import fs from 'node:fs'; import vm from 'node:vm';
const code = fs.readFileSync('src/data.js', 'utf8') + '\n' + fs.readFileSync('src/data2.js', 'utf8') + '\n;globalThis.__out = { BUILTIN_DECKS };';
const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
const out = {};
for (const d of ctx.__out.BUILTIN_DECKS) out[d.id] = { title: d.title, qids: d.questions.map((q) => q.id) };
fs.writeFileSync('lib/builtin.js', '// Gerado por dev/gen-builtin.mjs — não editar à mão\nexport const BUILTIN = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).map((k) => k + ':' + out[k].qids.length).join(' '));
