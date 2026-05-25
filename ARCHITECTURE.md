# Arquitetura — Weekly Reports API

## Visão Geral

API REST construída em Node.js + Express com banco de dados MySQL via Sequelize.
Segue o padrão de camadas: **Routes → Controllers → Services → Models**.

Cada camada tem uma responsabilidade clara e não "pula" camadas.

## Estrutura de Pastas

```
backend/
├── src/
│   ├── config/         # Conexão com banco, configurações globais
│   ├── controllers/    # Recebem a requisição HTTP, delegam para services
│   ├── dtos/           # Schemas Joi — validação e sanitização de entrada
│   ├── middleware/     # Autenticação, validação, tratamento de erros
│   ├── models/         # Entidades do banco via Sequelize
│   ├── routes/         # Definição de endpoints e associação com controllers
│   ├── scripts/        # Utilitários de linha de comando (seed, sync)
│   ├── services/       # Regras de negócio (a camada mais importante)
│   └── utils/          # Helpers: semana ISO, respostas HTTP, classe de erro
├── reports/
│   └── generated/      # Arquivos .md gerados — ignorado pelo git
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js           # Ponto de entrada
```

## Fluxo de uma Requisição

```
Cliente HTTP
    │
    ▼
Route (ex: POST /api/tasks)
    │  define qual controller e middlewares usar
    ▼
Middleware de Validação (Joi DTO)
    │  valida e sanitiza req.body; rejeita com 400 se inválido
    ▼
Middleware de Autenticação (JWT)
    │  verifica Bearer token; anexa req.user se válido
    ▼
Controller
    │  extrai dados de req.body/params/user; chama service
    ▼
Service
    │  regras de negócio; interage com models
    ▼
Model (Sequelize)
    │  executa query no MySQL
    ▼
Resposta JSON { ok: true, data: ... }
```

## Banco de Dados

### Entidades

**users**
- `id`, `username`, `email`, `password_hash`, `role` (user/admin), `is_active`
- Senha nunca retornada nas queries — excluída via `defaultScope`

**activity_types**
- `id`, `name`, `description`, `color` (hex), `is_active`
- Populado via seed com tipos padrão (Teste, Validação, Reunião, etc.)

**weekly_reports**
- `id`, `user_id`, `week_number`, `year`, `start_date`, `end_date`, `status` (open/closed)
- Constraint única: `(user_id, week_number, year)` — um relatório por semana por usuário
- Criado automaticamente ao adicionar a primeira tarefa da semana

**tasks**
- `id`, `weekly_report_id`, `user_id`, `activity_type_id`
- `title`, `description`, `task_date`, `status` (pending/in_progress/done)
- `discord_link`, `azure_ticket_id`, `notes`

### Relacionamentos

```
User ──< WeeklyReport ──< Task
                           │
ActivityType ─────────────┘
```

## Decisões de Design

### Por que Sequelize?
ORM com boa documentação e curva de aprendizado gradual.
Facilita sincronização automática em desenvolvimento (`sync({ alter: true })`).
Suporte a hooks, escopos e associações declarativas.

### Por que Joi para validação?
Schema declarativo — legível como documentação.
Retorna todos os erros de uma vez (`abortEarly: false`).
Remove campos desconhecidos automaticamente (`stripUnknown: true`).

### Por que JWT no Authorization header?
Padrão para APIs REST stateless — funciona com qualquer cliente (Postman, mobile, frontend).
Em produção com frontend browser, avaliar migração para httpOnly cookies.

### Semanas ISO (ISO 8601)
Semanas começam na segunda-feira, numeradas de 1 a 53.
Ao criar uma tarefa, a API detecta a semana pela `task_date` e cria o `WeeklyReport` automaticamente via `findOrCreate`.

### Geração de Markdown
Sob demanda via `GET /api/reports/:id/markdown`.
Salvo em `reports/generated/` e enviado como download (`Content-Disposition: attachment`).
Estrutura organizada por dia, com seção dedicada a tickets e resumo final.
