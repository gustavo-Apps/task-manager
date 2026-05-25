# Weekly Reports — API

API REST para gerenciamento de relatórios semanais de atividades.

## Requisitos

- Node.js 18+
- MySQL 8+ ou MariaDB 10.6+

## Instalação

```bash
cd backend
npm install
cp .env.example .env
# edite o .env com suas credenciais de banco
```

Crie o banco de dados manualmente antes de iniciar:

```sql
CREATE DATABASE weekly_reports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Sincronize o schema e popule com dados iniciais:

```bash
npm run db:sync
npm run db:seed
```

Inicie o servidor:

```bash
npm run dev     # desenvolvimento (nodemon)
npm start       # produção
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | 3000 |
| `NODE_ENV` | Ambiente | development |
| `DB_HOST` | Host MySQL | localhost |
| `DB_PORT` | Porta MySQL | 3306 |
| `DB_NAME` | Nome do banco | weekly_reports |
| `DB_USER` | Usuário | — |
| `DB_PASS` | Senha | — |
| `JWT_SECRET` | Chave secreta JWT | — |
| `JWT_EXPIRES_IN` | Expiração do token | 7d |
| `REPORTS_DIR` | Pasta para .md | reports/generated |

## Endpoints

### Autenticação

```
POST   /api/auth/register   Registrar novo usuário
POST   /api/auth/login      Login (retorna JWT)
GET    /api/auth/me         Dados do usuário logado
```

### Tarefas

```
POST   /api/tasks           Criar tarefa
GET    /api/tasks           Listar tarefas (filtros: ?status=done&activity_type_id=1)
GET    /api/tasks/:id       Buscar tarefa
PATCH  /api/tasks/:id       Atualizar tarefa
DELETE /api/tasks/:id       Remover tarefa
```

### Relatórios Semanais

```
GET    /api/reports             Listar todos os relatórios
GET    /api/reports/:id         Ver relatório com tarefas
GET    /api/reports/:id/markdown  Download do arquivo .md
POST   /api/reports/:id/close  Fechar relatório
```

### Saúde

```
GET    /health     Status da API
```

## Exemplos de Uso

### Registrar usuário

```json
POST /api/auth/register
{
  "username": "gustavo",
  "email": "gustavo@empresa.com",
  "password": "MinhaS3nha!"
}
```

### Login

```json
POST /api/auth/login
{
  "email": "gustavo@empresa.com",
  "password": "MinhaS3nha!"
}
```

Resposta:
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "username": "gustavo", "email": "gustavo@empresa.com", "role": "user" }
  }
}
```

Use o token em todas as requisições protegidas:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Criar tarefa com ticket Azure

```json
POST /api/tasks
Authorization: Bearer <token>

{
  "activity_type_id": 1,
  "task_date": "2026-05-26",
  "azure_ticket_id": "2819",
  "status": "done"
}
```

O campo `title` será preenchido automaticamente como `"Testado Hoje"`.

### Criar tarefa comum

```json
POST /api/tasks
Authorization: Bearer <token>

{
  "activity_type_id": 2,
  "title": "Validacao do fluxo de login",
  "description": "Testei o fluxo de autenticacao com usuarios validos e invalidos.",
  "task_date": "2026-05-26",
  "status": "done",
  "discord_link": "https://discord.com/channels/...",
  "notes": "Funciona corretamente. Pendente teste no ambiente de staging."
}
```

### Gerar Markdown

```
GET /api/reports/1/markdown
Authorization: Bearer <token>
```

Retorna download do arquivo `relatorio-semana22-2026-gustavo.md`.

## Estrutura do Relatório .md Gerado

```markdown
# Relatorio Semanal — Semana 22/2026

**Colaborador:** gustavo
**Periodo:** segunda-feira, 25 de maio de 2026 a domingo, 31 de maio de 2026
**Status:** Em andamento
**Gerado em:** 26/05/2026, 09:30:00

---

## Atividades Realizadas

### segunda-feira, 26 de maio de 2026

- **[Teste]** Testado Hoje *(Concluido)*
  - Ticket Azure: `2819`

- **[Validacao]** Validacao do fluxo de login *(Concluido)*
  > Testei o fluxo de autenticacao com usuarios validos e invalidos.
  - Topico Discord: https://discord.com/channels/...

---

## Tickets Testados

| Ticket | Descricao       | Data       | Status   |
|--------|-----------------|------------|----------|
| `2819` | Testado Hoje    | 2026-05-26 | Concluido |

---

## Resumo

- **Total de atividades:** 2
- **Tickets testados:** 1
- **Atividades concluidas:** 2
- **Em andamento:** 0
- **Pendentes:** 0
```

## Segurança Aplicada

- Helmet: headers HTTP de segurança
- Rate limiting nas rotas de autenticação (20 req / 15 min)
- bcrypt com custo 12 para hashing de senhas
- JWT sem dados sensíveis
- Joi com `stripUnknown: true` (bloqueia mass assignment)
- Senhas excluídas das queries via defaultScope
- Mensagem de erro genérica no login (não revela existência de email)
- AppError separa erros esperados de erros inesperados
