# Concursos abertos — formato e regras

Arquivo `content/concursos/<lote>.json`: `{ "updated": "2026-11-04", "items": [ ... ] }`, cada item:
```json
{
  "id": "tjsp-escrevente-2026",
  "orgao": "Tribunal de Justiça de São Paulo",
  "sigla": "TJ-SP",
  "titulo": "Escrevente Técnico Judiciário",
  "esfera": "estadual",
  "uf": "SP",
  "local": "São Paulo (capital e interior)",
  "area": "Tribunais",
  "banca": "Vunesp",
  "escolaridade": ["medio"],
  "vagas": 400,
  "cr": false,
  "salario": 6043.92,
  "inscricoes": { "inicio": "2026-10-20", "fim": "2026-11-25" },
  "prova": "2027-01-18",
  "taxa": 85.0,
  "status": "abertas",
  "cargos": [ { "nome": "Escrevente Técnico Judiciário", "escolaridade": "medio", "vagas": 400, "salario": 6043.92 } ],
  "disciplinas": [ { "nome": "Língua Portuguesa", "topicos": ["Interpretação de texto", "Crase", "Concordância"] }, { "nome": "Direito Processual Civil", "topicos": [] } ],
  "edital": "https://link-oficial-do-edital-ou-pagina-da-banca",
  "fonte": "https://pagina-onde-a-informacao-foi-conferida"
}
```
Regras:
- Só concursos com edital publicado e inscrições abertas hoje (04/11/2026) ou que ainda vão abrir (status "abertas" ou "em breve"), com datas conferidas na fonte. Nada de "previsto" sem edital.
- `esfera`: "federal" | "estadual" | "municipal". `uf`: sigla; federal com vagas no país todo usa "BR". `escolaridade` em ["fundamental","medio","superior"].
- `salario`: maior remuneração inicial do edital (número, R$). `vagas`: total de vagas imediatas (0 se só cadastro reserva, com `cr: true`). Use `null` quando não souber; nunca invente.
- `disciplinas`: as matérias do conteúdo programático do cargo principal (ou comuns aos cargos), com até 8 tópicos cada, quando o edital trouxer. Nomes padronizados: "Língua Portuguesa", "Raciocínio Lógico", "Matemática", "Informática", "Direito Constitucional", "Direito Administrativo", "Direito Penal", "Direito Processual Penal", "Direito Civil", "Direito Processual Civil", "Legislação Específica", "Conhecimentos Gerais", "Atualidades", "Língua Inglesa", "Contabilidade", "Administração Pública", "Arquivologia", "Ética no Serviço Público", "Conhecimentos Específicos" etc.
- `edital`: link oficial (banca ou órgão). `fonte`: página que você abriu para conferir (pode ser a mesma ou um portal de notícias de concursos confiável).
- Prefira concursos relevantes (muitas vagas, bons salários, órgãos conhecidos) e cubra todas as regiões.
