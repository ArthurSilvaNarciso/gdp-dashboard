// Monta o app em um único HTML: index.html (servidor/Vercel) e dist/artifact.html (Claude).
import fs from 'node:fs';
const R = (f) => fs.readFileSync(f, 'utf8');
const head = R('src/head.html');
const cut = head.indexOf('</style>') + '</style>'.length;
const headPart = head.slice(0, cut), bodyPart = head.slice(cut);
const shared = R('lib/shared.js').replace(/\nexport \{([^}]*)\};?\s*$/, (m, names) => `\nreturn {${names}};`);
if (!shared.includes('return {')) throw new Error('export de shared.js não encontrado');
const app = R('src/app.js');
const mark = '/* ================= Inicialização ================= */';
const i = app.indexOf(mark); if (i < 0) throw new Error('marcador de inicialização não encontrado');
const js = [R('src/data.js'), R('src/data2.js'), 'const SH = (() => {\n' + shared + '\n})();', app.slice(0, i), R('src/glyphs.js'), R('src/icons.js'), R('src/server.js'), app.slice(i)].join('\n');
const script = '<script>\n' + js + '\n</script>\n';
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('index.html', R('dev/preamble.html') + headPart + '\n</head>\n<body>' + bodyPart + script + '</body>\n</html>\n');
fs.writeFileSync('dist/artifact.html', head + '\n' + script);
console.log('index.html', fs.statSync('index.html').size, 'bytes · artifact', fs.statSync('dist/artifact.html').size, 'bytes');
