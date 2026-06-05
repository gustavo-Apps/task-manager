# Roadmap — Weekly Reports

## Fase 1 — Backend/API

### Sprint 1 — Fundação (scaffolding atual)
- [x] Estrutura de pastas e arquitetura em camadas
- [x] Configuração do banco de dados (MySQL + Sequelize)
- [x] Models: User, ActivityType, WeeklyReport, Task
- [x] Autenticação JWT (register / login / me)
- [x] Middleware de autenticação e validação (Joi)
- [x] CRUD completo de tarefas
- [x] Relatórios semanais criados automaticamente
- [x] Geração de arquivo Markdown

### Sprint 2 — Testes e Refinamentos
- [ ] Testar todos os endpoints com Postman ou Thunder Client
- [ ] Validar fluxo: login → criar tarefa → gerar .md
- [ ] Documentar endpoints no README com exemplos de request/response
- [x] Adicionar rate limiting nas rotas públicas (express-rate-limit)
- [ ] Validar variáveis de ambiente obrigatórias na inicialização

### Sprint 3 — Funcionalidades Extras
- [ ] Filtros em `/api/tasks`: por tipo, data, status
- [ ] Rota admin para listar todos os usuários e relatórios
- [ ] Exportar relatório em JSON (além do Markdown)
- [ ] Scheduler semanal (node-cron) para fechar relatórios automaticamente toda segunda-feira
- [ ] Paginação na listagem de relatórios antigos

---

## Fase 2 — Frontend

### Stack sugerida: React + Vite + TailwindCSS

### Sprint 4 — UI Base
- [x] Setup React + Vite
- [x] Tela de login com armazenamento seguro do token
- [x] Dashboard da semana atual com lista de tarefas
- [x] Formulário de nova tarefa (com autocomplete de tipo)

### Sprint 5 — Funcionalidades UI
- [x] Listagem de semanas anteriores
- [x] Visualização de relatório com filtros
- [x] Botão "Gerar Markdown" com download automático
- [x] Cards visuais por tipo de atividade (cores)

### Sprint 6 — Polimento
- [x] Tema escuro (dark mode)
- [ ] Responsividade mobile
- [x] Toast notifications (sucesso/erro)
- [ ] Loading states e skeleton screens

---

## Fase 3 — Evoluções Futuras

- [ ] Exportação para PDF (Puppeteer ou jsPDF)
- [ ] Integração com Azure DevOps API (buscar título do ticket automaticamente)
- [ ] Webhook para Discord ao fechar/gerar relatório
- [ ] Permissões granulares (RBAC — admin/user/viewer)
- [ ] Multi-tenant: relatórios por equipe
- [ ] Deploy em produção (Railway, Render, ou VPS)
- [ ] Autenticação via OAuth (Google/GitHub) como alternativa

---

## Git — Convenção de Commits

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudança de comportamento
docs: documentação
chore: setup, config, dependências
test: testes
```

Exemplos:
```
feat: adicionar rota de geração de markdown
fix: corrigir cálculo de semana ISO para ano-virada
docs: documentar endpoints de autenticação
chore: adicionar .env.example com variáveis obrigatórias
```

## Sugestão de Branches

```
main        → produção (só via PR)
develop     → integração
feat/xxx    → novas features
fix/xxx     → correções
```
