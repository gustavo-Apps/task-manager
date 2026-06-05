# Roadmap - Weekly Reports

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

### Sprint 3 - Funcionalidades Pendentes
- [ ] Filtros em `/api/tasks`: por tipo, data, status
- [ ] Rota admin para listar todos os usuarios e relatorios
- [ ] Exportar relatorio em JSON (alem do Markdown)
- [ ] Scheduler semanal (node-cron) para fechar relatorios automaticamente toda segunda-feira
- [ ] Paginacao na listagem de relatorios antigos
- [ ] Validar variaveis de ambiente obrigatorias na inicializacao
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

### Sprint 7 - Em andamento (branch: feat/dashboard-generate-button)
- [ ] Botao "Gerar Relatorio" de um clique no Dashboard
  - Gera o .md da semana atual e dispara download direto
  - Estado de loading durante a geracao
  - Toast de sucesso/erro
- [ ] Loading states e skeleton screens nas listagens
- [ ] Responsividade mobile basica
- [ ] Indicador visual de semana atual no Dashboard (header com numero da semana)

### Sprint 8 - Polimento Final
- [ ] Pagina de perfil do usuario (alterar nome, email, cargo, senha)
- [ ] Confirmacao antes de fechar um relatorio
- [ ] Filtros no Dashboard: por tipo de atividade, por status
- [ ] Busca rapida de tarefas por titulo

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
| `feat/dashboard-generate-button` | botao gerar relatorio + polish sprint 7 | em andamento |

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
