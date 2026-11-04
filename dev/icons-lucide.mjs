// Gera src/icons.js a partir do Lucide (ISC): node dev/icons-lucide.mjs <pasta node_modules/lucide-static/icons>
// Conjunto de ícones de traço, grade de 24 px, usado por produtos reais — consistente e sem "cara de IA".
import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2]; if (!dir) throw new Error('informe a pasta dos ícones do lucide-static');
const MAP = {
  home: 'house', decks: 'route', layers: 'layers', concursos: 'landmark', chart: 'chart-no-axes-column', user: 'circle-user-round', users: 'users',
  recall: 'rotate-ccw', clock: 'clock', book: 'book-open', read: 'book-open-text', lesson: 'notebook-text', tutor: 'message-circle-question', mind: 'brain',
  flame: 'flame', target: 'target', trophy: 'trophy', share: 'share-2', upload: 'upload', download: 'download', cloud: 'cloud-upload', shield: 'shield-check',
  shuffle: 'shuffle', school: 'graduation-cap', exam: 'calendar-check', work: 'briefcase-business', gear: 'settings', key: 'key-round', plus: 'plus',
  close: 'x', x: 'x', back: 'chevron-left', chev: 'chevron-right', down: 'chevron-down', tick: 'check', check: 'check', arrow: 'arrow-right', bolt: 'zap',
  alert: 'circle-alert', file: 'file-text', bell: 'bell', send: 'send', search: 'search', edit: 'pencil', eye: 'eye', copy: 'copy', logout: 'log-out',
  refresh: 'refresh-cw', sound: 'volume-2', map: 'map-pin', calendar: 'calendar-days', money: 'banknote', external: 'external-link', list: 'list-checks',
  filter: 'sliders-horizontal', build: 'notebook-pen', play: 'circle-play', star: 'star', medal: 'medal', gauge: 'gauge', wrench: 'wrench', footprints: 'footprints',
  clipboard: 'clipboard-check', fileup: 'file-up', hundred: 'badge-check', streak: 'flame', info: 'info', lock: 'lock', globe: 'globe', pin: 'map-pinned',
  bookmark: 'bookmark', idea: 'lightbulb', warn: 'triangle-alert', sum: 'list-collapse', spark: 'rotate-ccw', memory: 'brain',
  humans: 'heart-handshake', gavel: 'gavel', inquiry: 'file-search', signature: 'signature', scale: 'scale', ethics: 'handshake', org: 'building-2', lang: 'languages'
};
const inner = (f) => fs.readFileSync(path.join(dir, f + '.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').replace(/ \/>/g, '/>').trim();
const I = {}; for (const [k, f] of Object.entries(MAP)) I[k] = inner(f);
const out = `/* ================= Ícones do Memory =================
   Lucide (licença ISC, lucide.dev): ícones de traço numa grade de 24 px, o mesmo padrão de produtos como Linear e Vercel.
   Gerado por dev/icons-lucide.mjs — não editar à mão. */
Object.assign(I, ${JSON.stringify(I, null, 0).replace(/","/g, '",\n  "')});
DECK_LOOK.neuro = Object.assign({}, DECK_LOOK.neuro, { icon: 'mind' });

/* ---------- Ilustrações de estado: ícone grande num disco suave, com o ponto laranja da marca ---------- */
const ILLO = { sync: ['cloud', 'blue'], class: ['school', 'mint'], search: ['search', 'lilac'], done: ['clipboard', 'peach'], empty: ['bookmark', 'blue'], lessons: ['lesson', 'mint'], concursos: ['concursos', 'blue'] };
function illo(name, cls = '') {
  const v = ILLO[name] || ILLO.empty;
  return \`<span class="illo2 c-\${v[1]} \${cls}" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24">\${I[v[0]]}</svg><i></i></span>\`;
}
`;
fs.writeFileSync('src/icons.js', out);
console.log('ícones:', Object.keys(I).length);
