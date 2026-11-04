/* ================= Ícones próprios do Memory ================= */
// Desenhados à mão numa grade de 24 px, traço 1.8 com pontas arredondadas.
// A assinatura da marca: um único ponto ou forma laranja ("a") por ícone, eco dos dois círculos do logo.
// Nada de faíscas ou estrelinhas: cada ícone representa uma ação concreta do estudo.
Object.assign(I, {
  home: '<path d="M4 10.4 12 4.2l8 6.2V19a1.2 1.2 0 0 1-1.2 1.2H15v-5.4H9v5.4H5.2A1.2 1.2 0 0 1 4 19z"/><circle class="a" cx="12" cy="10.6" r="1.7"/>',
  decks: '<rect x="3.8" y="8.2" width="12.6" height="12" rx="2.4"/><path d="M7.6 4.8h10.2a2.4 2.4 0 0 1 2.4 2.4v9.6"/><circle class="a" cx="10.1" cy="14.2" r="2.1"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  chart: '<path d="M5 20v-6.5M12 20V10M19 20v-3.5"/><circle class="a" cx="19" cy="10.6" r="2.1"/><path d="M3.5 20.2h17"/>',
  user: '<circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20.2c1.3-3.7 4.2-5.6 7.4-5.6s6.1 1.9 7.4 5.6"/>',
  users: '<circle cx="9" cy="8.6" r="3.4"/><path d="M2.8 19.8c.9-3.3 3.3-5.1 6.2-5.1s5.3 1.8 6.2 5.1"/><circle class="a" cx="17.4" cy="9.6" r="2.4"/><path d="M17.2 14.6c2.1.2 3.5 1.8 4.1 4.4"/>',
  flame: '<path d="M12 3.4c.8 3.1 4.9 5 4.9 9.7a4.9 4.9 0 0 1-9.8 0c0-2.4 1.3-3.5 2-4.9.7 1.1 1.4 1.7 2.4 1.9.3-2.4-.2-4.5.5-6.7Z"/><path class="a" d="M12 20.4a2.1 2.1 0 0 1-2.1-2.1c0-1.3 1.1-1.9 2.1-3.3 1 1.4 2.1 2 2.1 3.3a2.1 2.1 0 0 1-2.1 2.1Z"/>',
  shield: '<path d="M12 3.4 5.4 6v5.3c0 4.1 2.7 7.6 6.6 9.3 3.9-1.7 6.6-5.2 6.6-9.3V6z"/><path d="m9.1 12.1 2.1 2.1 3.9-4.1"/>',
  close: '<path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4"/>',
  x: '<path d="M7.2 7.2l9.6 9.6M16.8 7.2l-9.6 9.6"/>',
  back: '<path d="M14.6 5.4 8 12l6.6 6.6"/>',
  chev: '<path d="m9.6 6 6 6-6 6"/>',
  tick: '<path d="m5.2 12.6 4.4 4.4 9.2-9.8"/>',
  check: '<path d="m5 12.6 4.6 4.6L19 7.2"/>',
  arrow: '<path d="M4.8 12h14.4m-5.4-5.4 5.4 5.4-5.4 5.4"/>',
  upload: '<path d="M12 15.2V4.6M7.6 9 12 4.6 16.4 9"/><path d="M4.6 14.4V18a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-3.6"/>',
  download: '<path d="M12 4.6v10.6M7.6 10.8 12 15.2l4.4-4.4"/><path d="M4.6 14.4V18a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-3.6"/>',
  bolt: '<path d="M13.4 3 5.6 13.3h6.1l-1 7.7 7.9-10.4h-6.2z"/>',
  alert: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.6v5.2"/><circle class="a" cx="12" cy="16.3" r="1.35"/>',
  file: '<path d="M14 3.6H7a2 2 0 0 0-2 2v12.8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.6z"/><path d="M14 3.6v5h5"/><path d="M8.6 13h6.8M8.6 16.4h4.2"/>',
  bell: '<path d="M6.2 16.6V11a5.8 5.8 0 0 1 11.6 0v5.6l1.6 1.8H4.6Z"/><path d="M10 20.6a2.2 2.2 0 0 0 4 0"/><circle class="a" cx="17.6" cy="5.6" r="2"/>',
  clock: '<circle cx="12" cy="13" r="7.8"/><path d="M12 9v4l2.7 1.7M9.6 2.9h4.8"/><circle class="a" cx="18.6" cy="6.2" r="1.5"/>',
  book: '<path d="M6.2 3.6h10.6a1.6 1.6 0 0 1 1.6 1.6v13.6a1.6 1.6 0 0 1-1.6 1.6H6.2z"/><path d="M6.2 3.6v16.8M3.9 7.6h2.3M3.9 12h2.3M3.9 16.4h2.3M10.2 8.4h4.6"/><circle class="a" cx="14.8" cy="14.6" r="1.7"/>',
  send: '<path d="M20.4 3.6 3.6 10.4l6.6 2.8 2.8 6.6z"/><path d="m10.2 13.2 4.4-4.4"/>',
  share: '<circle cx="17.4" cy="5.6" r="2.5"/><circle class="a" cx="6.6" cy="12" r="2.6"/><circle cx="17.4" cy="18.4" r="2.5"/><path d="m8.8 10.7 6.4-3.8M8.8 13.3l6.4 3.8"/>',
  target: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6"/><circle class="a" cx="12" cy="12" r="1.7"/>',
  trophy: '<path d="M8 4h8v4.8a4 4 0 0 1-8 0zM8 6H5.2v1a3 3 0 0 0 3 3M16 6h2.8v1a3 3 0 0 1-3 3M12 12.8v3.8M8.6 20.4h6.8M9.8 16.6h4.4"/><circle class="a" cx="12" cy="7.4" r="1.4"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="m20 20-4.4-4.4"/>',
  edit: '<path d="M4.4 19.6h4.1L19 9.1l-4.1-4.1L4.4 15.5z"/><path d="m13 6.9 4.1 4.1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>',
  eye: '<path d="M2.4 12s3.5-6.6 9.6-6.6 9.6 6.6 9.6 6.6-3.5 6.6-9.6 6.6S2.4 12 2.4 12Z"/><circle class="a" cx="12" cy="12" r="2.8"/>',
  cloud: '<path d="M7.2 18.2h9.9a3.9 3.9 0 0 0 .6-7.8 5.9 5.9 0 0 0-11.4-1 4.4 4.4 0 0 0 .9 8.8Z"/><path d="m9.6 13.6 1.8 1.8 3.2-3.4"/>',
  copy: '<rect x="8.4" y="8.4" width="11.4" height="11.4" rx="2.2"/><path d="M15.6 8.4V6a1.8 1.8 0 0 0-1.8-1.8H6a1.8 1.8 0 0 0-1.8 1.8v7.8A1.8 1.8 0 0 0 6 15.6h2.4"/>',
  logout: '<path d="M14.6 4.2h3.6a1.6 1.6 0 0 1 1.6 1.6v12.4a1.6 1.6 0 0 1-1.6 1.6h-3.6M10.2 16.2 6 12l4.2-4.2M6 12h9.8"/>',
  key: '<circle cx="8" cy="15" r="3.9"/><path d="m10.8 12.2 8.6-8.6M16.8 6.2l2.6 2.6M14.4 8.6l1.8 1.8"/><circle class="a" cx="8" cy="15" r="1.3"/>',
  refresh: '<path d="M19.6 12a7.6 7.6 0 1 1-2.2-5.4M19.8 4.4v4.8H15"/>',
  // Ícones novos, no lugar das "faíscas" genéricas
  mind: '<circle cx="9.2" cy="12" r="5.4"/><circle class="a" cx="14.8" cy="12" r="5.4"/>',
  tutor: '<path d="M5 5.4h14a1.6 1.6 0 0 1 1.6 1.6v8.4A1.6 1.6 0 0 1 19 17h-6.6l-4.8 3.6V17H5a1.6 1.6 0 0 1-1.6-1.6V7A1.6 1.6 0 0 1 5 5.4Z"/><circle class="f" cx="9.6" cy="11.2" r="1.35"/><circle class="a" cx="14.4" cy="11.2" r="1.35"/>',
  recall: '<path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.3"/><path d="M17.6 3.6v3.6H14"/><circle class="a" cx="12" cy="12" r="2.2"/>',
  school: '<path d="m2.8 9.2 9.2-4.4 9.2 4.4-9.2 4.4z"/><path d="M6.6 11.2v4.1c1.5 1.4 3.3 2.1 5.4 2.1s3.9-.7 5.4-2.1v-4.1M20.4 9.6v4.4"/><circle class="a" cx="20.4" cy="15.6" r="1.4"/>',
  shuffle: '<path d="M3.8 7.6h3c2 0 3.2 1 4.3 2.7l1.8 3.2c1.1 1.8 2.3 2.7 4.3 2.7h2.6M3.8 16.2h3c1.3 0 2.2-.4 3-1.2M13.6 8.8c.8-.8 1.7-1.2 3-1.2h2.6"/><path d="m17.2 5 2.6 2.6-2.6 2.6M17.2 13.6l2.6 2.6-2.6 2.6"/>',
  layers: null
});
I.layers = I.decks;
I.memory = I.mind;
I.spark = I.recall; // compatibilidade: qualquer uso antigo vira "recuperar"
DECK_LOOK.neuro = Object.assign({}, DECK_LOOK.neuro, { icon: 'mind' });

/* ---------- Ícones ilustrados (sprite único: cada desenho existe uma vez no DOM) ---------- */
(function mountGlyphs() {
  const sym = Object.entries(GLYPHS).map(([k, v]) => `<symbol id="gi-${k}" viewBox="0 0 24 24">${v.n ? `<path class="gn" d="${v.n}"/>` : ''}${v.a ? `<path class="ga" d="${v.a}"/>` : ''}</symbol>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${sym}</svg>`);
  for (const k of Object.keys(GLYPHS)) I[k] = `<use href="#gi-${k}"/>`;
  I.layers = I.decks; I.memory = I.mind; I.spark = I.recall;
})();

/* ---------- Ilustrações de estado (mesma linguagem dos ícones) ---------- */
function illo(name, cls = '') {
  const v = ILLOS[name]; if (!v) return '';
  return `<svg class="illo ${cls}" viewBox="0 0 ${v.w} ${v.h}" role="img" aria-hidden="true">${v.n ? `<path class="gn" d="${v.n}"/>` : ''}${v.a ? `<path class="ga" d="${v.a}"/>` : ''}</svg>`;
}
