Gostaria de prosseguir no desenvolvimento da aplicação implementando um Painel Administrativo (Gestor).

Contexto:
Já existe um sistema onde colaboradores registram suas atividades semanais, tickets testados e relatórios. Agora desejo criar uma área exclusiva para gestores acompanharem suas equipes.

## Objetivo

Como Gestor, desejo visualizar apenas os colaboradores vinculados a mim, acompanhar suas atividades diárias e semanais, verificar produtividade e acessar os relatórios gerados.

## Regras de negócio

- Um gestor pode possuir vários colaboradores.
- Um colaborador pertence a apenas um gestor.
- Gestores não podem visualizar colaboradores de outros gestores.
- Administradores podem visualizar todos os gestores e colaboradores.
- Todas as consultas devem respeitar permissões por perfil.

---

# Perfis de acesso

## Administrador

Pode:

- Gerenciar usuários
- Criar gestores
- Criar colaboradores
- Vincular colaboradores aos gestores
- Alterar vínculos
- Visualizar toda a empresa
- Acessar métricas gerais

## Gestor

Pode:

- Visualizar somente seus colaboradores
- Acompanhar atividades
- Visualizar relatórios
- Filtrar informações
- Exportar relatórios

## Colaborador

Permanece apenas cadastrando e consultando seus próprios relatórios.

---

# Dashboard do Gestor

Ao acessar o painel, exibir:

## Cards

- Total de colaboradores
- Atividades realizadas hoje
- Atividades da semana
- Tickets testados na semana
- Colaboradores sem atividades hoje
- Colaboradores com atividades pendentes

---

## Lista de colaboradores

Tabela contendo:

- Nome
- Cargo
- Última atividade
- Quantidade de atividades na semana
- Tickets testados
- Status

Status pode ser:

🟢 Trabalhando
🟡 Sem atualização hoje
🔴 Sem atividade na semana

Ao clicar em um colaborador abrir sua página de detalhes.

---

# Página do colaborador

Exibir:

Dados pessoais

- Nome
- Cargo
- Email

Resumo

- Atividades hoje
- Atividades da semana
- Tickets testados
- Links Discord utilizados

Histórico semanal

Lista de semanas contendo:

Semana 25/2026

- Task 1
- Task 2
- Task 3

Semana 24/2026

...

Possibilidade de expandir cada semana.

---

# Filtros

Permitir filtrar por:

- Hoje
- Ontem
- Últimos 7 dias
- Semana atual
- Semana anterior
- Mês atual
- Intervalo personalizado

Também permitir filtrar por:

- Colaborador
- Tipo da atividade
- Ticket Azure
- Status

---

# Dashboard Analítico

Adicionar gráficos para facilitar acompanhamento.

Exemplos:

- Atividades por colaborador
- Tickets testados por semana
- Quantidade de atividades por dia
- Evolução semanal
- Colaboradores mais ativos
- Distribuição dos tipos de atividade

Utilizar gráficos modernos e responsivos.

---

# Relatórios

Permitir exportar:

- Markdown (.md)
- PDF
- Futuramente Excel

O gestor poderá exportar:

- Um colaborador específico
- Toda equipe
- Semana atual
- Intervalo personalizado

---

# Banco de Dados

Adicionar relacionamento:

Users

id
name
email
role

Roles

ADMIN
MANAGER
EMPLOYEE

UserManager

id
managerId
employeeId

Garantir integridade referencial.

---

# API

Criar endpoints:

GET /manager/dashboard

GET /manager/employees

GET /manager/employees/:id

GET /manager/reports

GET /manager/activities

GET /manager/statistics

GET /manager/export/md

GET /manager/export/pdf

Todos protegidos por autenticação JWT e autorização baseada em perfis (RBAC).

---

# Front-end

Criar um painel moderno inspirado em dashboards corporativos.

Menu lateral contendo:

Dashboard

Equipe

Relatórios

Atividades

Exportações

Configurações

Perfil

Utilizar componentes modernos, layout limpo, tema claro/escuro e totalmente responsivo.

---

# Segurança

- RBAC (Role-Based Access Control)
- Middleware de autorização
- Gestores acessam apenas seus colaboradores
- Logs de auditoria para exportações e consultas
- Proteção contra acesso direto por ID

---

# Arquitetura

Manter arquitetura em camadas:

Controllers

Services

Repositories

DTOs

Entities

Middlewares

Validators

Routes

Seguir princípios SOLID e Clean Architecture sempre que possível.

---

Objetivo final:

Construir um painel administrativo profissional semelhante aos utilizados em sistemas corporativos (Jira, Azure DevOps, Monday, ClickUp e Trello), com foco em gestão de equipes, acompanhamento de produtividade e geração de relatórios, mantendo o código limpo, escalável e de fácil manutenção.