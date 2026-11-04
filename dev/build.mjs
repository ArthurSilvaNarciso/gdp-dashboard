// Monta o app em um único HTML: index.html (servidor/Vercel) e dist/artifact.html (Claude).
import fs from 'node:fs';
import { contentJS } from './content.mjs';
import { transformSync } from 'esbuild';
const MIN = process.env.MEMORY_NOMIN !== '1'; // MEMORY_NOMIN=1 gera sem minificar (para depurar)
const R = (f) => fs.readFileSync(f, 'utf8');
let head = R('src/head.html');
if (MIN) head = head.replace(/<style>([\s\S]*?)<\/style>/, (m, css) => '<style>' + transformSync(css, { loader: 'css', minify: true, target: ['chrome100', 'safari15'] }).code.trim() + '</style>');
const cut = head.indexOf('</style>') + '</style>'.length;
const headPart = head.slice(0, cut), bodyPart = head.slice(cut);
const shared = R('lib/shared.js').replace(/\nexport \{([^}]*)\};?\s*$/, (m, names) => `\nreturn {${names}};`);
if (!shared.includes('return {')) throw new Error('export de shared.js não encontrado');
const app = R('src/app.js');
const mark = '/* ================= Inicialização ================= */';
const i = app.indexOf(mark); if (i < 0) throw new Error('marcador de inicialização não encontrado');
const js = [R('src/data.js'), R('src/data2.js'), contentJS(), 'const SH = (() => {\n' + shared + '\n})();', app.slice(0, i), R('src/icons.js'), R('src/medals.js'), R('src/avatar.js'), R('src/engage.js'), R('src/journey.js'), R('src/diag.js'), R('src/report.js'), R('src/legal.js'), R('src/social.js'), R('src/concursos.js'), R('src/lessons.js'), R('src/server.js'), app.slice(i)].join('\n');
const code = MIN ? transformSync(js, { loader: 'js', minifyWhitespace: true, minifySyntax: true, target: 'es2020', legalComments: 'none' }).code : js;
const script = '<script>\n' + code + '\n</script>\n';
// Dados carregados sob demanda no site (data/*.json, com cache no service worker); embutidos no artefato.
const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const cdir = 'content/concursos'; const items = new Map();
for (const f of fs.existsSync(cdir) ? fs.readdirSync(cdir).filter((x) => x.endsWith('.json')).sort() : []) { try { for (const c of JSON.parse(R(cdir + '/' + f)).items || []) if (c.inscricoes && c.inscricoes.fim >= today) items.set(c.id, c); } catch (e) { console.warn('concursos ignorado:', f); } }
const concursos = { updated: today, items: [...items.values()].sort((a, b) => a.inscricoes.fim.localeCompare(b.inscricoes.fim)) };
const lessons = {}; const ldir = 'content/lessons';
for (const f of fs.existsSync(ldir) ? fs.readdirSync(ldir).filter((x) => x.endsWith('.json')) : []) { try { const d = JSON.parse(R(ldir + '/' + f)); lessons['lessons/' + d.id + '.json'] = { id: d.id, lessons: d.lessons }; } catch (e) { console.warn('aulas ignoradas:', f); } }
fs.rmSync('data', { recursive: true, force: true }); fs.mkdirSync('data/lessons', { recursive: true });
fs.writeFileSync('data/concursos.json', JSON.stringify(concursos));
for (const [k, v] of Object.entries(lessons)) fs.writeFileSync('data/' + k, JSON.stringify(v));
const inline = '<script>window.__INLINE = ' + JSON.stringify(Object.assign({ 'concursos.json': concursos }, lessons)).replace(/</g, '\\u003c') + ';</script>\n';
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('index.html', R('dev/preamble.html') + headPart + '\n</head>\n<body>' + bodyPart + script + '</body>\n</html>\n');
fs.writeFileSync('dist/artifact.html', head + '\n' + inline + script);
console.log('concursos', concursos.items.length, '· aulas', Object.keys(lessons).length, '·', 'index.html', fs.statSync('index.html').size, 'bytes · artifact', fs.statSync('dist/artifact.html').size, 'bytes');
