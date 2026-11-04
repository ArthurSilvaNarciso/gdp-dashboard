# Memory — estudo por recuperação ativa

App mobile-first de estudo em ciclos curtos (desafio → esforço → recompensa → consolidação), com revisão espaçada inspirada no FSRS, simulados, caderno de erros e engenharia reversa de pegadinhas.

## O que o back-end entrega
- **Contas**: cadastro e login com senha protegida (bcrypt), sessão em cookie HttpOnly/SameSite (JWT HS256), troca de senha, “desconectar outros aparelhos”, exclusão de conta e exportação dos dados (LGPD).
- **Sincronização**: progresso mesclado entre aparelhos no servidor (sem perder respostas), com concorrência otimista; trilhas próprias sincronizadas com marcação de exclusão.
- **Turmas**: professor/empresa cria a turma, alunos entram por código de 6 caracteres ou link; painel com respostas da semana, acerto, memória estimada, pegadinhas da turma e progresso de cada aluno por trilha; ranking semanal para os alunos.
- **Códigos curtos** para compartilhar trilhas (`/?t=CODIGO`) e convidar para turmas (`/?turma=CODIGO`).
- **IA no servidor** (tutor, variações de erro e geração de questões a partir de PDF) com streaming e cota diária por usuário.
- **Liga semanal e amigos**: ligas de até 30 pessoas por divisão (Bronze → Diamante), promoção/rebaixamento na segunda-feira, pontos = 10 por acerto + 2 por resposta; convite por link (`/?amigo=CODIGO`) e ranking de amigos.
- **Notificações push**: Web Push com chaves VAPID geradas e guardadas no banco; rotina diária (`/api/cron/daily`, Vercel Cron às 19h de Brasília) só para quem ainda não estudou, mais a limpeza de registros prevista na política de privacidade.
- **Reportar questão**: qualquer pessoa aponta gabarito errado, enunciado confuso etc.; a administração vê os reportes agrupados por questão e marca como corrigida.
- **Privacidade (LGPD)**: política e termos no app (`src/legal.js`), aceite obrigatório no cadastro (`terms_at`), exportação e exclusão de dados.
- **Segurança**: limite de tentativas, verificação de origem (CSRF), saneamento de tudo o que chega do cliente, cabeçalhos de segurança e trilha de auditoria.

## Conteúdo
As trilhas nativas ficam em `src/data.js`, `src/data2.js`, `content/*.json` e `content/*.more.json` (inclui itens Certo/Errado, `"type": "ce"`) (formato e regras em `content/SPEC.md`; valide com `node dev/validate-content.mjs content/*.json`).

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
| `ADMIN_EMAILS` | não | E-mails (separados por vírgula) com acesso ao painel de administração |
| `CRON_SECRET` | recomendada | Protege a rotina diária (a Vercel envia no cabeçalho Authorization) |
| `APP_URL` / `PUSH_SUBJECT` | não | Endereço oficial nos e-mails / contato para os serviços de notificação |
| `RESEND_API_KEY` + `EMAIL_FROM` | não | Envia por e-mail o link de “esqueci minha senha” (sem isso, a administração gera o link) |
| `SESSION_SECRET` | não | Segredo das sessões (sem ele, um segredo forte é gerado e guardado no banco) |

As tabelas são criadas sozinhas na primeira requisição.

## Rodar localmente
```bash
npm install
npm run dev        # http://localhost:3000 com Postgres em memória (PGlite)
npm test           # testes da API
node test/e2e.mjs  # ponta a ponta (Playwright)
```
