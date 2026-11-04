# Aulas do Memory — formato e regras

Cada trilha tem um arquivo `content/lessons/<id da trilha>.json`:
```json
{ "id": "port", "lessons": [ {
  "id": "port-a1",
  "title": "Crase sem decoreba",
  "mins": 6,
  "qids": ["port1", "port14", "port35"],
  "intro": "Uma frase que diz o que a pessoa vai conseguir fazer ao fim da aula.",
  "sections": [
    { "h": "A regra que resolve 80% dos casos", "p": ["Parágrafo curto.", "Outro parágrafo."], "list": ["item opcional", "item opcional"] },
    { "h": "...", "p": ["..."] }
  ],
  "example": { "c": "Situação real curta.", "q": "Pergunta.", "a": "Resposta comentada em 1 a 3 frases." },
  "traps": ["Pegadinha clássica 1 e como desarmar.", "Pegadinha 2."],
  "summary": ["Ideia-chave 1.", "Ideia-chave 2.", "Ideia-chave 3."],
  "src": "Fonte principal (lei e artigos, gramática, documentação oficial, artigo científico)."
} ] }
```
Regras:
- Português do Brasil, tom de professor bom de cursinho: direto, concreto, com exemplos reais. Nada de enrolação, emojis ou "neste artigo".
- 6 aulas por trilha, na ordem em que a matéria deve ser estudada. Cada aula cobre 2 a 6 questões existentes da trilha (`qids` = ids reais, veja `content/TOPICS.md`); juntas, as aulas cobrem os temas mais importantes da trilha.
- Tamanho: 3 a 5 seções; cada parágrafo até 3 frases; leitura de 4 a 8 minutos (`mins`).
- Precisão acima de tudo: cite artigo de lei exato quando for direito; regras gramaticais segundo a norma-padrão; nada de jurisprudência instável; fatos históricos e científicos consolidados.
- `id` da aula: `<trilha>-a<n>`.
- Valide com `node dev/validate-lessons.mjs content/lessons/<id>.json`.
