/**
 * Script: migra settings de global para por-usuario.
 *
 * O que faz:
 *   1. Adiciona coluna user_id na tabela settings (nullable inicialmente)
 *   2. Remove o unique index antigo (key)
 *   3. Adiciona unique index composto (user_id, key)
 *   4. Remove registros globais orfaos (sem user_id) - opcional, ver comentario
 *
 * Uso: node src/scripts/migrateSettingsPerUser.js
 */
require("dotenv").config();
const { sequelize } = require("../config/database");

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Conectado ao banco.");

    // 1. Adiciona coluna user_id se nao existir
    const [cols] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'user_id'
    `);

    if (cols.length === 0) {
      await sequelize.query(`
        ALTER TABLE settings
        ADD COLUMN user_id INT NULL DEFAULT NULL
        AFTER id
      `);
      console.log("Coluna user_id adicionada.");
    } else {
      console.log("Coluna user_id ja existe, pulando.");
    }

    // 2. Remove unique index antigo em (key) se existir
    const [indexes] = await sequelize.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings'
        AND INDEX_NAME = 'key' AND NON_UNIQUE = 0
    `);

    if (indexes.length > 0) {
      await sequelize.query(`ALTER TABLE settings DROP INDEX \`key\``);
      console.log("Unique index antigo (key) removido.");
    } else {
      console.log("Unique index antigo (key) nao encontrado, pulando.");
    }

    // 3. Adiciona unique index composto (user_id, key) se nao existir
    const [compIdx] = await sequelize.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings'
        AND INDEX_NAME = 'uq_settings_user_key'
    `);

    if (compIdx.length === 0) {
      await sequelize.query(`
        ALTER TABLE settings
        ADD UNIQUE INDEX uq_settings_user_key (user_id, \`key\`)
      `);
      console.log("Unique index composto (user_id, key) criado.");
    } else {
      console.log("Unique index composto ja existe, pulando.");
    }

    // 4. Remove registros globais (user_id NULL) — eram os defaults de sistema
    const [deleted] = await sequelize.query(`DELETE FROM settings WHERE user_id IS NULL`);
    console.log(`Registros globais removidos: ${deleted.affectedRows}`);

    console.log("\nMigracao concluida com sucesso.");
    process.exit(0);
  } catch (e) {
    console.error("Erro:", e.message);
    process.exit(1);
  }
}

run();
