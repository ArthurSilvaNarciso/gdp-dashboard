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
const js = [R('src/data.js'), R('src/data2.js'), contentJS(), 'const SH = (() => {\n' + shared + '\n})();', app.slice(0, i), R('src/glyphs.js'), R('src/icons.js'), R('src/avatar.js'), R('src/engage.js'), R('src/journey.js'), R('src/diag.js'), R('src/report.js'), R('src/legal.js'), R('src/social.js'), R('src/server.js'), app.slice(i)].join('\n');
const code = MIN ? transformSync(js, { loader: 'js', minifyWhitespace: true, minifySyntax: true, target: 'es2020', legalComments: 'none' }).code : js;
const script = '<script>\n' + code + '\n</script>\n';
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('index.html', R('dev/preamble.html') + headPart + '\n</head>\n<body>' + bodyPart + script + '</body>\n</html>\n');
fs.writeFileSync('dist/artifact.html', head + '\n' + script);
console.log('index.html', fs.statSync('index.html').size, 'bytes · artifact', fs.statSync('dist/artifact.html').size, 'bytes');
