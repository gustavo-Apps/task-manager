# Weekly Reports

Sistema de registro de atividades semanais para equipes de QA e desenvolvimento.
Cada usuário registra suas tarefas durante a semana e gera um relatório em `.md` ou PDF ao final — formatado de acordo com suas próprias preferências.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Rodando o Projeto](#rodando-o-projeto)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Endpoints da API](#endpoints-da-api)
- [Funcionalidades](#funcionalidades)
- [Configurações por Usuário](#configurações-por-usuário)
- [Webhooks](#webhooks)
- [Exportação de Relatórios](#exportação-de-relatórios)
- [Painel Administrativo](#painel-administrativo)
- [Deploy](#deploy)
- [Convenção de Commits](#convenção-de-commits)

---

## Visão Geral

O fluxo principal é simples:

1. Usuário se cadastra e escolhe seu cargo
2. Durante a semana, registra tarefas no Dashboard
3. Ao final da semana, gera o relatório em `.md` (download direto) ou PDF formatado
4. O sistema fecha automaticamente o relatório às 00:05 de toda segunda-feira
5. Webhooks configurados recebem uma notificação automática ao gerar ou fechar um relatório

Cada usuário pode personalizar completamente o template do `.md` — título, cabeçalho, seções, rodapé — usando variáveis dinâmicas como `{{username}}`, `{{week_number}}`, `{{total_tasks}}`, entre outras.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express |
| ORM | Sequelize |
| Banco | MySQL / MariaDB |
| Autenticação | JWT (Bearer token) |
| Validação | Joi |
| Agendamento | node-cron |
| Frontend | React + Vite + Tailwind CSS |
| Build | Vite |
| Gerenciador de processo | PM2 (opcional) |
| Deploy | Railway (railway.json incluso) |

---

## Pré-requisitos

- Node.js >= 18
- MySQL ou MariaDB rodando localmente (ou remoto)
- npm

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/gustavo-Apps/task-manager.git
cd task-manager

# Instale as dependências do backend
cd backend
npm install

# Instale as dependências do frontend
cd ../frontend
npm install
```

---

## Variáveis de Ambiente

Copie o arquivo de exemplo e preencha:

```bash
cd backend
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente | `development` |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `3306` |
| `DB_NAME` | Nome do banco | `weekly_reports` |
| `DB_USER` | Usuário do banco | `root` |
| `DB_PASS` | Senha do banco | _(vazio se sem senha)_ |
| `JWT_SECRET` | Chave secreta do JWT | _(string longa e aleatória)_ |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` |
| `REPORTS_DIR` | Pasta para os `.md` gerados | `reports/generated` |

Gerar um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Banco de Dados

O Sequelize cria as tabelas automaticamente na primeira execução (`sync({ alter: true })`).
Para popular os dados iniciais (tipos de atividade, status de tarefa, cargos):

```bash
cd backend
npm run db:seed
```

Tabelas criadas automaticamente:

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema |
| `user_cargos` | Cargos disponíveis (Dev, QA, GP, etc.) |
| `activity_types` | Tipos de atividade (Teste, Reunião, etc.) |
| `task_statuses` | Status de tarefa (Pendente, Em andamento, Concluido, etc.) |
| `weekly_reports` | Relatórios semanais (um por usuário por semana ISO) |
| `tasks` | Tarefas vinculadas a um relatório |
| `settings` | Configurações por usuário (chave/valor) |
| `user_webhooks` | Webhooks de notificação por usuário (máx. 5) |
| `audit_logs` | Log de auditoria de alterações |

---

## Rodando o Projeto

### Desenvolvimento

```bash
# Backend (porta 3000)
cd backend
npm run dev

# Frontend (porta 5173, em outro terminal)
cd frontend
npm run dev
```

### Produção com PM2

```bash
cd backend
npm run pm2:start   # inicia
npm run pm2:status  # verifica
npm run pm2:logs    # logs em tempo real
npm run pm2:restart # reinicia
npm run pm2:stop    # para
```

### Build do frontend

```bash
cd frontend
npm run build
# Arquivos gerados em frontend/dist/
```

---

## Estrutura de Pastas

```
weekly-reports/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexão com banco
│   │   ├── controllers/     # Handlers HTTP
│   │   ├── dtos/            # Schemas Joi (validação)
│   │   ├── middleware/      # Autenticação, validação, erros
│   │   ├── models/          # Entidades Sequelize
│   │   ├── routes/          # Definição de endpoints
│   │   ├── scripts/         # Utilitários CLI (seed, sync)
│   │   ├── services/        # Regras de negócio
│   │   └── utils/           # Helpers (semana ISO, resposta HTTP, erros)
│   ├── reports/generated/   # Arquivos .md gerados (ignorado pelo git)
│   ├── .env.example
│   ├── ecosystem.config.js  # Configuração PM2
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # AuthContext
│   │   ├── hooks/           # useLookups, etc.
│   │   ├── lib/             # api.js (axios), generatePdf.js
│   │   └── pages/           # Páginas da aplicação
│   └── vite.config.js
├── railway.json             # Config de deploy Railway
└── ROADMAP.md
```

---

## Endpoints da API

Todos os endpoints protegidos exigem header:
```
Authorization: Bearer <token>
```

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro de usuário |
| `POST` | `/api/auth/login` | Login — retorna JWT |
| `GET` | `/api/auth/me` | Dados do usuário autenticado |
| `PATCH` | `/api/auth/profile` | Atualizar username ou senha |

### Tarefas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/tasks` | Listar tarefas (filtros: `type`, `status`, `date_from`, `date_to`, `q`) |
| `GET` | `/api/tasks/pending` | Tarefas com status diferente de Concluido (todas as semanas) |
| `POST` | `/api/tasks` | Criar tarefa |
| `GET` | `/api/tasks/:id` | Detalhe de uma tarefa |
| `PUT` | `/api/tasks/:id` | Atualizar tarefa |
| `PATCH` | `/api/tasks/:id/status` | Atualizar apenas o status |
| `POST` | `/api/tasks/:id/duplicate` | Duplicar tarefa |
| `DELETE` | `/api/tasks/:id` | Remover tarefa |

### Relatórios

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/reports` | Listar relatórios (paginado: `page`, `limit`) |
| `GET` | `/api/reports/current` | Relatório da semana atual |
| `GET` | `/api/reports/date/:date` | Relatório pela data (YYYY-MM-DD) |
| `GET` | `/api/reports/:id` | Detalhe de um relatório |
| `GET` | `/api/reports/:id/markdown` | Gerar e baixar `.md` |
| `GET` | `/api/reports/:id/json` | Exportar relatório em JSON |
| `POST` | `/api/reports/:id/close` | Fechar relatório manualmente |

### Configurações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/settings` | Todas as configurações do usuário |
| `GET` | `/api/settings/:key` | Uma configuração pelo key |
| `PUT` | `/api/settings/:key` | Salvar/atualizar configuração |
| `POST` | `/api/settings/reset` | Restaurar defaults do cargo |

### Webhooks

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/webhooks` | Listar webhooks do usuário |
| `POST` | `/api/webhooks` | Criar webhook (máx. 5) |
| `PATCH` | `/api/webhooks/:id` | Editar label, URL ou enabled |
| `DELETE` | `/api/webhooks/:id` | Remover webhook |
| `POST` | `/api/webhooks/:id/test` | Disparar payload de teste |

### Lookups

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/lookups/activity-types` | Tipos de atividade |
| `GET` | `/api/lookups/task-statuses` | Status de tarefa |
| `GET` | `/api/lookups/cargos` | Cargos disponíveis |

### Integrações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/azure/status` | Verifica se Azure DevOps está configurado |
| `GET` | `/api/azure/ticket/:id` | Busca título de um work item pelo ID |
| `GET` | `/api/clickup/reports/:id` | Verifica se relatório já foi enviado ao ClickUp |
| `POST` | `/api/clickup/reports/:id` | Envia relatório ao ClickUp como Doc |

### Painel Admin _(requer role=admin)_

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/users` | Listar todos os usuários |
| `POST` | `/api/admin/users` | Criar usuário |
| `PATCH` | `/api/admin/users/:id` | Editar usuário (nome, email, cargo, role, is_active) |
| `POST` | `/api/admin/users/:id/reset-password` | Redefinir senha |
| `DELETE` | `/api/admin/users/:id` | Remover usuário |
| `GET` | `/api/admin/reports` | Listar todos os relatórios de todos os usuários |

---

## Funcionalidades

### Dashboard
- Lista de tarefas da semana atual
- Filtros por tipo de atividade e status, persistidos na URL
- Busca por título
- Ordenação por coluna (Data, Tipo, Status, Ticket) com ícones ▲/▼
- Toggle de status inline por card (sem abrir formulário)
- Duplicar tarefa com um clique
- Botão "Gerar Relatório" — baixa o `.md` da semana atual diretamente

### Tarefas Pendentes
- Página `/pending` com todas as tarefas cujo status é diferente de "Concluido"
- Sem filtro de período — lista tudo em aberto de todas as semanas
- Mesmas ações do Dashboard (editar, duplicar, alterar status)
- Ao marcar como concluída, a tarefa some da lista automaticamente

### Relatórios
- Listagem paginada de semanas anteriores
- Download do `.md` por relatório ou por período (intervalo de datas)
- Exportação para PDF com layout formatado (A4, agrupado por tipo)
- Visualização detalhada com lista de tarefas
- Fechar relatório manualmente ou automaticamente (cron toda segunda 00:05)

### Perfil
- Edição de username e senha
- Email e cargo são somente leitura (gerenciados pelo admin)

---

## Configurações por Usuário

Acesse em **Configurações** no menu lateral. As abas disponíveis são:\n\n### Integração ClickUp\nConfigure o token da API e o Workspace ID para enviar relatórios como Doc no ClickUp.\n\n### Azure DevOps\nConfigure o token PAT, organização e projeto para buscar automaticamente o título de work items pelo ID ao criar uma tarefa.

### Relatório .md
Personalize o template do seu relatório por seção:\n\n| Seção | Descrição |
|---|---|
| Título | Linha de título do arquivo `.md` |
| Informativo Geral | Cabeçalho com dados do usuário e semana |
| Atividades | Template para cada tarefa listada |
| Tickets | Seção de tickets com Azure DevOps link |
| Rodapé | Linha final do relatório |

**Variáveis disponíveis** (clique no nome para inserir no cursor):

| Variável | Valor |
|---|---|
| `{{username}}` | Nome do usuário |
| `{{week_number}}` | Número da semana ISO |
| `{{year}}` | Ano |
| `{{period_start}}` | Data de início da semana (dd/mm/yyyy) |
| `{{period_end}}` | Data de fim da semana (dd/mm/yyyy) |
| `{{total_tasks}}` | Total de tarefas no relatório |
| `{{total_tickets}}` | Total de tarefas com ticket Azure |
| `{{generated_at}}` | Data/hora de geração |

Há um **preview ao vivo** com dados de exemplo e uma tabela de referência completa colapsável na interface.

Cada cargo tem um template padrão pré-configurado:
- Desenvolvedor
- Analista de Testes
- Gerente de Projeto
- Analista de Requisitos
- Engenheiro de DevOps

Para restaurar os defaults do seu cargo: botão **Restaurar Padrões** na aba de Relatório .md.

---

## Webhooks

Configure até **5 webhooks** por usuário em **Configurações > Webhooks**.

Os webhooks são disparados automaticamente em dois eventos:
- **Ao baixar o `.md`** de um relatório (`event: "report.generated"`)
- **Ao fechar um relatório** (`event: "report.closed"`)

O disparo é assíncrono — não bloqueia o download nem a resposta HTTP. Falhas individuais são registradas no log do servidor sem afetar os demais destinos.

### Payload enviado

```json
{
  "event": "report.generated",
  "username": "joao",
  "week": "Semana 23/2026",
  "period": "2026-06-02 ate 2026-06-08",
  "status": "Em andamento",
  "tasks": 12,
  "embeds": [
    {
      "title": "Relatório gerado — Semana 23/2026",
      "description": "O arquivo .md de Semana 23/2026 foi gerado por joao.",
      "color": 3905270,
      "fields": [
        { "name": "Período",    "value": "2026-06-02 ate 2026-06-08", "inline": true },
        { "name": "Status",     "value": "Em andamento",              "inline": true },
        { "name": "Atividades", "value": "12",                        "inline": true }
      ],
      "footer": { "text": "Weekly Reports" },
      "timestamp": "2026-06-08T14:00:00.000Z"
    }
  ]
}
```

**Compatibilidade:**
- **Discord** — usa o campo `embeds` automaticamente; aparece como card formatado
- **Slack / Teams / Mattermost** — usa os campos planos (`event`, `username`, `week`, etc.)
- Qualquer endpoint que aceite `POST` com `Content-Type: application/json`

Há um botão **Testar** por webhook para verificar a conectividade sem precisar gerar um relatório.

---

## Exportação de Relatórios

### Markdown (`.md`)
- Gerado pelo backend com base no template configurado pelo usuário
- Download direto via `GET /api/reports/:id/markdown`
- Disponível no detalhe do relatório e na lista de semanas
- Também disponível por período: intervalo de datas personalizável

### PDF
- Gerado 100% no browser (sem dependência de servidor)
- Layout A4, fundo branco, tipografia limpa
- Estrutura: header com semana/período/status, resumo por tipo de atividade, tabelas agrupadas por categoria, rodapé com data de geração
- Suporte a múltiplas páginas automaticamente
- Disponível no detalhe do relatório e na lista de semanas
- `jsPDF` e `html2canvas` carregados sob demanda (não afetam o carregamento inicial)

---

## Painel Administrativo

Acesse em `/admin` — visível no menu apenas para usuários com `role=admin`.

Funcionalidades:
- Listar todos os usuários com cargo, role e status ativo/inativo
- Criar usuário (nome, email, cargo, role, senha inicial)
- Editar usuário (nome, email, cargo, role, is_active)
- Redefinir senha de qualquer usuário
- Excluir usuário (não é possível excluir a própria conta)

Usuários não-admin que tentarem acessar `/admin` diretamente são redirecionados para o Dashboard.

---

## Deploy

O repositório inclui `railway.json` configurado para deploy no [Railway](https://railway.app):

```json
{
  "build": {
    "buildCommand": "npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend"
  },
  "deploy": {
    "startCommand": "node backend/server.js",
    "healthcheckPath": "/health"
  }
}
```

### Checklist antes do deploy

- [ ] Banco MySQL/MariaDB provisionado e acessível
- [ ] Variáveis de ambiente configuradas no painel do Railway (ou `.env` em VPS)
- [ ] `JWT_SECRET` gerado com `crypto.randomBytes(64)`
- [ ] `NODE_ENV=production`
- [ ] `npm run db:seed` executado uma vez para popular lookups
- [ ] Usuário admin criado via `POST /api/auth/register` com `role=admin` (ou via script)
- [ ] Frontend buildado (`npm run build` em `frontend/`) — servido como estático pelo Express em produção ou via CDN separado

---

## Convenção de Commits

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
docs:     documentação
chore:    setup, config, dependências
test:     testes
ui:       mudanças visuais / contraste / layout
```

## Convenção de Branches

```
master          produção (somente via PR)
feat/xxx        novas features
fix/xxx         correções pontuais
improve/xxx     melhorias e refatorações
```
