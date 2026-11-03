# Arte do Memory

- `sheet.png` — conjunto de 24 ícones criado no ChatGPT (linha azul-marinho + um acento laranja).
- `badges.png` — 10 medalhas de conquista criadas no ChatGPT.
- `build2.py` — vetoriza os ícones (potrace) e gera os traçados de `src/glyphs.js`.
- `illus.py` — vetoriza as ilustrações de estado vazio.

Os ícones viram um sprite SVG único no app (`src/icons.js`), herdam a cor do texto e trocam o acento
automaticamente em botões, abas e no modo escuro. As medalhas ficam em `img/badges/*.webp`.
