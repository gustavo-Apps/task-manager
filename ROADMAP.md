# Roadmap — Weekly Reports

---

## Fase 1 — Backend / API

### Sprint 1 — Fundação (concluída)
- [x] Estrutura de pastas e arquitetura em camadas (controllers / services / models / routes)
- [x] Conexão com banco MySQL/MariaDB via Sequelize
- [x] Models: User, ActivityType, TaskStatus, WeeklyReport, Task, Setting, AuditLog
- [x] Autenticação JWT (register / login / me)
- [x] Middleware de autenticação e validação (Joi)
- [x] CRUD completo de tarefas
- [x] Relatórios semanais criados automaticamente por semana ISO
- [x] Geração de arquivo Markdown com template configurável
- [x] Rate limiting nas rotas públicas

### Sprint 2 — Configurações e Personalização (concluída)
- [x] Settings por usuário (chave/valor, composta por user_id + key)
- [x] Templates padrão de .md por cargo (Dev, QA, GP, Requisitos, DevOps)
- [x] Interpolação de variáveis `{{variavel}}` nos campos do template
- [x] Audit logging via CLS + hooks Sequelize
- [x] PM2 (ecosystem.config.js) para gerenciamento de processo

### Sprint 3 — Funcionalidades Complementares (concluída)
- [x] Filtros em `/api/tasks`: tipo, status, intervalo de datas, busca por texto
- [x] Endpoints admin: listar usuários e relatórios de todos (`role=admin`)
- [x] Exportar relatório em JSON
- [x] Scheduler semanal (node-cron): fecha relatórios abertos toda segunda às 00:05
- [x] Paginação na listagem de relatórios
- [x] Validação de variáveis de ambiente obrigatórias na inicialização

---

## Fase 2 — Frontend

### Sprint 4 — Base UI (concluída)
- [x] React + Vite + Tailwind CSS
- [x] Tela de login com armazenamento seguro do token (AuthContext)
- [x] Dashboard da semana atual com lista de tarefas
- [x] Formulário de tarefa com autocomplete de tipo e status
- [x] Tema escuro (gray-950/900/800)
- [x] Toast notifications (sucesso / erro)

### Sprint 5 — Páginas de Relatório (concluída)
- [x] Listagem de semanas anteriores (ReportsPage) com paginação
- [x] Visualização de relatório com detalhe de tarefas (ReportDetailPage)
- [x] Download do .md por relatório e por período
- [x] TicketsPage — listagem de tickets por intervalo de datas

### Sprint 6 — Configurações (concluída)
- [x] SettingsPage com abas: Integração ClickUp, Relatório .md, Azure DevOps
- [x] Editor de template .md por seção com índice de variáveis clicável
- [x] Preview ao vivo do .md com dados de exemplo
- [x] Integração Azure DevOps: busca título do work item pelo ID automaticamente

### Sprint 7 — Polimento (concluída)
- [x] Botão "Gerar Relatório" com download direto no Dashboard
- [x] Skeleton screens nas listagens
- [x] Sidebar colapsável em mobile
- [x] Fixes: bug de edição de settings, paginação, contagem de relatórios

### Sprint 8 — Dashboard Avançado (concluída)
- [x] Página de Perfil (username e senha editáveis)
- [x] Filtros no Dashboard por tipo e status, persistidos na URL
- [x] Busca rápida por título, persistida na URL
- [x] Ordenação por coluna (Data, Tipo, Status, Ticket) com ícones ▲/▼
- [x] Toggle de status inline por card (sem abrir formulário)
- [x] Duplicar tarefa por card
- [x] Página de Pendentes: tarefas com status diferente de Concluido de todas as semanas

### Sprint 9 — Painel Administrativo (concluída)
- [x] Página `/admin` protegida por `role=admin`
- [x] CRUD completo de usuários pelo admin
- [x] Reset de senha por admin
- [x] Guard de rota: redireciona não-admins para o Dashboard
- [x] Menu "Admin" visível apenas para admins
- [x] Endpoints backend: `/api/admin/users` (GET, POST, PATCH, DELETE, reset-password)

---

## Fase 3 — Evoluções

- [x] Exportação para PDF (jsPDF + html2canvas, 100% no browser, lazy-loaded)
- [x] Integração Azure DevOps API (busca título de work item automaticamente)
- [x] Webhooks por usuário (máx. 5) com disparo ao gerar .md e ao fechar relatório
  - Payload inclui conteúdo real do .md + embed Discord-compatible
  - Compatível com Discord, Slack, Teams, n8n, qualquer endpoint HTTP
- [ ] Permissões granulares (RBAC: admin / user / viewer)
- [ ] Multi-tenant: relatórios por equipe, dashboard do gestor
- [ ] Deploy em produção documentado (Railway, Render, VPS)
- [ ] OAuth (Google / GitHub) como alternativa ao login por senha
- [ ] Envio do .md por email ao fechar o relatório (scheduler)

---

## Histórico de branches

| Branch | Objetivo |
|---|---|
| `master` | produção |
| `feat/sprint-9-admin` | painel admin + pendentes + webhooks + PDF |

---

## Convenção de commits

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: refatoração sem mudança de comportamento
docs:     documentação
chore:    setup, config, dependências
ui:       mudanças visuais / layout / contraste
```

## Convenção de branches

```
master       produção (somente via PR)
feat/xxx     novas funcionalidades
fix/xxx      correções pontuais
improve/xxx  refatorações e melhorias
```
