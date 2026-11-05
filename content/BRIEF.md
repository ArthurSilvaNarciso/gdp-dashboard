# Como criar uma trilha nova do Memory (instruções comuns)

Projeto: /home/claude/memory-app. Trabalhe SÓ nos dois arquivos da sua trilha:
content/<id>.json e content/lessons/<id>.json. Não altere nenhum outro arquivo.

Leia antes, com atenção: content/SPEC.md (regras das questões), content/LESSONS.md (regras das aulas)
e, como exemplo de formato e qualidade, content/dpp.json e content/lessons/dpp.json.

Entregas:
1) content/<id>.json com exatamente 40 questões (ids <id>1 a <id>40), com title, subtitle, tag "Concursos" e blurb (até 160 caracteres, vendendo a trilha).
   - <id>1 a <id>28: múltipla escolha com 4 alternativas; a correta em cada posição (0,1,2,3) pelo menos 5 vezes.
   - <id>29 a <id>40: Certo/Errado estilo Cebraspe (type "ce"), com 5 a 7 certas.
   - Cada questão com caso realista brasileiro (cidades e órgãos variados) e fonte específica (lei e artigo, manual e capítulo, autor e obra).
2) content/lessons/<id>.json com 6 aulas (ids <id>-a1 a <id>-a6) na ordem de estudo, cada uma com 3 a 6 qids reais da trilha, cobrindo o máximo das 40 questões.

Precisão acima de tudo:
- Só o que é consolidado e vigente em novembro de 2026. Leis mudam: confira com WebSearch/WebFetch qualquer artigo, prazo, número ou percentual que for usar (fontes oficiais: planalto.gov.br, legis.senado.leg.br, camara.leg.br; se uma não responder, use outra oficial).
- Nada de jurisprudência instável. Se não tiver certeza de um detalhe, não use esse detalhe.
- Contas: refaça cada cálculo antes de gravar.

Valide e corrija até passar (a partir de /home/claude/memory-app):
  node dev/validate-content.mjs content/<id>.json
  node dev/validate-lessons.mjs content/lessons/<id>.json
Outros agentes criam outras trilhas ao mesmo tempo; ignore avisos sobre outros arquivos.

Responda no final só com: as duas linhas de validação OK, os temas cobertos em lista curta e qualquer ponto em que você evitou um detalhe por insegurança ou mudança recente de lei.
