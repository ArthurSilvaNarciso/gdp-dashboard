# Como escrever questões do Memory

Cada arquivo `content/<id>.json` tem este formato:

```json
{ "id": "bio", "title": "Biologia ENEM", "subtitle": "Células, genética e ecologia", "tag": "Escola",
  "blurb": "Uma frase (até 160 caracteres) que vende a trilha.",
  "questions": [ { "id": "bio1", "topic": "Mitose", "c": "...", "q": "...", "a": 2, "src": "...", "o": [ {"t":"...","p":"...","w":"..."}, x4 ] } ] }
```
Para trilhas que JÁ existem, use só `{ "id": "port", "questions": [...] }` e continue a numeração (ex.: port7 a port12).

## Regras (todas obrigatórias)
- Português do Brasil, norma-padrão, sem emoji, tom de professor claro e direto.
- `c` (caso): 1 a 3 frases com uma situação realista e brasileira (nomes, empresas, órgãos, cidades) que exige aplicar o conceito. Não é uma definição.
- `q`: a pergunta, curta, terminando em "?" ou "." (para "Assinale...").
- `o`: EXATAMENTE 4 alternativas. Cada uma: `t` (até 160 caracteres), `p` (padrão) e `w` (1 a 2 frases dizendo por que está certa ou errada).
- Exatamente UMA alternativa com `"p": "correta"`. As outras usam padrões de pegadinha DIFERENTES entre si, escolhidos de:
  `inversao` (troca o sentido/ordem/causa), `generalizacao` (vira regra absoluta: sempre, nunca, qualquer), `restricao` (acrescenta condição que não existe),
  `extrapolacao` (vai além do que a regra diz), `troca` (usa conceito vizinho no lugar), `calculo` (erro de procedimento ou de conta).
- `a` = índice (0 a 3) da correta. Distribua: em cada arquivo, a correta deve aparecer em cada posição pelo menos 2 vezes.
- `topic`: até 4 palavras. `src`: fonte específica e verificável (ex.: "CF/88, art. 37, II", "Lei 8.112/90, art. 20", "Fórmula de Bhaskara", "Karpicke & Roediger (2008), Science").
- Precisão acima de tudo: só fatos consolidados, com resposta inequívoca. Nada controverso, datado ou que dependa de jurisprudência instável. Confira contas duas vezes.
- Alternativas erradas plausíveis (o erro que um aluno real cometeria), sem "pegadinha boba" de português.
- Não repita temas já cobertos (a lista vem no pedido).
- Os ids das questões devem ser únicos e seguir o padrão `<id da trilha><número>`.

Depois de escrever, rode `node dev/validate-content.mjs content/<id>.json` e corrija até passar.
