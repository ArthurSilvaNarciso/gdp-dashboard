# Memory — estudo por recuperação ativa

App mobile-first de estudo em ciclos curtos (desafio → esforço → recompensa → consolidação), com revisão espaçada inspirada no FSRS, simulados, caderno de erros e engenharia reversa de pegadinhas.

## O que o back-end entrega
- **Contas**: cadastro e login com senha protegida (bcrypt), sessão em cookie HttpOnly/SameSite (JWT HS256), troca de senha, “desconectar outros aparelhos”, exclusão de conta e exportação dos dados (LGPD).
- **Sincronização**: progresso mesclado entre aparelhos no servidor (sem perder respostas), com concorrência otimista; trilhas próprias sincronizadas com marcação de exclusão.
- **Turmas**: professor/empresa cria a turma, alunos entram por código de 6 caracteres ou link; painel com respostas da semana, acerto, memória estimada, pegadinhas da turma e progresso de cada aluno por trilha; ranking semanal para os alunos.
- **Códigos curtos** para compartilhar trilhas (`/?t=CODIGO`) e convidar para turmas (`/?turma=CODIGO`).
- **IA no servidor** (tutor, variações de erro e geração de questões a partir de PDF) com streaming e cota diária por usuário.
- **Segurança**: limite de tentativas, verificação de origem (CSRF), saneamento de tudo o que chega do cliente, cabeçalhos de segurança e trilha de auditoria.

## Estrutura
- `index.html` + `img/` — o app (gerado por `npm run assemble` a partir de `src/`).
- `api/main.js` — função serverless única (todas as rotas `/api/*`).
- `lib/` — roteador, banco (Neon/Postgres), autenticação, IA e código compartilhado com o app.
- `test/` — testes da API (Postgres real em memória) e de ponta a ponta com navegador.

## Variáveis de ambiente
| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | sim | Postgres (criada automaticamente pela integração Neon da Vercel) |
| `ANTHROPIC_API_KEY` | não | Liga o tutor e a geração de questões com IA |
| `ANTHROPIC_MODEL` | não | Modelo da IA (padrão `claude-haiku-5-5`) |
| `AI_DAILY_UNITS` | não | Cota diária de IA por usuário (padrão 120) |
| `SESSION_SECRET` | não | Segredo das sessões (sem ele, um segredo forte é gerado e guardado no banco) |

As tabelas são criadas sozinhas na primeira requisição.

## Rodar localmente
```bash
npm install
npm run dev        # http://localhost:3000 com Postgres em memória (PGlite)
npm test           # testes da API
node test/e2e.mjs  # ponta a ponta (Playwright)
```
