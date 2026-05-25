/**
 * Script: sincroniza o schema do banco de dados.
 *
 * Uso: node src/scripts/syncDatabase.js
 *
 * Em desenvolvimento, use { alter: true } para ajustar tabelas sem perder dados.
 * Em produção, USE MIGRATIONS no lugar deste script.
 */

require("dotenv").config();

const { sequelize } = require("../config/database");
require("../models"); // importa todos os models para registrar no Sequelize

async function sync() {
  try {
    await sequelize.authenticate();
    console.log("Conexao estabelecida.");

    await sequelize.sync({ alter: true });
    console.log("Schema sincronizado com sucesso.");

    process.exit(0);
  } catch (err) {
    console.error("Erro ao sincronizar:", err.message);
    process.exit(1);
  }
}

sync();
