# Weekly Reports

[![GitHub](https://img.shields.io/badge/GitHub-gustavo--Apps%2Ftask--manager-181717?logo=github&logoColor=white)](https://github.com/gustavo-Apps/task-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sistema de registro de atividades semanais para equipes de QA e desenvolvimento.
Cada usuário registra suas tarefas ao longo da semana e gera um relatório em `.md` ou PDF ao final — com o layout personalizado por cargo e preferências individuais.

---

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Configuração do ambiente](#configuração-do-ambiente)
4. [Banco de dados](#banco-de-dados)
5. [Rodando o projeto](#rodando-o-projeto)
6. [Primeiro acesso](#primeiro-acesso)
7. [Como usar](#como-usar)
8. [Exportação de relatórios](#exportação-de-relatórios)
9. [Webhooks](#webhooks)
10. [Painel administrativo](#painel-administrativo)
11. [Deploy em produção](#deploy-em-produção)
12. [Referência de endpoints](#referência-de-endpoints)
13. [Stack e estrutura de pastas](#stack-e-estrutura-de-pastas)

---

## Pré-requisitos

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |
| MySQL ou MariaDB | 5.7 / 10.4 | `mysql --version` |

O banco precisa estar rodando antes de iniciar o backend.

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/gustavo-Apps/task-manager.git
cd task-manager

# 2. Instale as dependências do backend
cd backend
npm install

# 3. Instale as dependências do frontend (em outro terminal ou após o passo 2)
cd ../frontend
npm install
```

---

## Configuração do ambiente

```bash
# Dentro da pasta backend/
cp .env.example .env
```

Abra o `.env` e preencha:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=weekly_reports
DB_USER=root
DB_PASS=                      # deixe vazio se o banco local não tiver senha

JWT_SECRET=                   # gere abaixo
JWT_EXPIRES_IN=7d

REPORTS_DIR=reports/generated
```

Para gerar um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Cole o resultado no campo `JWT_SECRET`. Em produção isso é obrigatório — o servidor rejeita inicialização sem ele.

---

## Banco de dados

O sistema cria as tabelas automaticamente na primeira inicialização.
Depois, rode o seed para popular os dados iniciais:

```bash
cd backend
npm run db:seed
```

O seed cria:

- 5 status de tarefa: Pendente, Em andamento, Concluido, Bloqueado, Cancelado
- 8 tipos de atividade: Teste, Validação, Reunião, Documentação, Desenvolvimento, Análise, Deploy, Suporte
- 5 cargos: Desenvolvedor, Analista de Testes, Gerente de Projeto, Analista de Requisitos, Engenheiro de DevOps
- 1 usuário admin padrão:\n  - Email: `admin@weeklyreports.local`
  - Senha: `Admin@12345`

> Troque a senha do admin no primeiro acesso. Vá em **Perfil** no menu lateral.

O seed é seguro para rodar mais de uma vez — usa `findOrCreate`, então não duplica dados.

Se precisar recriar o schema do zero (apaga e recria todas as tabelas):

```bash
npm run db:sync
```

> Cuidado: `db:sync` usa `{ alter: true }` — ajusta colunas existentes sem apagar dados. Para limpar tudo, apague o banco manualmente e rode `db:seed`.

---

## Rodando o projeto

### Desenvolvimento

Abra dois terminais:

```bash
# Terminal 1 — backend (porta 3000)
cd backend
npm run dev

# Terminal 2 — frontend (porta 5173)
cd frontend
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### Com PM2 (processo persistente, sem nodemon)

```bash
cd backend

npm run pm2:start    # inicia em background
npm run pm2:status   # verifica se está rodando
npm run pm2:logs     # acompanha logs em tempo real
npm run pm2:restart  # reinicia após alterações
npm run pm2:stop     # encerra o processo
```

---

## Primeiro acesso

1. Acesse [http://localhost:5173](http://localhost:5173)
2. Faça login com `admin@weeklyreports.local` / `Admin@12345`
3. Vá em **Admin** no menu → crie os usuários da equipe
4. Cada usuário faz login, acessa **Configurações** e personaliza o template do relatório

Para criar sua própria conta sem passar pelo admin, use a tela de **Cadastro** no login.

---

## Como usar

### Registrar uma atividade

1. Clique em **Nova Tarefa** no Dashboard
2. Preencha:
   - **Título** — o que foi feito
   - **Tipo** — categoria da atividade (Teste, Reunião, etc.)
   - **Status** — estado atual
   - **Data** — quando foi realizado
   - **Ticket Azure** (opcional) — preencha o número e o título é buscado automaticamente
3. Salve

### Gerenciar tarefas

- **Alterar status** — clique no badge de status diretamente no card do Dashboard
- **Duplicar** — ícone de cópia no card (útil para atividades recorrentes)
- **Editar** — ícone de lápis no card
- **Excluir** — ícone de lixeira no card

### Tarefas pendentes

A aba **Pendentes** no menu mostra todas as tarefas com status diferente de "Concluido" de qualquer semana. Use para não perder atividades em aberto de semanas anteriores.

### Fechar o relatório

O relatório da semana é fechado automaticamente toda segunda-feira às 00:05.
Para fechar manualmente: abra o relatório em **Relatórios** → clique em **Fechar Relatório**.

Relatórios fechados não aceitam novas tarefas.

---

## Exportação de relatórios

### Markdown (.md)

Gerado pelo backend com o template que você configurou em **Configurações > Relatório .md**.

- Clique em **Gerar .md** no Dashboard (semana atual) ou na página de Relatórios (qualquer semana)
- O arquivo é baixado automaticamente
- Também é possível gerar por período (intervalo de datas) na aba de Relatórios

### PDF

Gerado diretamente no browser — sem instalar nada extra.

- Clique em **Exportar PDF** no detalhe de um relatório ou na lista de relatórios
- Layout A4 com cabeçalho, tabelas por tipo de atividade e rodapé
- Suporta múltiplas páginas automaticamente

### Personalizar o template do .md

Acesse **Configurações > Relatório .md** e edite cada seção:\n\n| Seção | O que controla |
|---|---|
| Título | Primeira linha do arquivo |
| Informativo Geral | Cabeçalho com dados do período |
| Atividades | Template de cada item da lista |
| Tickets | Seção específica de tickets Azure |
| Rodapé | Última linha do arquivo |

**Variáveis disponíveis** (clique no nome para inserir no cursor):

| Variável | Valor |
|---|---|
| `{{username}}` | Seu nome de usuário |
| `{{week_number}}` | Número da semana ISO |
| `{{year}}` | Ano |
| `{{period_start}}` | Início da semana (dd/mm/yyyy) |
| `{{period_end}}` | Fim da semana (dd/mm/yyyy) |
| `{{total_tasks}}` | Total de tarefas |
| `{{total_tickets}}` | Tarefas com ticket Azure |
| `{{generated_at}}` | Data e hora de geração |

Cada cargo tem um template padrão pré-configurado. Para voltar ao padrão: **Restaurar Padrões**.

---

## Webhooks

Configure até **5 webhooks** por usuário em **Configurações > Webhooks**.

### Quando disparam

| Evento | Quando |
|---|---|
| `report.generated` | Toda vez que você baixa o `.md` de um relatório |
| `report.closed` | Ao fechar um relatório (manual ou automático) |

### Payload enviado

```json
{
  "event": "report.generated",
  "username": "joao",
  "week": "Semana 23/2026",
  "period": "2026-06-02 ate 2026-06-08",
  "status": "Em andamento",
  "tasks": 12,
  "tickets": 4,
  "content": "# Relatório Semanal\n...",
  "embeds": [{ "title": "...", "description": "...", "color": 3905270 }]
}
```

- **`content`** — texto completo do `.md` gerado (truncado em 3800 chars se muito longo)
- **`embeds`** — campo que o Discord usa para exibir o card formatado automaticamente
- Para **Slack / Teams / n8n**: use os campos planos (`event`, `content`, `tasks`, etc.)

### Testar

Clique em **Testar** ao lado de cada webhook para verificar a conectividade sem precisar gerar um relatório.

---

## Painel administrativo

Disponível em `/admin` — visível no menu apenas para usuários com role `admin`.

| Ação | Descrição |
|---|---|
| Listar usuários | Nome, email, cargo, role, status ativo/inativo |
| Criar usuário | Define nome, email, cargo, role e senha inicial |
| Editar usuário | Altera qualquer campo menos a própria role do admin logado |
| Redefinir senha | Gera nova senha para qualquer usuário |
| Desativar | `is_active = false` — usuário não consegue mais logar |
| Excluir | Remove permanentemente (não é possível excluir a própria conta) |

---

## Deploy em produção

### Railway (recomendado)

O repositório já tem `railway.json` configurado. Basta:

1. Criar um projeto no [Railway](https://railway.app)
2. Adicionar um banco MySQL (plugin)
3. Configurar as variáveis de ambiente no painel
4. Fazer push — o Railway detecta e faz o build automaticamente

### VPS / servidor próprio

```bash
# Build do frontend
cd frontend
npm run build
# Os arquivos ficam em frontend/dist/ — sirva via Nginx ou Express estático

# Backend em produção com PM2
cd backend
NODE_ENV=production npm run pm2:start
```

### Checklist antes de ir para produção

- [ ] `JWT_SECRET` gerado com `crypto.randomBytes(64)` — nunca deixe o valor padrão
- [ ] `NODE_ENV=production`
- [ ] Banco provisionado e acessível
- [ ] `npm run db:seed` executado uma vez
- [ ] Senha do admin padrão trocada (`Admin@12345` é só para primeiro acesso)
- [ ] `REPORTS_DIR` com permissão de escrita no servidor

---

## Referência de endpoints

Todos os endpoints (exceto login e registro) exigem:

```
Authorization: Bearer <token>
```

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastrar novo usuário |
| `POST` | `/api/auth/login` | Login — retorna JWT |
| `GET` | `/api/auth/me` | Dados do usuário logado |
| `PATCH` | `/api/auth/profile` | Atualizar username ou senha |

### Tarefas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/tasks` | Listar tarefas (`?type=`, `?status=`, `?date_from=`, `?date_to=`, `?q=`) |
| `GET` | `/api/tasks/pending` | Tarefas com status diferente de Concluido |
| `POST` | `/api/tasks` | Criar tarefa |
| `GET` | `/api/tasks/:id` | Detalhe de uma tarefa |
| `PUT` | `/api/tasks/:id` | Atualizar tarefa |
| `PATCH` | `/api/tasks/:id/status` | Atualizar só o status |
| `POST` | `/api/tasks/:id/duplicate` | Duplicar tarefa |
| `DELETE` | `/api/tasks/:id` | Excluir tarefa |

### Relatórios

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/reports` | Listar relatórios (`?page=`, `?limit=`) |
| `GET` | `/api/reports/current` | Relatório da semana atual |
| `GET` | `/api/reports/date/:date` | Relatório por data (`YYYY-MM-DD`) |
| `GET` | `/api/reports/:id` | Detalhe com tasks |
| `GET` | `/api/reports/:id/markdown` | Gerar e baixar `.md` |
| `GET` | `/api/reports/:id/json` | Exportar em JSON |
| `POST` | `/api/reports/:id/close` | Fechar relatório |

### Configurações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/settings` | Todas as configurações do usuário |
| `GET` | `/api/settings/:key` | Uma configuração pela chave |
| `PUT` | `/api/settings/:key` | Salvar configuração |
| `POST` | `/api/settings/reset` | Restaurar defaults do cargo |

### Webhooks

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/webhooks` | Listar webhooks |
| `POST` | `/api/webhooks` | Criar webhook (máx. 5) |
| `PATCH` | `/api/webhooks/:id` | Editar label, URL ou enabled |
| `DELETE` | `/api/webhooks/:id` | Excluir webhook |
| `POST` | `/api/webhooks/:id/test` | Disparar teste |

### Lookups

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/lookups/activity-types` | Tipos de atividade |
| `GET` | `/api/lookups/task-statuses` | Status de tarefa |
| `GET` | `/api/lookups/cargos` | Cargos |

### Integrações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/azure/status` | Verifica configuração Azure DevOps |
| `GET` | `/api/azure/ticket/:id` | Busca título do work item |
| `GET` | `/api/clickup/reports/:id` | Verifica se enviado ao ClickUp |
| `POST` | `/api/clickup/reports/:id` | Envia relatório ao ClickUp |

### Admin (requer `role=admin`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/users` | Listar todos os usuários |
| `POST` | `/api/admin/users` | Criar usuário |
| `PATCH` | `/api/admin/users/:id` | Editar usuário |
| `POST` | `/api/admin/users/:id/reset-password` | Redefinir senha |
| `DELETE` | `/api/admin/users/:id` | Excluir usuário |
| `GET` | `/api/admin/reports` | Relatórios de todos os usuários |

---

## Stack e estrutura de pastas

### Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express |
| ORM | Sequelize |
| Banco | MySQL / MariaDB |
| Autenticação | JWT |
| Validação | Joi |
| Agendamento | node-cron |
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| PDF | jsPDF + html2canvas (lazy-loaded) |
| Deploy | Railway / PM2 |

### Estrutura

```
weekly-reports/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexão com banco (Sequelize)
│   │   ├── controllers/     # Handlers HTTP (recebem req, chamam service)
│   │   ├── dtos/            # Schemas Joi para validação de entrada
│   │   ├── middleware/      # Auth JWT, validação, tratamento de erros
│   │   ├── models/          # Entidades Sequelize (User, Task, WeeklyReport...)
│   │   ├── routes/          # Definição de endpoints e agrupamento
│   │   ├── scripts/         # seedDatabase.js, syncDatabase.js
│   │   ├── services/        # Regras de negócio (chamados pelos controllers)
│   │   └── utils/           # isoWeek, response helper, AppError, validateEnv
│   ├── reports/generated/   # Arquivos .md gerados (ignorado pelo git)
│   ├── .env.example         # Template de variáveis de ambiente
│   ├── ecosystem.config.js  # Configuração PM2
│   └── server.js            # Ponto de entrada
├── frontend/
│   ├── src/
│   │   ├── components/      # Badge, PrivateRoute, Sidebar, Skeleton...
│   │   ├── contexts/        # AuthContext (token, user, login, logout)
│   │   ├── hooks/           # useLookups (activity types, statuses, cargos)
│   │   ├── lib/
│   │   │   ├── api.js       # Instância axios com interceptor de auth
│   │   │   └── generatePdf.js  # Geração de PDF no browser
│   │   └── pages/           # Dashboard, Reports, Tasks, Settings, Admin...
│   └── vite.config.js
├── railway.json             # Config de deploy Railway
├── README.md
└── ROADMAP.md
```
