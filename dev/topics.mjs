// Lista trilhas, ids e tópicos já existentes (para não repetir): node dev/topics.mjs
import fs from 'node:fs'; import vm from 'node:vm'; import { contentJS } from './content.mjs';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/data.js', 'utf8') + '\n' + fs.readFileSync('src/data2.js', 'utf8') + '\n' + contentJS() + '\nthis.D = BUILTIN_DECKS;', ctx);
for (const d of ctx.D) console.log(`## ${d.id} — ${d.title} (${d.questions.length})\n` + d.questions.map((q) => `${q.id}: ${q.topic}`).join(' | ') + '\n');
