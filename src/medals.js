/* ---------- Selos de conquista (SVG geométrico, sem ilustração gerada) ---------- */
const MEDAL = {
  first: { i: 'footprints', c: ['#F2A65A', '#D9822B'] }, streak3: { i: 'flame', c: ['#F2A65A', '#D9822B'], t: '3' },
  streak7: { i: 'flame', c: ['#FFC24B', '#E8A317'], t: '7' }, streak30: { i: 'flame', c: ['#8E7BFF', '#5B45E0'], t: '30' },
  q100: { i: 'target', c: ['#A9B4C8', '#7C889E'], t: '100' }, fixer: { i: 'wrench', c: ['#A9B4C8', '#7C889E'] },
  calib: { i: 'gauge', c: ['#5FC9A0', '#2E9C74'] }, firm25: { i: 'mind', c: ['#FFC24B', '#E8A317'], t: '25' },
  sim70: { i: 'clipboard', c: ['#FFC24B', '#E8A317'], t: '70%' }, import: { i: 'fileup', c: ['#6E8BFF', '#3F5BD9'] }
};
function medalSVG(id, cls = '') {
  const m = MEDAL[id] || MEDAL.first; const g = 'mg-' + id;
  return `<svg class="medal ${cls}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.c[0]}"/><stop offset="1" stop-color="${m.c[1]}"/></linearGradient></defs>
    <path d="M32 2.5 57.5 17v30L32 61.5 6.5 47V17z" fill="url(#${g})"/><path d="M32 2.5 57.5 17v30L32 61.5z" fill="#000" opacity=".08"/>
    <circle cx="32" cy="31" r="17" fill="#fff"/><g transform="translate(20 19)" fill="none" stroke="${m.c[1]}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${I[m.i]}</g>
    ${m.t ? `<rect x="${32 - (m.t.length * 4 + 7)}" y="44" width="${m.t.length * 8 + 14}" height="14" rx="7" fill="#1F2A6B"/><text x="32" y="54.2" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-weight="700" font-size="10" fill="#fff">${m.t}</text>` : ''}</svg>`;
}
