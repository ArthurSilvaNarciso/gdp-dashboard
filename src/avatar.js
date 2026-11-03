/* ================= Avatar do Memory (monte o seu personagem) ================= */
// Ilustração vetorial em camadas, desenhada para a marca: formas chapadas, sem contorno, cantos suaves.
// Tudo é gerado em SVG a partir de uma configuração pequena (cabe no progresso e sincroniza entre aparelhos).
const AV = {
  skin: ['#FFF0E6', '#FFE3D1', '#F8CDAF', '#F0BE9A', '#E3A983', '#D99C72', '#C1825A', '#A8704A', '#9F643F', '#7B472B', '#64391F', '#4A2A18'],
  hairc: ['#1E1A1D', '#3B2A22', '#5A3A26', '#6B4630', '#8A5A3B', '#A0582F', '#C9692E', '#D6A35C', '#EBD7A8', '#F4ECDC', '#A3A8AE', '#2E3C8F', '#FF7A22', '#E58BB0', '#7B5CD6', '#2BA39A'],
  top: ['#1F2A6B', '#FF7A22', '#2E5BDB', '#14945A', '#6648D8', '#E2B13C', '#D9465F', '#F1F2F6', '#2A2E3D', '#8DA2B6', '#2BA39A', '#F4A6C0', '#A7D8C4', '#C8B6F2', '#D9C3A0', '#7A2E3B'],
  bg: ['#FFE7D4', '#DFE8FF', '#D6F2E5', '#E7E2FF', '#FFEFBA', '#FFE0E8', '#CDEFF5', '#F6E3C8', '#EEF0F7', '#FFD6D0', '#1F2A6B', '#FF7A22', '#2E5BDB', '#14945A', '#6648D8', '#2A2E3D'],
  frame: ['#1E1A1D', '#5B3A29', '#C9A24A', '#A8B0BA', '#2E5BDB', '#D9465F', '#E58BB0', '#F7F7F7', '#FF7A22', '#14945A']
};
const AV_OPTS = {
  hair: ['curto', 'lateral', 'topete', 'undercut', 'raspado', 'moicano', 'cacheado', 'black', 'puff', 'ondulado', 'longo', 'chanel', 'franja', 'rabo', 'chiquinhas', 'coque', 'trancas', 'dreads', 'careca'],
  eyes: ['ponto', 'grande', 'brilho', 'feliz', 'sereno', 'piscando', 'cilios', 'delineado', 'determinado'],
  brows: ['suave', 'grossa', 'arqueada', 'preocupada', 'brava', 'nenhuma'],
  mouth: ['sorriso', 'aberto', 'dentes', 'gargalhada', 'timido', 'canto', 'neutro', 'lingua', 'aparelho', 'ooh'],
  face: ['nenhum', 'sardas', 'pinta', 'curativo', 'pintura'],
  beard: ['nenhuma', 'rala', 'bigode', 'cavanhaque', 'cheia'],
  hat: ['nenhum', 'bone', 'bonetras', 'touca', 'bucket', 'fedora', 'capelo', 'viseira', 'faixa', 'bandana', 'arco', 'coroa', 'fone'],
  glasses: ['nenhum', 'redondo', 'quadrado', 'retro', 'gatinho', 'aviador', 'meia', 'hex', 'leitura', 'sol', 'coracao', 'monoculo'],
  acc: ['nenhum', 'brinco', 'argola', 'piercing', 'laco', 'flor', 'lapis', 'colar', 'gravata', 'cachecol'],
  top: ['camiseta', 'memory', 'moletom', 'camisa', 'polo', 'blazer', 'gola', 'regata', 'jaqueta', 'esportiva', 'listrada', 'jaleco'],
  bgp: ['liso', 'bolinhas', 'listras', 'raios', 'ondas', 'grade', 'marca']
};
const AV_LABEL = {
  curto: 'Curto', lateral: 'Lateral', topete: 'Topete', undercut: 'Undercut', raspado: 'Raspado', moicano: 'Moicano', cacheado: 'Cacheado', black: 'Black', puff: 'Puff', ondulado: 'Ondulado', longo: 'Longo', chanel: 'Chanel', franja: 'Franja', rabo: 'Rabo de cavalo', chiquinhas: 'Chiquinhas', coque: 'Coque', trancas: 'Tranças', dreads: 'Dreads', careca: 'Sem cabelo',
  ponto: 'Clássico', grande: 'Atentos', brilho: 'Brilhantes', feliz: 'Sorrindo', sereno: 'Sereno', piscando: 'Piscando', cilios: 'Cílios', delineado: 'Delineado', determinado: 'Focado',
  suave: 'Suave', grossa: 'Marcada', arqueada: 'Arqueada', preocupada: 'Preocupada', brava: 'Brava', nenhuma: 'Nenhuma',
  sorriso: 'Sorriso', aberto: 'Animado', dentes: 'Radiante', gargalhada: 'Gargalhada', timido: 'Tímido', canto: 'De canto', neutro: 'Neutro', lingua: 'Língua', aparelho: 'Aparelho', ooh: 'Surpreso',
  sardas: 'Sardas', pinta: 'Pinta', curativo: 'Curativo', pintura: 'Torcida',
  rala: 'Por fazer', bigode: 'Bigode', cavanhaque: 'Cavanhaque', cheia: 'Cheia',
  nenhum: 'Nenhum', bone: 'Boné', bonetras: 'Boné para trás', touca: 'Touca', bucket: 'Bucket', fedora: 'Chapéu', capelo: 'Formatura', viseira: 'Viseira', faixa: 'Faixa', bandana: 'Bandana', arco: 'Tiara', coroa: 'Coroa', fone: 'Fone',
  redondo: 'Redondo', quadrado: 'Quadrado', retro: 'Retrô', gatinho: 'Gatinho', aviador: 'Aviador', meia: 'Meio aro', hex: 'Hexagonal', leitura: 'Leitura', sol: 'De sol', coracao: 'Coração', monoculo: 'Monóculo',
  brinco: 'Brincos', argola: 'Argolas', piercing: 'Piercing', laco: 'Laço', flor: 'Flor', lapis: 'Lápis', colar: 'Colar', gravata: 'Gravata', cachecol: 'Cachecol',
  camiseta: 'Camiseta', memory: 'Memory', moletom: 'Moletom', camisa: 'Camisa', polo: 'Polo', blazer: 'Blazer', gola: 'Gola alta', regata: 'Regata', jaqueta: 'Jaqueta', esportiva: 'Esportiva', listrada: 'Listrada', jaleco: 'Jaleco',
  liso: 'Liso', bolinhas: 'Bolinhas', listras: 'Listras', raios: 'Raios', ondas: 'Ondas', grade: 'Grade', marca: 'Memory'
};
function avShade(hex, amt) { // amt < 0 escurece, > 0 clareia
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function avLum(hex) { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
const avPick = (list, v, d = 0) => (list.includes(v) ? v : list[d]);
const avIdx = (v, len, d = 0) => (Number.isInteger(v) && v >= 0 && v < len ? v : d);
function avNormalize(a) {
  a = a && typeof a === 'object' ? a : {};
  let hat = a.hat, acc = a.acc;
  if (!hat && ['bone', 'touca', 'fone'].includes(acc)) { hat = acc; acc = 'nenhum'; } // versão anterior
  return {
    v: 2, skin: avIdx(a.skin, AV.skin.length, 2), hair: avPick(AV_OPTS.hair, a.hair), hc: avIdx(a.hc, AV.hairc.length, 1),
    eyes: avPick(AV_OPTS.eyes, a.eyes), brows: avPick(AV_OPTS.brows, a.brows), mouth: avPick(AV_OPTS.mouth, a.mouth), face: avPick(AV_OPTS.face, a.face), beard: avPick(AV_OPTS.beard, a.beard),
    hat: avPick(AV_OPTS.hat, hat), hatc: avIdx(a.hatc, AV.top.length, 1), glasses: avPick(AV_OPTS.glasses, a.glasses), gc: avIdx(a.gc, AV.frame.length, 0), acc: avPick(AV_OPTS.acc, acc),
    top: avPick(AV_OPTS.top, a.top), tc: avIdx(a.tc, AV.top.length, 0), bg: avIdx(a.bg, AV.bg.length, 0), bgp: avPick(AV_OPTS.bgp, a.bgp), blush: a.blush !== false
  };
}
// Avatar padrão estável a partir do nome (nunca fica em branco).
function avDefault(seed) {
  let h = 0; for (const ch of String(seed || 'memory')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = (n) => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) % n; };
  const hair = ['curto', 'lateral', 'cacheado', 'longo', 'chanel', 'rabo', 'coque', 'black', 'ondulado', 'topete'][r(10)];
  return avNormalize({ skin: r(12), hair, hc: [0, 1, 2, 3, 4, 7, 1, 0][r(8)], eyes: ['ponto', 'grande', 'feliz', 'brilho'][r(4)], brows: 'suave', mouth: ['sorriso', 'dentes', 'aberto'][r(3)], beard: 'nenhuma', glasses: r(5) === 0 ? 'redondo' : 'nenhum', top: ['camiseta', 'moletom', 'camisa', 'memory', 'polo'][r(5)], tc: [0, 1, 2, 3, 4, 8, 10][r(7)], bg: r(9), blush: true });
}
function avatarConfig() { return S.user.avatar ? avNormalize(S.user.avatar) : avDefault(S.user.name); }

/* ---------- desenho ---------- */
const AV_INK = '#1E1A1D';
let AV_UID = 0;
const mirror = (svg) => `${svg}<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;
function avBackground(a, P) {
  const col = AV.bg[a.bg], dark = avLum(col) < 0.5, ov = dark ? 'rgba(255,255,255,.12)' : 'rgba(31,42,107,.08)';
  P.push(`<rect width="200" height="200" fill="${col}"/>`);
  const pat = {
    bolinhas: () => { let s = ''; for (let y = 10; y < 200; y += 24) for (let x = (y / 24) % 2 ? 22 : 10; x < 200; x += 24) s += `<circle cx="${x}" cy="${y}" r="3.4"/>`; return `<g fill="${ov}">${s}</g>`; },
    listras: () => `<g stroke="${ov}" stroke-width="10">${Array.from({ length: 12 }, (_, i) => `<path d="M${-60 + i * 28} 210L${60 + i * 28} -10"/>`).join('')}</g>`,
    raios: () => `<g fill="${ov}">${Array.from({ length: 12 }, (_, i) => { const a1 = (i * 30) * Math.PI / 180, a2 = (i * 30 + 14) * Math.PI / 180; return `<path d="M100 100L${100 + 160 * Math.cos(a1)} ${100 + 160 * Math.sin(a1)}L${100 + 160 * Math.cos(a2)} ${100 + 160 * Math.sin(a2)}Z"/>`; }).join('')}</g>`,
    ondas: () => `<g fill="none" stroke="${ov}" stroke-width="6">${Array.from({ length: 8 }, (_, i) => `<path d="M-10 ${18 + i * 26}q15 -10 30 0t30 0t30 0t30 0t30 0t30 0t30 0"/>`).join('')}</g>`,
    grade: () => `<g stroke="${ov}" stroke-width="2.4">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 25} 0V200M0 ${i * 25}H200"/>`).join('')}</g>`,
    marca: () => `<circle cx="38" cy="40" r="34" fill="${dark ? 'rgba(74,91,214,.55)' : 'rgba(74,91,214,.18)'}"/><circle cx="62" cy="40" r="34" fill="${dark ? 'rgba(255,122,34,.45)' : 'rgba(255,122,34,.18)'}"/><circle cx="170" cy="168" r="44" fill="none" stroke="${ov}" stroke-width="6"/>`
  }[a.bgp];
  if (pat) P.push(pat());
}
function avatarSVG(cfg, opts = {}) {
  const a = avNormalize(cfg);
  const skin = AV.skin[a.skin], sk2 = avShade(skin, -0.12), sk3 = avShade(skin, -0.26);
  const hc = AV.hairc[a.hc], hc2 = avShade(hc, -0.22), hcL = avShade(hc, 0.16);
  const tc = AV.top[a.tc], tc2 = avShade(tc, -0.18), tcL = avShade(tc, 0.16);
  const ht = AV.top[a.hatc], ht2 = avShade(ht, -0.22), htL = avShade(ht, 0.2);
  const fr = AV.frame[a.gc], ink = AV_INK, id = 'av' + (++AV_UID);
  const P = [];
  avBackground(a, P);

  /* ---- cabelo de trás ---- */
  const longBack = `<path d="M50 86C46 46 72 27 100 27S154 46 150 86L156 170C130 182 70 182 44 170Z" fill="${hc}"/>`;
  const back = {
    longo: longBack,
    trancas: longBack + [56, 70, 130, 144].map((x) => `<path d="M${x} 118v54" stroke="${hc2}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>`).join(''),
    chanel: `<path d="M47 92C43 52 70 29 100 29S157 52 153 92V124C153 133 145 137 137 135H63C55 137 47 133 47 124Z" fill="${hc}"/>`,
    franja: `<path d="M49 96C45 60 70 35 100 35S155 60 151 96V112C147 115 141 114 139 108H61C59 114 53 115 49 112Z" fill="${hc}"/>`,
    ondulado: `<path d="M48 88C44 48 72 28 100 28S156 48 152 88C158 104 150 116 156 130C160 144 148 156 138 152L62 152C52 156 40 144 44 130C50 116 42 104 48 88Z" fill="${hc}"/>`,
    rabo: `<path d="M134 50C166 54 174 98 162 136C158 114 151 93 138 76Z" fill="${hc}"/><circle cx="138" cy="56" r="6" fill="${AV.top[1]}"/>`,
    chiquinhas: `<g fill="${hc}"><ellipse cx="42" cy="104" rx="15" ry="22"/><ellipse cx="158" cy="104" rx="15" ry="22"/></g><circle cx="50" cy="86" r="5" fill="${AV.top[6]}"/><circle cx="150" cy="86" r="5" fill="${AV.top[6]}"/>`,
    coque: `<circle cx="100" cy="28" r="19" fill="${hc}"/><path d="M86 38C92 33 108 33 114 38" stroke="${hc2}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    puff: `<g fill="${hc}">${[[100, 22, 26], [80, 26, 14], [120, 26, 14], [88, 8, 13], [112, 8, 13], [100, 2, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><path d="M80 44H120" stroke="${AV.top[1]}" stroke-width="5" stroke-linecap="round"/>`,
    black: `<g fill="${hc}"><circle cx="100" cy="70" r="58"/>${[[50, 52], [64, 30], [88, 18], [112, 18], [136, 30], [150, 52], [156, 80], [44, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20"/>`).join('')}</g>`,
    cacheado: `<g fill="${hc}">${[[56, 70], [62, 50], [78, 36], [100, 31], [122, 36], [138, 50], [144, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18"/>`).join('')}</g>`,
    dreads: `<g stroke="${hc}" stroke-width="9" stroke-linecap="round">${[[48, 160], [57, 166], [66, 168], [134, 168], [143, 166], [152, 160]].map(([x, y]) => `<path d="M${x} 74V${y}"/>`).join('')}</g><g stroke="${hc2}" stroke-width="9" stroke-linecap="butt" stroke-dasharray="2 14">${[48, 57, 66, 134, 143, 152].map((x) => `<path d="M${x} 96V160"/>`).join('')}</g>`
  }[a.hair] || '';
  P.push(back);

  /* ---- pescoço e roupa ---- */
  P.push(`<path d="M86 122V151C92 158 108 158 114 151V122Z" fill="${skin}"/><path d="M86 128C94 138 106 138 114 128V140C106 147 94 147 86 140Z" fill="${sk2}"/>`);
  const body = 'M26 200C28 172 52 154 86 150C92 157 108 157 114 150C148 154 172 172 174 200Z';
  const crew = (c) => `<path d="M86 150C92 160 108 160 114 150" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const tops = {
    camiseta: `<path d="${body}" fill="${tc}"/>${crew(tc2)}`,
    memory: `<path d="${body}" fill="${AV.top[0]}"/>${crew(avShade(AV.top[0], -0.25))}<circle cx="122" cy="180" r="6" fill="#4A5BD6"/><circle cx="129" cy="180" r="6" fill="#FF7A22"/><path d="M125.5 175.2a6 6 0 0 1 0 9.6a6 6 0 0 1 0-9.6Z" fill="#B4482A"/>`,
    moletom: `<path d="${body}" fill="${tc}"/><path d="M70 154C76 140 124 140 130 154C122 166 78 166 70 154Z" fill="${tc2}"/><path d="M86 150C92 158 108 158 114 150" fill="${skin}"/><path d="M94 160L92 182M106 160L108 182" stroke="${tcL}" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="184" r="2.6" fill="${tcL}"/><circle cx="108" cy="184" r="2.6" fill="${tcL}"/><path d="M76 190H124" stroke="${tc2}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
    camisa: `<path d="${body}" fill="${tc}"/><path d="M86 149L100 165L91 173L78 155Z" fill="#FFFFFF"/><path d="M114 149L100 165L109 173L122 155Z" fill="#FFFFFF"/><circle cx="100" cy="180" r="2.4" fill="${tc2}"/><circle cx="100" cy="192" r="2.4" fill="${tc2}"/>`,
    polo: `<path d="${body}" fill="${tc}"/><path d="M86 149L100 163L92 170L80 155Z" fill="${tc2}"/><path d="M114 149L100 163L108 170L120 155Z" fill="${tc2}"/><path d="M100 163V184" stroke="${tc2}" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="172" r="2" fill="${tcL}"/><circle cx="100" cy="180" r="2" fill="${tcL}"/>`,
    blazer: `<path d="${body}" fill="${tc}"/><path d="M86 150L100 180L114 150C108 156 92 156 86 150Z" fill="#FFFFFF"/><path d="M85 151L100 181L91 200H70C74 181 78 163 85 151Z" fill="${tc2}"/><path d="M115 151L100 181L109 200H130C126 181 122 163 115 151Z" fill="${tc2}"/><circle cx="100" cy="190" r="2.4" fill="${tcL}"/>`,
    gola: `<path d="${body}" fill="${tc}"/><path d="M82 136H118L120 156C110 163 90 163 80 156Z" fill="${tc2}"/><path d="M84 144H116M83 151H117" stroke="${tc}" stroke-width="2" opacity=".5"/>`,
    regata: `<path d="${body}" fill="${skin}"/><path d="M62 200C64 178 72 162 80 154C88 166 112 166 120 154C128 162 136 178 138 200Z" fill="${tc}"/><path d="M80 154C88 166 112 166 120 154" stroke="${tc2}" stroke-width="3.4" fill="none"/>`,
    jaqueta: `<path d="${body}" fill="${tc}"/><path d="M88 152C94 164 106 164 112 152L110 200H90Z" fill="#FFFFFF"/><path d="M84 150L96 172L90 200H74C76 180 79 162 84 150Z" fill="${tc2}"/><path d="M116 150L104 172L110 200H126C124 180 121 162 116 150Z" fill="${tc2}"/><path d="M60 176L66 196M140 176L134 196" stroke="${tcL}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 4"/><rect x="66" y="178" width="12" height="8" rx="2" fill="${tcL}"/>`,
    esportiva: `<path d="${body}" fill="${tc}"/><path d="M86 150L100 166L114 150" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="M40 174C46 166 52 162 60 159L66 200H48Z" fill="#FFFFFF" opacity=".9"/><path d="M160 174C154 166 148 162 140 159L134 200H152Z" fill="#FFFFFF" opacity=".9"/><path d="M93 178H107L100 196Z" fill="${tcL}"/>`,
    listrada: `<path d="${body}" fill="${tc}"/><g fill="${tcL}">${[164, 178, 192].map((y) => `<rect x="20" y="${y}" width="160" height="6"/>`).join('')}</g>${crew(tc2)}`,
    jaleco: `<path d="${body}" fill="#F7F8FB"/><path d="M86 150C92 158 108 158 114 150L106 200H94Z" fill="${tc}"/><path d="M85 151L100 178L92 200H72C75 182 79 164 85 151Z" fill="#E3E6EE"/><path d="M115 151L100 178L108 200H128C125 182 121 164 115 151Z" fill="#E3E6EE"/><rect x="120" y="182" width="16" height="12" rx="2" fill="none" stroke="#C9CEDA" stroke-width="2"/><path d="M126 178V186" stroke="${AV.top[2]}" stroke-width="2.6" stroke-linecap="round"/>`
  };
  P.push(tops[a.top] || tops.camiseta);
  if (a.acc === 'cachecol') P.push(`<path d="M78 146C86 158 114 158 122 146L126 160C112 172 88 172 74 160Z" fill="${ht}"/><path d="M110 160L118 196L106 198L102 164Z" fill="${ht2}"/><path d="M106 186H118M107 192H118" stroke="${htL}" stroke-width="2"/>`);
  if (a.acc === 'gravata') P.push(`<path d="M100 160L88 153V167ZM100 160L112 153V167Z" fill="${AV.top[6]}"/><circle cx="100" cy="160" r="3.4" fill="${avShade(AV.top[6], -0.2)}"/>`);
  if (a.acc === 'colar') P.push(`<path d="M86 151C90 164 110 164 114 151" stroke="#E2B13C" stroke-width="2" fill="none"/><circle cx="100" cy="164" r="4" fill="#FF7A22" stroke="#E2B13C" stroke-width="1.6"/>`);

  /* ---- orelhas e rosto ---- */
  P.push(`<circle cx="56" cy="95" r="10" fill="${skin}"/><circle cx="144" cy="95" r="10" fill="${skin}"/><path d="M58 90C53 92 53 99 58 101" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M142 90C147 92 147 99 142 101" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  P.push(`<path d="M56 86C56 57 76 40 100 40S144 57 144 86C144 117 126 139 100 139S56 117 56 86Z" fill="${skin}"/>`);
  if (a.acc === 'brinco') P.push(`<circle cx="56" cy="109" r="3.6" fill="#E2B13C"/><circle cx="144" cy="109" r="3.6" fill="#E2B13C"/>`);
  if (a.acc === 'argola') P.push(`<circle cx="56" cy="112" r="6.5" fill="none" stroke="#E2B13C" stroke-width="2.6"/><circle cx="144" cy="112" r="6.5" fill="none" stroke="#E2B13C" stroke-width="2.6"/>`);

  /* ---- barba (atrás da boca) ---- */
  if (a.beard === 'cheia') P.push(`<path d="M56 90C57 124 76 147 100 147S143 124 144 90C140 108 132 118 122 122C114 114 86 114 78 122C68 118 60 108 56 90Z" fill="${hc}"/>`);
  if (a.beard === 'rala') P.push(`<path d="M58 98C61 126 78 144 100 144S139 126 142 98C138 112 130 122 120 126C112 120 88 120 80 126C70 122 62 112 58 98Z" fill="${hc}" opacity=".22"/>`);
  if (a.beard === 'cavanhaque') P.push(`<path d="M88 130C90 142 110 142 112 130C106 133 94 133 88 130Z" fill="${hc}"/>`);

  /* ---- detalhes do rosto ---- */
  if (a.blush) P.push(`<ellipse cx="73" cy="111" rx="8" ry="4.6" fill="#FF8A7A" opacity=".32"/><ellipse cx="127" cy="111" rx="8" ry="4.6" fill="#FF8A7A" opacity=".32"/>`);
  if (a.face === 'sardas') P.push(`<g fill="${sk3}" opacity=".55">${[[70, 106], [76, 104], [73, 110], [80, 108], [130, 106], [124, 104], [127, 110], [120, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g>`);
  if (a.face === 'pinta') P.push(`<circle cx="124" cy="118" r="1.9" fill="${sk3}"/>`);
  if (a.face === 'curativo') P.push(`<g transform="rotate(-24 128 106)"><rect x="116" y="102" width="24" height="9" rx="4.5" fill="#F3D3B0"/><rect x="124" y="102" width="8" height="9" fill="#E7BF96"/></g>`);
  if (a.face === 'pintura') P.push(`<g transform="translate(70 110)"><rect x="-8" y="-3" width="16" height="3" rx="1.5" fill="#2E5BDB"/><rect x="-8" y="1" width="16" height="3" rx="1.5" fill="#FF7A22"/></g><g transform="translate(130 110)"><rect x="-8" y="-3" width="16" height="3" rx="1.5" fill="#2E5BDB"/><rect x="-8" y="1" width="16" height="3" rx="1.5" fill="#FF7A22"/></g>`);
  P.push(`<path d="M99 101C96.5 108 97.5 112.5 103 112.5" stroke="${sk3}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`);
  if (a.acc === 'piercing') P.push(`<circle cx="104" cy="112" r="2.6" fill="none" stroke="#C9CED6" stroke-width="1.8"/>`);

  /* ---- boca ---- */
  const lip = '#6B2230';
  const mouths = {
    sorriso: `<path d="M88 121C94 128 106 128 112 121" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    aberto: `<path d="M87 119C87 133 113 133 113 119Z" fill="${lip}"/><path d="M93 127C97 124 103 124 107 127C104 130 96 130 93 127Z" fill="#F07A86"/>`,
    dentes: `<path d="M86 118C86 133 114 133 114 118Z" fill="${lip}"/><path d="M88 119H112C111 123 89 123 88 119Z" fill="#FFFFFF"/>`,
    gargalhada: `<path d="M84 116C84 138 116 138 116 116Z" fill="${lip}"/><path d="M86 117H114C113 121 87 121 86 117Z" fill="#FFFFFF"/><path d="M92 130C96 126 104 126 108 130C104 134 96 134 92 130Z" fill="#F07A86"/>`,
    timido: `<path d="M93 122C97 125 103 125 107 122" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    canto: `<path d="M89 123C97 125 105 124 112 118" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    neutro: `<path d="M91 123H109" stroke="${ink}" stroke-width="3.6" stroke-linecap="round"/>`,
    lingua: `<path d="M88 121C94 127 106 127 112 121" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M96 125C96 134 106 134 106 125Z" fill="#F07A86"/><path d="M101 126V130" stroke="#D95A68" stroke-width="1.4" stroke-linecap="round"/>`,
    aparelho: `<path d="M86 118C86 133 114 133 114 118Z" fill="${lip}"/><path d="M88 119H112C111 123 89 123 88 119Z" fill="#FFFFFF"/><path d="M89 121H111" stroke="#A8B0BA" stroke-width="1.6"/>${[92, 97, 103, 108].map((x) => `<rect x="${x - 1.4}" y="119.6" width="2.8" height="2.8" rx=".6" fill="#8D96A3"/>`).join('')}`,
    ooh: `<ellipse cx="100" cy="124" rx="5.5" ry="6.5" fill="${lip}"/>`
  };
  P.push(mouths[a.mouth] || mouths.sorriso);
  if (a.beard === 'bigode' || a.beard === 'cheia' || a.beard === 'cavanhaque') P.push(`<path d="M83 117C89 111 96 111 100 114.5C104 111 111 111 117 117C112 121 104 120 100 118.5C96 120 88 121 83 117Z" fill="${hc}"/>`);

  /* ---- olhos ---- */
  const eye = (x, kind) => ({
    ponto: `<ellipse cx="${x}" cy="95" rx="5.2" ry="6.4" fill="${ink}"/><circle cx="${x + 1.8}" cy="92.6" r="1.7" fill="#fff"/>`,
    grande: `<ellipse cx="${x}" cy="95" rx="9" ry="9.6" fill="#fff"/><circle cx="${x + 1}" cy="96" r="5.8" fill="${ink}"/><circle cx="${x + 3}" cy="93.4" r="2" fill="#fff"/>`,
    brilho: `<ellipse cx="${x}" cy="95" rx="7" ry="8.2" fill="${ink}"/><circle cx="${x + 2.4}" cy="92" r="2.6" fill="#fff"/><circle cx="${x - 2.4}" cy="98.6" r="1.3" fill="#fff"/>`,
    feliz: `<path d="M${x - 6} 97C${x - 3} 91 ${x + 3} 91 ${x + 6} 97" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    sereno: `<path d="M${x - 6} 95C${x - 3} 99 ${x + 3} 99 ${x + 6} 95" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    cilios: `<ellipse cx="${x}" cy="95.5" rx="5.2" ry="6.2" fill="${ink}"/><circle cx="${x + 1.8}" cy="93" r="1.6" fill="#fff"/><path d="M${x - 5} 89.5L${x - 8} 87M${x + 5} 89.5L${x + 8} 87M${x} 88.4V85.4" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`,
    delineado: `<ellipse cx="${x}" cy="95.5" rx="5.2" ry="6" fill="${ink}"/><circle cx="${x + 1.8}" cy="93" r="1.6" fill="#fff"/><path d="M${x - 6} 90.6C${x - 2} 88 ${x + 3} 88 ${x + 6} 90.6L${x + (x < 100 ? -10 : 10)} 87.5" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    determinado: `<ellipse cx="${x}" cy="96.5" rx="5" ry="4.6" fill="${ink}"/><path d="M${x - 7} 92.6H${x + 7}" stroke="${skin}" stroke-width="4"/><path d="M${x - 7} 93.4C${x - 3} 92 ${x + 3} 92 ${x + 7} 93.4" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  }[kind]);
  if (a.eyes === 'piscando') P.push(eye(82, 'ponto') + eye(118, 'feliz'));
  else P.push(eye(82, a.eyes) + eye(118, a.eyes));
  const browC = avShade(hc, -0.1);
  const brows = {
    suave: `<path d="M75 81C79 78 85 78 89 80M111 80C115 78 121 78 125 81" stroke="${browC}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    grossa: `<path d="M74 82C79 77 86 77 90 79M110 79C114 77 121 77 126 82" stroke="${browC}" stroke-width="5.6" fill="none" stroke-linecap="round"/>`,
    arqueada: `<path d="M74 82C78 75 86 75 90 79M110 79C114 75 122 75 126 82" stroke="${browC}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    preocupada: `<path d="M75 81C80 80 86 78 89 75M111 75C114 78 120 80 125 81" stroke="${browC}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    brava: `<path d="M75 77C80 78 86 80 89 83M111 83C114 80 120 78 125 77" stroke="${browC}" stroke-width="4.2" fill="none" stroke-linecap="round"/>`,
    nenhuma: ''
  };
  P.push(brows[a.brows] || '');

  /* ---- cabelo da frente ---- */
  const shaved = `<path d="M56 82C56 54 76 38 100 38S144 54 144 82C140 64 124 51 100 51S60 64 56 82Z" fill="${hc}" opacity=".4"/>`;
  const front = {
    curto: `<path d="M54 86C52 52 74 31 102 31S150 53 146 86C143 73 137 64 128 58C117 66 95 68 77 60C66 66 58 75 54 86Z" fill="${hc}"/>`,
    lateral: `<path d="M54 87C50 50 76 29 104 29S152 51 146 84C140 66 128 56 112 54C99 67 76 73 58 67C56 73 55 80 54 87Z" fill="${hc}"/><path d="M112 54C116 44 128 40 138 44" stroke="${hcL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
    topete: `<path d="M56 84C54 56 70 40 88 38C90 22 114 16 130 26C142 33 147 52 144 84C140 70 130 62 118 60C104 64 84 64 70 60C62 66 58 74 56 84Z" fill="${hc}"/><path d="M96 32C104 24 118 22 128 28" stroke="${hcL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
    undercut: shaved + `<path d="M60 68C58 42 78 26 102 26S148 40 145 68C136 60 120 56 104 58C88 60 72 60 60 68Z" fill="${hc}"/>`,
    raspado: `<path d="M56 80C56 53 76 37 100 37S144 53 144 80C140 63 124 50 100 50S60 63 56 80Z" fill="${hc}" opacity=".85"/>`,
    moicano: shaved + `<path d="M88 46C88 24 112 24 112 46L114 72C108 68 92 68 86 72Z" fill="${hc}"/><path d="M88 30C92 18 108 18 112 30" fill="${hc}"/>`,
    cacheado: `<g fill="${hc}"><path d="M56 84C54 56 74 38 100 38S146 56 144 84C136 70 126 62 114 60C104 66 88 66 80 60C70 64 60 72 56 84Z"/>${[[66, 58], [80, 50], [96, 48], [112, 50], [128, 56], [138, 68]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
    black: `<path d="M58 80C64 58 82 52 100 52S136 58 142 80C136 66 120 60 100 60S64 66 58 80Z" fill="${hc2}" opacity=".35"/>`,
    puff: `<path d="M55 86C53 54 74 36 100 36S147 54 145 86C138 66 122 55 100 55S62 66 55 86Z" fill="${hc}"/>`,
    ondulado: `<path d="M55 88C52 54 76 34 102 34S148 56 145 88C140 70 128 60 112 58C104 68 86 72 70 66C62 72 58 80 55 88Z" fill="${hc}"/><path d="M70 66C80 60 92 60 100 64" stroke="${hcL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
    longo: `<path d="M56 90C53 56 76 35 100 35S147 56 144 90C136 67 118 52 102 50L100 58L98 50C82 52 64 67 56 90Z" fill="${hc}"/>`,
    trancas: `<path d="M56 90C53 56 76 35 100 35S147 56 144 90C136 67 118 52 102 50L100 58L98 50C82 52 64 67 56 90Z" fill="${hc}"/>`,
    chanel: `<path d="M55 84C55 52 76 35 100 35S145 52 145 84C133 73 120 70 100 70S67 73 55 84Z" fill="${hc}"/>`,
    franja: `<path d="M55 80C55 50 76 34 100 34S145 50 145 80C140 77 133 75 127 77C121 71 111 71 105 75C97 69 87 71 81 77C73 73 62 74 55 80Z" fill="${hc}"/>`,
    rabo: `<path d="M55 86C53 54 74 34 100 34S147 54 145 86C138 66 122 55 100 55S62 66 55 86Z" fill="${hc}"/><path d="M76 46C88 40 112 40 124 46" stroke="${hcL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
    chiquinhas: `<path d="M56 90C53 56 76 35 100 35S147 56 144 90C136 67 118 52 102 50L100 58L98 50C82 52 64 67 56 90Z" fill="${hc}"/>`,
    coque: `<path d="M55 86C53 54 74 36 100 36S147 54 145 86C138 66 122 55 100 55S62 66 55 86Z" fill="${hc}"/>`,
    dreads: `<path d="M54 86C52 52 74 33 100 33S148 52 146 86C140 70 126 60 100 60S60 70 54 86Z" fill="${hc}"/><g stroke="${hc}" stroke-width="8" stroke-linecap="round">${[[66, 72], [78, 66], [122, 66], [134, 72]].map(([x, y]) => `<path d="M${x} 56V${y}"/>`).join('')}</g>`,
    careca: `<path d="M74 50C84 44 96 42 108 43" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".25"/>`
  };
  P.push(front[a.hair] || '');
  if (a.acc === 'lapis') P.push(`<g transform="rotate(-62 150 74)"><rect x="132" y="70" width="34" height="7" rx="1.5" fill="#E2B13C"/><path d="M166 70L174 73.5L166 77Z" fill="#F3D3B0"/><path d="M172 72.6L174 73.5L172 74.4Z" fill="${ink}"/><rect x="128" y="70" width="5" height="7" rx="1.5" fill="#F07A86"/></g>`);
  if (a.acc === 'laco') P.push(`<g transform="translate(128 46) rotate(18)"><path d="M0 0L-15 -9V9Z" fill="${AV.top[6]}"/><path d="M0 0L15 -9V9Z" fill="${AV.top[6]}"/><circle r="4.4" fill="${avShade(AV.top[6], -0.2)}"/></g>`);
  if (a.acc === 'flor') P.push(`<g transform="translate(64 52)">${[0, 72, 144, 216, 288].map((r) => `<ellipse rx="5" ry="8" cy="-7" transform="rotate(${r})" fill="#F4A6C0"/>`).join('')}<circle r="4.6" fill="#E2B13C"/></g>`);

  /* ---- óculos ---- */
  const lens = (shape, fill = 'rgba(255,255,255,.18)', sw = 3.4) => mirror(`<path d="${shape}" fill="${fill}" stroke="${fr}" stroke-width="${sw}" stroke-linejoin="round"/>`);
  const arms = (y = 92) => `<path d="M69 ${y}L58 ${y - 2}M131 ${y}L142 ${y - 2}" stroke="${fr}" stroke-width="3.2" stroke-linecap="round"/>`;
  const bridge = (y = 93) => `<path d="M94 ${y}C97 ${y - 3} 103 ${y - 3} 106 ${y}" stroke="${fr}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const gl = {
    redondo: lens('M70 95a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z') + bridge() + arms(93),
    quadrado: lens('M74 85H90A6 6 0 0 1 96 91V100A6 6 0 0 1 90 106H74A6 6 0 0 1 68 100V91A6 6 0 0 1 74 85Z') + `<path d="M96 93H104" stroke="${fr}" stroke-width="3.2" stroke-linecap="round"/>` + arms(92),
    retro: lens('M72 82H92A6 6 0 0 1 98 88V102A8 8 0 0 1 90 110H74A8 8 0 0 1 66 102V88A6 6 0 0 1 72 82Z', 'rgba(255,255,255,.16)', 2.6) + `<path d="M98 90H102" stroke="${fr}" stroke-width="2.6" stroke-linecap="round"/>` + arms(90),
    gatinho: lens('M68 88C76 84 90 84 96 89C97 99 91 106 82 106C73 106 67 99 68 88ZM68 88L61 82L66 93Z') + bridge(92) + arms(91),
    aviador: lens('M69 87H95C97 97 94 107 84 108C73 109 67 99 69 87Z', 'rgba(140,170,210,.35)', 2.8) + `<path d="M95 87H105M96 90.5C98 89 102 89 104 90.5" stroke="${fr}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` + arms(89),
    meia: mirror(`<path d="M69 88H95" stroke="${fr}" stroke-width="6" stroke-linecap="round"/><path d="M69 89C69 101 75 106 82 106C89 106 95 101 95 89" fill="rgba(255,255,255,.16)" stroke="${fr}" stroke-width="1.8"/>`) + `<path d="M95 89H105" stroke="${fr}" stroke-width="3" stroke-linecap="round"/>` + arms(89),
    hex: lens('M76 84H88L95 95L88 106H76L69 95Z') + `<path d="M95 95H105" stroke="${fr}" stroke-width="3.2" stroke-linecap="round"/>` + arms(93),
    leitura: lens('M69 98H95C95 104 90 108 82 108C74 108 69 104 69 98Z', 'rgba(255,255,255,.18)', 3) + `<path d="M95 99C98 97 102 97 105 99" stroke="${fr}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M69 99L58 94M131 99L142 94" stroke="${fr}" stroke-width="3" stroke-linecap="round"/>`,
    sol: lens('M75 85H89A8 8 0 0 1 97 93V97A8 8 0 0 1 89 105H75A8 8 0 0 1 67 97V93A8 8 0 0 1 75 85Z', AV_INK, 3) + `<path d="M97 92H103" stroke="${fr}" stroke-width="3.4" stroke-linecap="round"/>` + arms(91) + `<path d="M73 90L80 90M109 90L116 90" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`,
    coracao: lens('M82 106C72 99 66 94 67 88C68 83 75 81 82 87C89 81 96 83 97 88C98 94 92 99 82 106Z', 'rgba(240,122,134,.45)', 3) + `<path d="M97 90H103" stroke="${fr}" stroke-width="3" stroke-linecap="round"/>` + arms(89),
    monoculo: `<circle cx="118" cy="95" r="12" fill="rgba(255,255,255,.18)" stroke="${fr}" stroke-width="3.4"/><path d="M130 99C138 114 134 128 128 140" stroke="${fr}" stroke-width="1.8" fill="none"/>`
  };
  P.push(gl[a.glasses] || '');

  /* ---- chapéus e itens de cabeça ---- */
  const hats = {
    bone: `<path d="M53 74C53 44 74 27 100 27S147 44 147 74Z" fill="${ht}"/><path d="M98 70C124 64 162 67 174 78C162 85 122 83 98 78Z" fill="${ht2}"/><circle cx="100" cy="28" r="4" fill="${ht2}"/><circle cx="84" cy="54" r="5" fill="#fff" opacity=".9"/>`,
    bonetras: `<path d="M53 74C53 44 74 27 100 27S147 44 147 74Z" fill="${ht}"/><path d="M60 64C46 62 34 66 28 74C38 80 52 80 60 76Z" fill="${ht2}"/><path d="M84 66C88 60 112 60 116 66" stroke="${ht2}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="100" cy="28" r="4" fill="${ht2}"/>`,
    touca: `<path d="M52 80C50 42 74 24 100 24S150 42 148 80Z" fill="${ht}"/><path d="M50 70H150V84C120 90 80 90 50 84Z" fill="${ht2}"/><g stroke="${ht}" stroke-width="2" opacity=".5">${[62, 74, 86, 98, 110, 122, 134].map((x) => `<path d="M${x} 72V84"/>`).join('')}</g><circle cx="100" cy="22" r="9" fill="${htL}"/>`,
    bucket: `<path d="M60 70C60 42 78 30 100 30S140 42 140 70Z" fill="${ht}"/><path d="M42 80C50 64 150 64 158 80C150 87 50 87 42 80Z" fill="${ht2}"/><path d="M62 62H138" stroke="${htL}" stroke-width="3" opacity=".6"/>`,
    fedora: `<path d="M62 66C60 40 74 30 100 30S140 40 138 66Z" fill="${ht}"/><path d="M92 32C96 38 104 38 108 32" stroke="${ht2}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M62 56H138V66H62Z" fill="${AV_INK}" opacity=".8"/><path d="M34 72C50 60 150 60 166 72C150 80 50 80 34 72Z" fill="${ht2}"/>`,
    capelo: `<path d="M68 44V62C80 70 120 70 132 62V44Z" fill="${avShade(ht, -0.3)}"/><path d="M100 22L162 40L100 58L38 40Z" fill="${ht}"/><path d="M100 40L148 46V66" stroke="#E2B13C" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M144 64H152L150 76H146Z" fill="#E2B13C"/><circle cx="100" cy="40" r="3.4" fill="#E2B13C"/>`,
    viseira: `<path d="M56 66C80 58 120 58 144 66V75C120 68 80 68 56 75Z" fill="${ht}"/><path d="M68 70C90 63 132 63 152 72C142 84 90 84 68 78Z" fill="${ht2}"/>`,
    faixa: `<path d="M55 62C80 54 120 54 145 62V74C120 66 80 66 55 74Z" fill="${ht}"/><path d="M98 57H102V69H98Z" fill="#fff" opacity=".85"/>`,
    bandana: `<path d="M54 72C54 44 76 30 100 30S146 44 146 72C120 62 80 62 54 72Z" fill="${ht}"/><path d="M144 66L164 56L160 74Z" fill="${ht2}"/><path d="M145 70L160 84L150 88Z" fill="${ht2}"/><g fill="#fff" opacity=".75">${[[78, 48], [98, 42], [118, 48], [88, 58], [110, 58], [130, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')}</g>`,
    arco: `<path d="M58 72C60 40 140 40 142 72" stroke="${ht}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 64C64 46 136 46 140 64" stroke="${htL}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`,
    coroa: `<path d="M64 58L68 28L86 44L100 22L114 44L132 28L136 58Z" fill="#E2B13C"/><path d="M64 52H136V60H64Z" fill="#C9962E"/><circle cx="100" cy="44" r="4" fill="${AV.top[6]}"/><circle cx="80" cy="50" r="3" fill="${AV.top[2]}"/><circle cx="120" cy="50" r="3" fill="${AV.top[2]}"/>`,
    fone: `<path d="M48 96C44 42 156 42 152 96" stroke="${AV_INK}" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="40" y="82" width="16" height="28" rx="8" fill="${ht}"/><rect x="144" y="82" width="16" height="28" rx="8" fill="${ht}"/>`
  };
  P.push(hats[a.hat] || '');

  const vb = opts.view || '0 0 200 200';
  const title = opts.title ? `<title>${esc(opts.title)}</title>` : '';
  return `<svg class="avsvg" viewBox="${vb}" role="img" aria-label="${esc(opts.title || 'Avatar')}">${title}<defs><clipPath id="${id}"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="${opts.view ? 'none' : `url(#${id})`}">${P.join('')}</g></svg>`;
}
// Avatar pronto para usar em qualquer lugar (cabeçalho, perfil, ranking da turma).
function avatarHTML(cfg, cls = '', title = '') { return `<span class="av ${cls}">${avatarSVG(cfg, { title })}</span>`; }
function avatarOf(name, cfg) { return cfg ? avatarHTML(cfg, 'sm', name) : avatarHTML(avDefault(name), 'sm', name); }

/* ---------- Editor ---------- */
const AV_GROUPS = [
  ['rosto', 'Rosto', 'user', [['skin', 'Tom de pele', 'sw'], ['eyes', 'Olhos'], ['brows', 'Sobrancelhas'], ['mouth', 'Boca'], ['face', 'Detalhes']]],
  ['cabelo', 'Cabelo', 'mind', [['hair', 'Estilo'], ['hc', 'Cor do cabelo', 'sw'], ['beard', 'Barba e bigode']]],
  ['roupa', 'Roupa', 'work', [['top', 'Peça'], ['tc', 'Cor da roupa', 'sw']]],
  ['cabeca', 'Chapéus', 'school', [['hat', 'Chapéu e cabeça'], ['hatc', 'Cor do chapéu e do cachecol', 'sw']]],
  ['oculos', 'Óculos', 'eye', [['glasses', 'Modelo'], ['gc', 'Cor da armação', 'sw']]],
  ['extras', 'Extras', 'trophy', [['acc', 'Acessórios']]],
  ['fundo', 'Fundo', 'target', [['bg', 'Cor', 'sw'], ['bgp', 'Estampa']]]
];
const AV_SW = { skin: () => AV.skin, hc: () => AV.hairc, tc: () => AV.top, hatc: () => AV.top, gc: () => AV.frame, bg: () => AV.bg };
const AV_VIEW = { eyes: '52 58 96 96', brows: '52 52 96 96', mouth: '58 74 84 84', face: '50 64 100 100', glasses: '46 56 108 108', beard: '46 62 108 108', hat: '20 0 160 160', hair: '10 0 180 180', acc: '24 24 152 152', top: '10 80 180 120', bgp: null };
const AVED = { cfg: null, grp: 'rosto', orig: null, hist: [] };
function openAvatarEditor() {
  AVED.orig = avatarConfig(); AVED.cfg = Object.assign({}, AVED.orig); AVED.hist = [];
  ui.tab = 'avatar'; render(); $('#view').scrollTop = 0;
}
function avSection([key, label, kind]) {
  const c = AVED.cfg;
  if (kind === 'sw') {
    const list = AV_SW[key]();
    const extra = key === 'skin' ? `<label class="avtoggle"><span>Bochechas rosadas</span><button class="switch" role="switch" aria-checked="${c.blush}" data-act="av-blush" aria-label="Bochechas rosadas"></button></label>` : '';
    return `<section class="avsec"><h3>${label}</h3><div class="avsw">${list.map((col, i) => `<button class="sw ${c[key] === i ? 'on' : ''}" data-act="av-set" data-k="${key}" data-v="${i}" style="--c:${col}" aria-label="${label} ${i + 1}" aria-pressed="${c[key] === i}"></button>`).join('')}</div>${extra}</section>`;
  }
  const view = AV_VIEW[key];
  return `<section class="avsec"><h3>${label}</h3><div class="avgrid">${AV_OPTS[key].map((v) => {
    const t = Object.assign({}, c, { [key]: v });
    const r = typeof itemRule === 'function' ? itemRule(key, v) : null; const own = !r || itemOwned(key, v);
    const tag = own ? '' : `<span class="lock">${r.price && !r.level ? coinIco() + r.price : ico('key')}</span>`;
    return `<button class="avopt ${c[key] === v ? 'on' : ''} ${own ? '' : 'locked'}" data-act="av-set" data-k="${key}" data-v="${v}" aria-pressed="${c[key] === v}" ${own ? '' : `aria-label="${esc(AV_LABEL[v] || v)}, ${esc(itemLockText(r))}"`}><span class="avthumb ${view ? 'crop' : ''}">${avatarSVG(t, view ? { view } : {})}${tag}</span><span>${AV_LABEL[v] || v}</span></button>`;
  }).join('')}</div></section>`;
}
function avOptionsHTML() { const g = AV_GROUPS.find((x) => x[0] === AVED.grp) || AV_GROUPS[0]; return g[3].map(avSection).join(''); }
function viewAvatar() {
  if (!AVED.cfg) { AVED.orig = avatarConfig(); AVED.cfg = Object.assign({}, AVED.orig); AVED.hist = []; }
  const changed = JSON.stringify(AVED.cfg) !== JSON.stringify(AVED.orig);
  return `<div class="avpage">
    <div class="avstage ${avLum(AV.bg[AVED.cfg.bg]) < 0.5 ? 'on-dark' : ''}" style="--avbg:${AV.bg[AVED.cfg.bg]}">
      <div class="avtop"><button class="icon-btn" data-act="av-cancel" aria-label="Voltar sem salvar">${ico('back')}</button><span class="avbal" title="Suas moedas">${coinIco()}<b class="num" id="av-bal">${coinsBal()}</b></span><div class="avtop-r"><button class="icon-btn" data-act="av-undo" aria-label="Desfazer" ${AVED.hist.length ? '' : 'disabled'}>${ico('recall')}</button><button class="icon-btn" data-act="av-random" aria-label="Sortear um visual">${ico('shuffle')}</button></div></div>
      <div class="avpreview" id="av-preview">${avatarSVG(AVED.cfg, { title: 'Seu avatar' })}</div>
      <div class="avgroups" role="tablist" aria-label="Partes do avatar">${AV_GROUPS.map(([k, l, i]) => `<button class="avg" role="tab" data-act="av-grp" data-k="${k}" aria-selected="${AVED.grp === k}"><span class="tile">${ico(i)}</span><span>${l}</span></button>`).join('')}</div>
    </div>
    <div class="avpanel" id="av-opts">${avOptionsHTML()}</div>
    <div class="dock"><button class="btn btn-ghost" data-act="av-cancel">Cancelar</button><button class="btn btn-orange" data-act="av-try-save" ${changed || !S.user.avatar ? '' : 'disabled'}>Salvar avatar</button></div>
  </div>`;
}
function avRepaint(panel = true) {
  const pv = document.getElementById('av-preview'); if (pv) { pv.innerHTML = avatarSVG(AVED.cfg, { title: 'Seu avatar' }); if (!REDUCED) { pv.classList.remove('bump'); void pv.offsetWidth; pv.classList.add('bump'); } }
  const st = document.querySelector('.avstage'); if (st) { st.style.setProperty('--avbg', AV.bg[AVED.cfg.bg]); st.classList.toggle('on-dark', avLum(AV.bg[AVED.cfg.bg]) < 0.5); }
  if (panel) { const op = document.getElementById('av-opts'); if (op) op.innerHTML = avOptionsHTML(); }
  const sv = document.querySelector('[data-act="av-try-save"]'); if (sv) { sv.disabled = false; const n = lockedInCfg(AVED.cfg).length; sv.textContent = n ? 'Salvar · ' + plural(n, 'item da loja', 'itens da loja') : 'Salvar avatar'; }
  const un = document.querySelector('[data-act="av-undo"]'); if (un) un.disabled = !AVED.hist.length;
}
function avPush() { AVED.hist.push(Object.assign({}, AVED.cfg)); if (AVED.hist.length > 40) AVED.hist.shift(); }
Object.assign(ACT, {
  'av-open': () => openAvatarEditor(),
  'av-later': () => { S.user.avSeen = 1; persist(); render(); },
  'av-grp': (d) => {
    AVED.grp = d.k;
    document.querySelectorAll('.avg').forEach((b) => b.setAttribute('aria-selected', b.dataset.k === d.k));
    const op = document.getElementById('av-opts'); if (op) op.innerHTML = avOptionsHTML();
    const v = $('#view'), panel = document.getElementById('av-opts'); if (v && panel && v.scrollTop > panel.offsetTop - 260) v.scrollTop = Math.max(0, panel.offsetTop - 260);
    const ch = document.querySelector(`.avg[data-k="${d.k}"]`); if (ch) ch.scrollIntoView({ inline: 'center', block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
  },
  'av-set': (d) => {
    const num = d.k in AV_SW; const val = num ? Number(d.v) : d.v;
    if (AVED.cfg[d.k] === val) return;
    avPush(); AVED.cfg[d.k] = val; avRepaint();
  },
  'av-blush': () => { avPush(); AVED.cfg.blush = !AVED.cfg.blush; avRepaint(); },
  'av-undo': () => { if (!AVED.hist.length) return; AVED.cfg = AVED.hist.pop(); avRepaint(); },
  'av-random': () => {
    avPush();
    const r = (n) => Math.floor(Math.random() * n), pick = (l, p = 1) => (Math.random() < p ? l[1 + r(l.length - 1)] : l[0]), o = AV_OPTS;
    const hair = o.hair[r(o.hair.length - 1)];
    AVED.cfg = avNormalize({
      skin: r(AV.skin.length), hair, hc: Math.random() < 0.85 ? r(11) : r(AV.hairc.length), eyes: o.eyes[r(o.eyes.length)], brows: o.brows[r(5)], mouth: o.mouth[r(o.mouth.length)],
      face: pick(o.face, 0.25), beard: pick(o.beard, 0.25), hat: pick(o.hat, 0.35), hatc: r(AV.top.length), glasses: pick(o.glasses, 0.35), gc: r(AV.frame.length), acc: pick(o.acc, 0.3),
      top: o.top[r(o.top.length)], tc: r(AV.top.length), bg: r(AV.bg.length), bgp: pick(o.bgp, 0.5), blush: Math.random() < 0.7
    });
    avRepaint();
  },
  'av-try-save': () => {
    const items = lockedInCfg(AVED.cfg);
    if (!items.length) return ACT['av-save']();
    const buyable = items.filter((x) => x.r.price), blocked = items.filter((x) => !x.r.price);
    const total = buyable.reduce((s2, x) => s2 + x.r.price, 0), bal = coinsBal();
    const row = (x) => `<div class="item"><span class="avthumb sm">${avatarSVG(Object.assign({}, AVED.cfg), AV_VIEW[x.k] ? { view: AV_VIEW[x.k] } : {})}</span><div class="main"><b>${esc(AV_LABEL[x.v] || x.v)}</b><span>${esc(itemLockText(x.r))}</span></div>${x.r.price ? `<span class="end num">${coinIco()}${x.r.price}</span>` : ico('key')}</div>`;
    ui.sheet = `<div class="blk" style="gap:6px"><h2>${blocked.length ? 'Item ainda bloqueado' : 'Itens novos no visual'}</h2><p class="muted small">${blocked.length ? 'Alguns itens só liberam com conquistas ou nível. Você pode continuar testando o visual.' : 'Você está usando itens da loja. Compre para salvar este visual.'}</p></div>
      <div class="list">${items.map(row).join('')}</div>
      ${blocked.length ? `<button class="btn btn-primary btn-block" data-act="sheet-close">Entendi</button>` : bal >= total
        ? `<div class="duo"><button class="btn btn-ghost" data-act="sheet-close">Voltar</button><button class="btn btn-orange" data-act="shop-buy">Comprar · ${total} moedas</button></div><p class="tiny" style="text-align:center">Saldo depois da compra: ${bal - total} moedas</p>`
        : `<div class="notice">Faltam <b>${total - bal} moedas</b>. Você ganha estudando: 1 a 2 por acerto, 5 por ciclo, 5 por missão, 20 por conquista e o baú do dia.</div><button class="btn btn-primary btn-block" data-act="sheet-close">Continuar montando</button>`}`;
    renderSheet();
  },
  'av-save': () => { S.user.avatar = avNormalize(AVED.cfg); S.user.avSeen = 1; persist(); AVED.cfg = null; ui.tab = 'perfil'; render(); $('#view').scrollTop = 0; notify('Avatar salvo.'); },
  'av-cancel': () => { AVED.cfg = null; ui.tab = 'perfil'; render(); $('#view').scrollTop = 0; }
});
