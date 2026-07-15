/**
 * Script: syncManagerTable
 *
 * Sincroniza o model UserManager com o banco usando Sequelize alter.
 * Util em ambientes de desenvolvimento para aplicar mudancas de schema.
 *
 * Uso: node backend/src/scripts/syncManagerTable.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const UserManager = require("../models/UserManager");

async function run() {
  try {
    await UserManager.sync({ alter: true });
    console.log("[Sync] Tabela user_managers sincronizada com sucesso.");
    process.exit(0);
  } catch (err) {
    console.error("[Sync] Erro:", err.message);
    process.exit(1);
  }
}

run();
