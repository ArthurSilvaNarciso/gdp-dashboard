/* ================= Avatar do Memory (monte o seu personagem) ================= */
// Ilustração vetorial em camadas, desenhada para a marca: formas chapadas, sem contorno, cantos suaves.
// Tudo é gerado em SVG a partir de uma configuração pequena (cabe no progresso e sincroniza entre aparelhos).
const AV = {
  skin: ['#FFE3D1', '#F8CDAF', '#EDB68F', '#D99C72', '#C1825A', '#9F643F', '#7B472B', '#56321F'],
  hairc: ['#1E1A1D', '#3B2A22', '#6B4630', '#A0582F', '#D6A35C', '#EBD7A8', '#A3A8AE', '#2E3C8F', '#FF7A22', '#E58BB0'],
  top: ['#1F2A6B', '#FF7A22', '#2E5BDB', '#14945A', '#6648D8', '#E2B13C', '#D9465F', '#F1F2F6', '#2A2E3D', '#8DA2B6'],
  bg: ['#FFE7D4', '#DFE8FF', '#D6F2E5', '#E7E2FF', '#FFEFBA', '#FFE0E8', '#1F2A6B', '#EEF0F7']
};
const AV_OPTS = {
  hair: ['curto', 'lateral', 'raspado', 'cacheado', 'black', 'longo', 'chanel', 'rabo', 'coque', 'trancas', 'careca'],
  eyes: ['ponto', 'grande', 'feliz', 'sereno', 'piscando', 'cilios'],
  brows: ['suave', 'grossa', 'arqueada', 'nenhuma'],
  mouth: ['sorriso', 'aberto', 'dentes', 'neutro', 'canto', 'ooh'],
  beard: ['nenhuma', 'rala', 'bigode', 'cheia'],
  glasses: ['nenhum', 'redondo', 'quadrado', 'sol'],
  acc: ['nenhum', 'bone', 'touca', 'fone', 'brinco', 'laco'],
  top: ['camiseta', 'moletom', 'camisa', 'blazer', 'gola', 'memory']
};
const AV_LABEL = {
  curto: 'Curto', lateral: 'Lateral', raspado: 'Raspado', cacheado: 'Cacheado', black: 'Black', longo: 'Longo', chanel: 'Chanel', rabo: 'Rabo de cavalo', coque: 'Coque', trancas: 'Tranças', careca: 'Sem cabelo',
  ponto: 'Clássico', grande: 'Brilhantes', feliz: 'Sorrindo', sereno: 'Sereno', piscando: 'Piscando', cilios: 'Cílios',
  suave: 'Suave', grossa: 'Marcada', arqueada: 'Arqueada', nenhuma: 'Nenhuma',
  sorriso: 'Sorriso', aberto: 'Animado', dentes: 'Radiante', neutro: 'Neutro', canto: 'De canto', ooh: 'Surpreso',
  rala: 'Por fazer', bigode: 'Bigode', cheia: 'Cheia',
  nenhum: 'Nenhum', redondo: 'Redondo', quadrado: 'Quadrado', sol: 'De sol',
  bone: 'Boné', touca: 'Touca', fone: 'Fone', brinco: 'Brincos', laco: 'Laço',
  camiseta: 'Camiseta', moletom: 'Moletom', camisa: 'Camisa', blazer: 'Blazer', gola: 'Gola alta', memory: 'Memory'
};
function avShade(hex, amt) { // amt < 0 escurece, > 0 clareia
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const avPick = (list, v, d = 0) => (list.includes(v) ? v : list[d]);
const avIdx = (v, len, d = 0) => (Number.isInteger(v) && v >= 0 && v < len ? v : d);
function avNormalize(a) {
  a = a && typeof a === 'object' ? a : {};
  return {
    v: 1, skin: avIdx(a.skin, AV.skin.length, 1), hair: avPick(AV_OPTS.hair, a.hair), hc: avIdx(a.hc, AV.hairc.length, 1),
    eyes: avPick(AV_OPTS.eyes, a.eyes), brows: avPick(AV_OPTS.brows, a.brows), mouth: avPick(AV_OPTS.mouth, a.mouth), beard: avPick(AV_OPTS.beard, a.beard),
    glasses: avPick(AV_OPTS.glasses, a.glasses), acc: avPick(AV_OPTS.acc, a.acc), top: avPick(AV_OPTS.top, a.top), tc: avIdx(a.tc, AV.top.length, 0),
    bg: avIdx(a.bg, AV.bg.length, 0), blush: a.blush !== false
  };
}
// Avatar padrão estável a partir do nome (nunca fica em branco).
function avDefault(seed) {
  let h = 0; for (const ch of String(seed || 'memory')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = (n) => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) % n; };
  const hair = ['curto', 'lateral', 'cacheado', 'longo', 'chanel', 'rabo', 'coque', 'black'][r(8)];
  return avNormalize({ skin: r(8), hair, hc: [0, 1, 2, 3, 4, 1, 0][r(7)], eyes: ['ponto', 'grande', 'feliz'][r(3)], brows: 'suave', mouth: ['sorriso', 'dentes', 'aberto'][r(3)], beard: 'nenhuma', glasses: r(5) === 0 ? 'redondo' : 'nenhum', acc: 'nenhum', top: ['camiseta', 'moletom', 'camisa', 'memory'][r(4)], tc: [0, 1, 2, 3, 4, 8][r(6)], bg: r(6), blush: true });
}
function avatarConfig() { return S.user.avatar ? avNormalize(S.user.avatar) : avDefault(S.user.name); }

let AV_UID = 0;
function avatarSVG(cfg, opts = {}) {
  const a = avNormalize(cfg);
  const skin = AV.skin[a.skin], sk2 = avShade(skin, -0.12), sk3 = avShade(skin, -0.26);
  const hc = AV.hairc[a.hc], hc2 = avShade(hc, -0.22), hcL = avShade(hc, 0.16);
  const tc = AV.top[a.tc], tc2 = avShade(tc, -0.18), tcL = avShade(tc, 0.14);
  const ink = '#1E1A1D', id = 'av' + (++AV_UID);
  const vb = opts.face ? '42 34 116 116' : '0 0 200 200';
  const P = [];
  if (!opts.face) P.push(`<rect width="200" height="200" fill="${AV.bg[a.bg]}"/>`);
  else P.push(`<rect x="0" y="0" width="200" height="200" fill="${AV.bg[a.bg]}"/>`);

  /* ---- cabelo de trás ---- */
  const back = {
    longo: `<path d="M50 86C46 46 72 27 100 27S154 46 150 86L156 170C130 182 70 182 44 170Z" fill="${hc}"/>`,
    trancas: `<path d="M50 86C46 46 72 27 100 27S154 46 150 86L156 172C130 184 70 184 44 172Z" fill="${hc}"/>` + [60, 74, 126, 140].map((x) => `<path d="M${x} 120v52" stroke="${hc2}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>`).join(''),
    chanel: `<path d="M47 92C43 52 70 29 100 29S157 52 153 92V124C153 133 145 137 137 135H63C55 137 47 133 47 124Z" fill="${hc}"/>`,
    rabo: `<path d="M134 50C166 54 174 98 162 136C158 114 151 93 138 76Z" fill="${hc}"/><circle cx="138" cy="56" r="6" fill="${AV.top[1]}"/>`,
    coque: `<circle cx="100" cy="28" r="19" fill="${hc}"/><path d="M86 38C92 33 108 33 114 38" stroke="${hc2}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    black: `<g fill="${hc}"><circle cx="100" cy="70" r="58"/>${[[50, 52], [64, 30], [88, 18], [112, 18], [136, 30], [150, 52], [156, 80], [44, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20"/>`).join('')}</g>`,
    cacheado: `<g fill="${hc}">${[[56, 70], [62, 50], [78, 36], [100, 31], [122, 36], [138, 50], [144, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18"/>`).join('')}</g>`
  }[a.hair] || '';
  P.push(back);

  /* ---- pescoço, roupa ---- */
  P.push(`<path d="M86 122V151C92 158 108 158 114 151V122Z" fill="${skin}"/><path d="M86 128C94 138 106 138 114 128V140C106 147 94 147 86 140Z" fill="${sk2}"/>`);
  const body = `M26 200C28 172 52 154 86 150C92 157 108 157 114 150C148 154 172 172 174 200Z`;
  const tops = {
    camiseta: `<path d="${body}" fill="${tc}"/><path d="M86 150C92 160 108 160 114 150" stroke="${tc2}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    memory: `<path d="${body}" fill="${AV.top[0]}"/><path d="M86 150C92 160 108 160 114 150" stroke="${avShade(AV.top[0], -0.25)}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="122" cy="180" r="6" fill="#4A5BD6"/><circle cx="129" cy="180" r="6" fill="#FF7A22"/><path d="M125.5 175.2a6 6 0 0 1 0 9.6a6 6 0 0 1 0-9.6Z" fill="#B4482A"/>`,
    moletom: `<path d="${body}" fill="${tc}"/><path d="M70 154C76 140 124 140 130 154C122 166 78 166 70 154Z" fill="${tc2}"/><path d="M86 150C92 158 108 158 114 150" fill="${skin}"/><path d="M94 160L92 182M106 160L108 182" stroke="${tcL}" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="184" r="2.6" fill="${tcL}"/><circle cx="108" cy="184" r="2.6" fill="${tcL}"/>`,
    camisa: `<path d="${body}" fill="${tc}"/><path d="M86 149L100 165L91 173L78 155Z" fill="#FFFFFF"/><path d="M114 149L100 165L109 173L122 155Z" fill="#FFFFFF"/><circle cx="100" cy="180" r="2.4" fill="${tc2}"/><circle cx="100" cy="192" r="2.4" fill="${tc2}"/>`,
    blazer: `<path d="${body}" fill="${tc}"/><path d="M86 150L100 180L114 150C108 156 92 156 86 150Z" fill="#FFFFFF"/><path d="M85 151L100 181L91 200H70C74 181 78 163 85 151Z" fill="${tc2}"/><path d="M115 151L100 181L109 200H130C126 181 122 163 115 151Z" fill="${tc2}"/><circle cx="100" cy="190" r="2.4" fill="${tcL}"/>`,
    gola: `<path d="${body}" fill="${tc}"/><path d="M82 136H118L120 156C110 163 90 163 80 156Z" fill="${tc2}"/><path d="M84 144H116M83 151H117" stroke="${tc}" stroke-width="2" opacity=".5"/>`
  };
  P.push(tops[a.top] || tops.camiseta);

  /* ---- orelhas e rosto ---- */
  P.push(`<circle cx="56" cy="95" r="10" fill="${skin}"/><circle cx="144" cy="95" r="10" fill="${skin}"/><path d="M58 90C53 92 53 99 58 101" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M142 90C147 92 147 99 142 101" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  P.push(`<path d="M56 86C56 57 76 40 100 40S144 57 144 86C144 117 126 139 100 139S56 117 56 86Z" fill="${skin}"/>`);
  if (a.acc === 'brinco') P.push(`<circle cx="56" cy="109" r="3.6" fill="#E2B13C"/><circle cx="144" cy="109" r="3.6" fill="#E2B13C"/>`);

  /* ---- barba (atrás da boca) ---- */
  if (a.beard === 'cheia') P.push(`<path d="M56 90C57 124 76 147 100 147S143 124 144 90C140 108 132 118 122 122C114 114 86 114 78 122C68 118 60 108 56 90Z" fill="${hc}"/>`);
  if (a.beard === 'rala') P.push(`<path d="M58 98C61 126 78 144 100 144S139 126 142 98C138 112 130 122 120 126C112 120 88 120 80 126C70 122 62 112 58 98Z" fill="${hc}" opacity=".22"/>`);

  /* ---- bochechas, nariz ---- */
  if (a.blush) P.push(`<ellipse cx="73" cy="111" rx="8" ry="4.6" fill="#FF8A7A" opacity=".32"/><ellipse cx="127" cy="111" rx="8" ry="4.6" fill="#FF8A7A" opacity=".32"/>`);
  P.push(`<path d="M99 101C96.5 108 97.5 112.5 103 112.5" stroke="${sk3}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`);

  /* ---- boca ---- */
  const mouths = {
    sorriso: `<path d="M88 121C94 128 106 128 112 121" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    aberto: `<path d="M87 119C87 133 113 133 113 119Z" fill="#6B2230"/><path d="M93 127C97 124 103 124 107 127C104 130 96 130 93 127Z" fill="#F07A86"/>`,
    dentes: `<path d="M86 118C86 133 114 133 114 118Z" fill="#6B2230"/><path d="M88 119H112C111 123 89 123 88 119Z" fill="#FFFFFF"/>`,
    neutro: `<path d="M91 123H109" stroke="${ink}" stroke-width="3.6" stroke-linecap="round"/>`,
    canto: `<path d="M89 123C97 125 105 124 112 118" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    ooh: `<ellipse cx="100" cy="124" rx="5.5" ry="6.5" fill="#6B2230"/>`
  };
  P.push(mouths[a.mouth] || mouths.sorriso);
  if (a.beard === 'bigode' || a.beard === 'cheia') P.push(`<path d="M83 117C89 111 96 111 100 114.5C104 111 111 111 117 117C112 121 104 120 100 118.5C96 120 88 121 83 117Z" fill="${hc}"/>`);

  /* ---- olhos e sobrancelhas ---- */
  const eye = (x, kind) => ({
    ponto: `<ellipse cx="${x}" cy="95" rx="5.2" ry="6.4" fill="${ink}"/><circle cx="${x + 1.8}" cy="92.6" r="1.7" fill="#fff"/>`,
    grande: `<ellipse cx="${x}" cy="95" rx="9" ry="9.6" fill="#fff"/><circle cx="${x + 1}" cy="96" r="5.8" fill="${ink}"/><circle cx="${x + 3}" cy="93.4" r="2" fill="#fff"/>`,
    feliz: `<path d="M${x - 6} 97C${x - 3} 91 ${x + 3} 91 ${x + 6} 97" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    sereno: `<path d="M${x - 6} 95C${x - 3} 99 ${x + 3} 99 ${x + 6} 95" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    cilios: `<ellipse cx="${x}" cy="95.5" rx="5.2" ry="6.2" fill="${ink}"/><circle cx="${x + 1.8}" cy="93" r="1.6" fill="#fff"/><path d="M${x - 5} 89.5L${x - 8} 87M${x + 5} 89.5L${x + 8} 87M${x} 88.4V85.4" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`
  }[kind]);
  if (a.eyes === 'piscando') P.push(eye(82, 'ponto') + eye(118, 'feliz'));
  else P.push(eye(82, a.eyes) + eye(118, a.eyes));
  const browC = avShade(hc, -0.1);
  const brows = {
    suave: `<path d="M75 81C79 78 85 78 89 80M111 80C115 78 121 78 125 81" stroke="${browC}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    grossa: `<path d="M74 82C79 77 86 77 90 79M110 79C114 77 121 77 126 82" stroke="${browC}" stroke-width="5.6" fill="none" stroke-linecap="round"/>`,
    arqueada: `<path d="M74 82C78 75 86 75 90 79M110 79C114 75 122 75 126 82" stroke="${browC}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    nenhuma: ''
  };
  P.push(brows[a.brows] || '');

  /* ---- cabelo da frente ---- */
  const front = {
    curto: `<path d="M54 86C52 52 74 31 102 31S150 53 146 86C143 73 137 64 128 58C117 66 95 68 77 60C66 66 58 75 54 86Z" fill="${hc}"/>`,
    lateral: `<path d="M54 87C50 50 76 29 104 29S152 51 146 84C140 66 128 56 112 54C99 67 76 73 58 67C56 73 55 80 54 87Z" fill="${hc}"/><path d="M112 54C116 44 128 40 138 44" stroke="${hcL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
    raspado: `<path d="M56 80C56 53 76 37 100 37S144 53 144 80C140 63 124 50 100 50S60 63 56 80Z" fill="${hc}" opacity=".85"/>`,
    cacheado: `<g fill="${hc}"><path d="M56 84C54 56 74 38 100 38S146 56 144 84C136 70 126 62 114 60C104 66 88 66 80 60C70 64 60 72 56 84Z"/>${[[66, 58], [80, 50], [96, 48], [112, 50], [128, 56], [138, 68]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
    black: `<path d="M58 80C64 58 82 52 100 52S136 58 142 80C136 66 120 60 100 60S64 66 58 80Z" fill="${hc2}" opacity=".35"/>`,
    longo: `<path d="M56 90C53 56 76 35 100 35S147 56 144 90C136 67 118 52 102 50L100 58L98 50C82 52 64 67 56 90Z" fill="${hc}"/>`,
    trancas: `<path d="M56 90C53 56 76 35 100 35S147 56 144 90C136 67 118 52 102 50L100 58L98 50C82 52 64 67 56 90Z" fill="${hc}"/>`,
    chanel: `<path d="M55 84C55 52 76 35 100 35S145 52 145 84C133 73 120 70 100 70S67 73 55 84Z" fill="${hc}"/>`,
    rabo: `<path d="M55 86C53 54 74 34 100 34S147 54 145 86C138 66 122 55 100 55S62 66 55 86Z" fill="${hc}"/><path d="M76 46C88 40 112 40 124 46" stroke="${hcL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
    coque: `<path d="M55 86C53 54 74 36 100 36S147 54 145 86C138 66 122 55 100 55S62 66 55 86Z" fill="${hc}"/>`,
    careca: `<path d="M74 50C84 44 96 42 108 43" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".25"/>`
  };
  P.push(front[a.hair] || '');

  /* ---- óculos ---- */
  const gl = {
    redondo: `<g fill="rgba(255,255,255,.18)" stroke="${ink}" stroke-width="3.4"><circle cx="82" cy="95" r="12"/><circle cx="118" cy="95" r="12"/></g><path d="M94 94C97 91 103 91 106 94M70 93L58 90M130 93L142 90" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    quadrado: `<g fill="rgba(255,255,255,.18)" stroke="${ink}" stroke-width="3.4"><rect x="68" y="85" width="28" height="21" rx="6"/><rect x="104" y="85" width="28" height="21" rx="6"/></g><path d="M96 93H104M68 92L58 90M132 92L142 90" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/>`,
    sol: `<g fill="${ink}"><rect x="67" y="85" width="30" height="20" rx="8"/><rect x="103" y="85" width="30" height="20" rx="8"/></g><path d="M97 92H103M67 91L58 89M133 91L142 89" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M73 90L80 90M109 90L116 90" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`
  };
  P.push(gl[a.glasses] || '');

  /* ---- acessórios de cabeça ---- */
  const capC = AV.top[a.tc === 1 ? 0 : 1];
  const acc = {
    bone: `<path d="M53 74C53 44 74 27 100 27S147 44 147 74Z" fill="${capC}"/><path d="M98 70C124 64 162 67 174 78C162 85 122 83 98 78Z" fill="${avShade(capC, -0.2)}"/><circle cx="100" cy="28" r="4" fill="${avShade(capC, -0.2)}"/><circle cx="84" cy="54" r="5" fill="#fff" opacity=".9"/>`,
    touca: `<path d="M52 80C50 42 74 24 100 24S150 42 148 80Z" fill="${tc}"/><path d="M50 70H150V84C120 90 80 90 50 84Z" fill="${tc2}"/><circle cx="100" cy="22" r="9" fill="${tcL}"/>`,
    fone: `<path d="M48 96C44 42 156 42 152 96" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="40" y="82" width="16" height="28" rx="8" fill="${AV.top[1]}"/><rect x="144" y="82" width="16" height="28" rx="8" fill="${AV.top[1]}"/>`,
    laco: `<g transform="translate(128 46) rotate(18)"><path d="M0 0L-15 -9V9Z" fill="${AV.top[6]}"/><path d="M0 0L15 -9V9Z" fill="${AV.top[6]}"/><circle r="4.4" fill="${avShade(AV.top[6], -0.2)}"/></g>`
  };
  P.push(acc[a.acc] || '');

  const title = opts.title ? `<title>${esc(opts.title)}</title>` : '';
  return `<svg class="avsvg" viewBox="${vb}" role="img" aria-label="${esc(opts.title || 'Avatar')}">${title}<defs><clipPath id="${id}"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="${opts.face ? 'none' : `url(#${id})`}">${P.join('')}</g></svg>`;
}
// Avatar pronto para usar em qualquer lugar (cabeçalho, perfil, ranking da turma).
function avatarHTML(cfg, cls = '', title = '') { return `<span class="av ${cls}">${avatarSVG(cfg, { title })}</span>`; }
function avatarOf(name, cfg) { return cfg ? avatarHTML(cfg, 'sm', name) : avatarHTML(avDefault(name), 'sm', name); }

/* ---------- Editor ---------- */
const AVED = { cfg: null, cat: 'skin', orig: null };
const AV_CATS = [
  ['skin', 'Pele', 'user'], ['hair', 'Cabelo', 'mind'], ['hc', 'Cor do cabelo', 'mind'], ['eyes', 'Olhos', 'eye'], ['brows', 'Sobrancelha', 'eye'],
  ['mouth', 'Boca', 'tutor'], ['beard', 'Barba', 'user'], ['glasses', 'Óculos', 'eye'], ['acc', 'Acessório', 'trophy'], ['top', 'Roupa', 'work'], ['tc', 'Cor da roupa', 'work'], ['bg', 'Fundo', 'target']
];
function openAvatarEditor() {
  AVED.orig = avatarConfig(); AVED.cfg = Object.assign({}, AVED.orig); AVED.cat = AVED.cat || 'skin';
  ui.tab = 'avatar'; render(); $('#view').scrollTop = 0;
}
function avOptionsHTML() {
  const c = AVED.cfg, cat = AVED.cat;
  const sw = (list, key) => `<div class="avsw">${list.map((col, i) => `<button class="sw ${c[key] === i ? 'on' : ''}" data-act="av-set" data-k="${key}" data-v="${i}" style="--c:${col}" aria-label="Cor ${i + 1}" aria-pressed="${c[key] === i}"></button>`).join('')}</div>`;
  if (cat === 'skin') return sw(AV.skin, 'skin') + `<label class="avtoggle"><span>Bochechas rosadas</span><button class="switch" role="switch" aria-checked="${c.blush}" data-act="av-blush" aria-label="Bochechas rosadas"></button></label>`;
  if (cat === 'hc') return sw(AV.hairc, 'hc');
  if (cat === 'tc') return sw(AV.top, 'tc');
  if (cat === 'bg') return sw(AV.bg, 'bg');
  const face = ['eyes', 'brows', 'mouth', 'glasses', 'beard'].includes(cat);
  return `<div class="avgrid">${AV_OPTS[cat].map((v) => { const t = Object.assign({}, c, { [cat]: v }); return `<button class="avopt ${c[cat] === v ? 'on' : ''}" data-act="av-set" data-k="${cat}" data-v="${v}" aria-pressed="${c[cat] === v}"><span class="avthumb">${avatarSVG(t, { face })}</span><span>${AV_LABEL[v] || v}</span></button>`; }).join('')}</div>`;
}
function viewAvatar() {
  if (!AVED.cfg) { AVED.orig = avatarConfig(); AVED.cfg = Object.assign({}, AVED.orig); }
  const changed = JSON.stringify(AVED.cfg) !== JSON.stringify(AVED.orig);
  return `<div class="avpage">
    <div class="avstage" style="--avbg:${AV.bg[AVED.cfg.bg]}">
      <div class="sec" style="padding:6px 16px 0"><button class="icon-btn" data-act="av-cancel" aria-label="Voltar sem salvar">${ico('back')}</button><button class="icon-btn" data-act="av-random" aria-label="Sortear um visual">${ico('shuffle')}</button></div>
      <div class="avpreview" id="av-preview">${avatarSVG(AVED.cfg, { title: 'Seu avatar' })}</div>
    </div>
    <div class="avpanel">
      <div class="avcats" role="tablist" aria-label="Partes do avatar">${AV_CATS.map(([k, l]) => `<button class="fchip" role="tab" data-act="av-cat" data-k="${k}" aria-selected="${AVED.cat === k}" aria-pressed="${AVED.cat === k}">${l}</button>`).join('')}</div>
      <div id="av-opts">${avOptionsHTML()}</div>
    </div>
    <div class="dock"><button class="btn btn-ghost" data-act="av-cancel">Cancelar</button><button class="btn btn-orange" data-act="av-save" ${changed || !S.user.avatar ? '' : 'disabled'}>Salvar avatar</button></div>
  </div>`;
}
function avRepaint() {
  const pv = document.getElementById('av-preview'); if (pv) { pv.innerHTML = avatarSVG(AVED.cfg, { title: 'Seu avatar' }); if (!REDUCED) { pv.classList.remove('bump'); void pv.offsetWidth; pv.classList.add('bump'); } }
  const st = document.querySelector('.avstage'); if (st) st.style.setProperty('--avbg', AV.bg[AVED.cfg.bg]);
  const op = document.getElementById('av-opts'); if (op) { const y = op.scrollTop; op.innerHTML = avOptionsHTML(); op.scrollTop = y; }
  const sv = document.querySelector('[data-act="av-save"]'); if (sv) sv.disabled = false;
}
Object.assign(ACT, {
  'av-open': () => openAvatarEditor(),
  'av-later': () => { S.user.avSeen = 1; persist(); render(); },
  'av-cat': (d) => { AVED.cat = d.k; document.querySelectorAll('.avcats .fchip').forEach((b) => { const on = b.dataset.k === d.k; b.setAttribute('aria-pressed', on); b.setAttribute('aria-selected', on); }); const op = document.getElementById('av-opts'); if (op) op.innerHTML = avOptionsHTML(); const ch = document.querySelector(`.avcats [data-k="${d.k}"]`); if (ch) ch.scrollIntoView({ inline: 'center', block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' }); },
  'av-set': (d) => { const num = ['skin', 'hc', 'tc', 'bg'].includes(d.k); AVED.cfg[d.k] = num ? Number(d.v) : d.v; avRepaint(); },
  'av-blush': () => { AVED.cfg.blush = !AVED.cfg.blush; avRepaint(); },
  'av-random': () => {
    const r = (n) => Math.floor(Math.random() * n); const o = AV_OPTS;
    const hair = o.hair[r(o.hair.length - 1)];
    AVED.cfg = avNormalize({ skin: r(AV.skin.length), hair, hc: r(7), eyes: o.eyes[r(o.eyes.length)], brows: o.brows[r(3)], mouth: o.mouth[r(o.mouth.length)], beard: Math.random() < 0.25 ? o.beard[1 + r(3)] : 'nenhuma', glasses: Math.random() < 0.3 ? o.glasses[1 + r(3)] : 'nenhum', acc: Math.random() < 0.3 ? o.acc[1 + r(5)] : 'nenhum', top: o.top[r(o.top.length)], tc: r(AV.top.length), bg: r(AV.bg.length), blush: Math.random() < 0.7 });
    avRepaint();
  },
  'av-save': () => { S.user.avatar = avNormalize(AVED.cfg); S.user.avSeen = 1; persist(); AVED.cfg = null; ui.tab = 'perfil'; render(); $('#view').scrollTop = 0; notify('Avatar salvo.'); },
  'av-cancel': () => { AVED.cfg = null; ui.tab = 'perfil'; render(); $('#view').scrollTop = 0; }
});
