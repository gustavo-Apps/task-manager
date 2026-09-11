# Como rodar os testes

Pré-requisito: MySQL rodando localmente (mesmo host/usuário/senha configurados no `.env`).

## 1. Criar o banco de dados

```sql
CREATE DATABASE weekly_reports_test;
```

## 2. Criar as tabelas e inserir os dados iniciais

Os scripts de sync/seed usam o `.env` por padrão — aponte-os pro banco de teste na hora de rodar:

```bash
npx cross-env DB_NAME=weekly_reports_test node src/scripts/syncDatabase.js
npx cross-env DB_NAME=weekly_reports_test node src/scripts/seedDatabase.js
```

> O seed é obrigatório: sem ele a tabela `user_cargos` fica vazia, e criar um usuário com `cargo: 1` falha (viola a chave estrangeira).

## 3. Rodar os testes

```bash
npm test
```

Rodar um teste específico:

```bash
npx jest -t "nome do teste"
```
