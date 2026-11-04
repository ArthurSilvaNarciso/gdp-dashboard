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

## Arquivos de ampliação
Para não mexer nos arquivos existentes, questões novas de uma trilha vão em `content/<id>.more.json` com `{ "id": "<id>", "questions": [...] }`.
Continue a numeração a partir do maior número já usado pela trilha (veja `content/TOPICS.md`). Ids sempre `<id da trilha><n>` (ex.: dconst13), mesmo que as questões antigas usem outro prefixo.

## Formato Certo/Errado (estilo Cebraspe)
Usado só em trilhas de concurso. Mesmo objeto, com estas diferenças:
```json
{ "id": "dconst40", "type": "ce", "topic": "Mandado de segurança", "src": "CF/88, art. 5º, LXIX",
  "c": "Situação realista de 1 a 3 frases.",
  "q": "Afirmação a julgar, completa, terminando em ponto.",
  "a": 1,
  "o": [ { "t": "Certo", "p": "generalizacao", "w": "Por que julgar Certo é um erro..." },
         { "t": "Errado", "p": "correta", "w": "Por que o item está errado, citando a regra..." } ] }
```
- `o` tem EXATAMENTE 2 itens, nesta ordem: `Certo` e `Errado`. `a` = 0 se o item é certo, 1 se é errado.
- O julgamento errado recebe o padrão da pegadinha que o item usa (ex.: item errado por generalização → a opção "Certo" leva `"p": "generalizacao"`; item certo que parece errado → a opção "Errado" leva o padrão que confundiria o aluno).
- Equilibre: entre 40% e 60% dos itens Certo/Errado de cada arquivo devem ser certos.
- Itens errados devem ter UM erro claro e verificável (troca de prazo, de competência, de palavra-chave, generalização), nunca ambiguidade.
