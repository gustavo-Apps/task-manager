# Roadmap — Weekly Reports

## Fase 1 - Backend/API

### Sprint 1 - Fundacao (concluida)
- [x] Estrutura de pastas e arquitetura em camadas
- [x] Configuracao do banco de dados (MySQL/MariaDB + Sequelize)
- [x] Models: User, ActivityType, TaskStatus, WeeklyReport, Task, Setting, AuditLog
- [x] Autenticacao JWT (register / login / me)
- [x] Middleware de autenticacao e validacao (Joi)
- [x] CRUD completo de tarefas
- [x] Relatorios semanais criados automaticamente por semana ISO
- [x] Geracao de arquivo Markdown (generateMarkdown / generateMarkdownForPeriod)
- [x] Rate limiting nas rotas publicas (express-rate-limit)

### Sprint 2 - Settings e Personalizacao (concluida)
- [x] Settings por usuario — chave unica composta (user_id, key)
- [x] Defaults de .md por cargo (5 cargos: Dev, QA, GP, Requisitos, DevOps)
- [x] initDefaultsForUser(userId, cargoId) — criado no primeiro acesso
- [x] Audit logging: CLS + Sequelize hooks (AuditLog model)
- [x] cargo incluido no JWT payload e em req.user
- [x] Interpolacao de variaveis {{variavel}} nos campos de .md
  - {{username}}, {{week_number}}, {{year}}, {{period_start}}, {{period_end}}
  - {{total_tasks}}, {{total_tickets}}, {{generated_at}}
- [x] Quebra de linha correta no cabecalho do .md (trailing two-space)
- [x] PM2 (ecosystem.config.js) para gerenciamento local do processo

### Sprint 3 - Funcionalidades Pendentes (concluida)
- [x] Filtros em `/api/tasks`: por tipo (`activity_type_id`), status (`task_status_id`), e intervalo de datas (`date_from` / `date_to`)
- [x] Rota admin para listar todos os usuarios (`GET /api/admin/users`) e relatorios (`GET /api/admin/reports`) — requer `role=admin`
- [x] Exportar relatorio em JSON: `GET /api/reports/:id/json`
- [x] Scheduler semanal (`node-cron`) — toda segunda-feira 00:05 fecha relatorios abertos da semana anterior
- [x] Paginacao na listagem de relatorios — backend retorna `{ reports, total, page, totalPages }`; frontend com controles Anterior/Proxima
- [x] Validar variaveis de ambiente obrigatorias na inicializacao (`src/utils/validateEnv.js`) — processo encerra com erro se faltar variavel critica
- [ ] Documentar endpoints no README com exemplos de request/response

---

## Fase 2 - Frontend

### Sprint 4 - UI Base (concluida)
- [x] Setup React + Vite + TailwindCSS
- [x] Tela de login com armazenamento seguro do token
- [x] Dashboard da semana atual com lista de tarefas
- [x] Formulario de nova tarefa (com autocomplete de tipo e status)
- [x] Tema escuro — paleta gray-950/900/800, texto minimo gray-300
- [x] Toast notifications (sucesso/erro)

### Sprint 5 - Funcionalidades UI (concluida)
- [x] Listagem de semanas anteriores (ReportsPage)
- [x] Visualizacao de relatorio com detalhes (ReportDetailPage)
- [x] Botao "Gerar Markdown" com download automatico
- [x] TicketsPage — listagem de tickets por intervalo de datas
- [x] Cards visuais por tipo de atividade

### Sprint 6 - Configuracoes e Personalizacao (concluida)
- [x] SettingsPage com abas: Integracao ClickUp | Relatorio .md
- [x] Editor de .md por secao (Titulo, Informativo Geral, Atividades, Tickets, Rodape)
- [x] Indice de variaveis clicavel por campo (insere na posicao do cursor)
- [x] Preview ao vivo do .md com resolucao de variaveis por dados de exemplo
- [x] Referencia completa de variaveis (tabela colapsavel)
- [x] Contraste melhorado em todas as paginas

### Sprint 7 - Polimento UI (concluida)
- [x] Botao "Gerar Relatorio" de um clique no Dashboard — gera .md da semana atual com download direto, loading state e toast de sucesso/erro
- [x] Skeleton screens nas listagens (Dashboard, ReportsPage)
- [x] Responsividade mobile basica — sidebar colapsavel em telas pequenas
- [x] Indicador visual de semana atual no Dashboard — badge "Semana atual" no header

**Fixes aplicados na mesma sprint:**
- [x] `SettingsPage` — bug que impedia apagar texto nos campos do relatorio .md (form inicializado com `null` em vez de `""`)
- [x] `TicketsPage` — botao Editar trocado de `<a href>` para `<Link>` (evita reload completo da SPA)
- [x] `ReportsPage` — contagem exibida corrigida para usar `total` real do backend
- [x] `ReportsPage` — controles de paginacao adicionados (Anterior / Pagina X de Y / Proxima)
- [x] `validateEnv.js` — `DB_PASSWORD` removido das variaveis obrigatorias (banco local sem senha)

### Sprint 8 - Polimento Final (concluida)
- [x] Pagina de perfil do usuario — username e senha editaveis; email/cargo readonly (backend nao suporta)
- [x] Confirmacao antes de fechar um relatorio (window.confirm + POST /api/reports/:id/close)
- [x] Filtros no Dashboard: por tipo de atividade (?type=) e por status (?status=), persistidos na URL
- [x] Busca rapida de tarefas por titulo (?q=), persistida na URL
- [x] Ordenacao por coluna no Dashboard (Data, Tipo, Status, Ticket) com icones ▲/▼, persistida na URL
- [x] Ordenacao por coluna na TicketsPage com icones ▲/▼
- [x] Toggle de status inline por card no Dashboard (PATCH /api/tasks/:id/status)
- [x] Duplicar tarefa por card no Dashboard (POST /api/tasks/:id/duplicate)
- [x] navigate(-1) no TaskFormPage — filtros preservados ao voltar de edicao

### Sprint 9 - Painel Administrativo
- [ ] Pagina /admin protegida por role=admin
- [ ] Listagem de todos os usuarios (nome, email, cargo, criado em)
- [ ] Criar usuario via formulario (sem POST direto na API)
- [ ] Editar usuario: nome, email, cargo, senha, role
- [ ] Desativar/reativar usuario (soft delete ou campo is_active)
- [ ] Backend: endpoint PATCH /api/admin/users/:id e POST /api/admin/users
- [ ] Rota de frontend protegida: redireciona para /dashboard se nao for admin

---

## Fase 3 - Evolucoes Futuras

- [ ] Exportacao para PDF (Puppeteer ou jsPDF)
- [ ] Integracao com Azure DevOps API (buscar titulo do ticket automaticamente)
- [ ] Webhook para Discord ao fechar/gerar relatorio
- [ ] Permissoes granulares (RBAC - admin/user/viewer)
- [ ] Multi-tenant: relatorios por equipe, dashboard do gestor
- [ ] Deploy em producao (Railway, Render, ou VPS)
- [ ] Autenticacao via OAuth (Google/GitHub) como alternativa
- [ ] Scheduler semanal: fechar relatorio e enviar .md por email/Discord automaticamente

---

## Historico de branches

| Branch | Objetivo | Status |
|--------|----------|--------|
| `master` | producao | ativo |
| `feat/dashboard-generate-button` | botao gerar relatorio + polish sprint 7 | concluida |

---

## Convencao de Commits

```
feat: nova funcionalidade
fix: correcao de bug
refactor: refatoracao sem mudanca de comportamento
docs: documentacao
chore: setup, config, dependencias
test: testes
ui: mudancas visuais / contraste / layout
```

## Convencao de Branches

```
main / master   producao (so via PR)
develop         integracao (quando necessario)
feat/xxx        novas features
fix/xxx         correcoes pontuais
```
