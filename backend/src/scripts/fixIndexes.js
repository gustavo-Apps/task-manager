/**
 * Script: limpa índices duplicados gerados pelo Sequelize alter:true.
 * Mantém apenas PRIMARY + um índice por coluna unique.
 * 
 * Uso: node src/scripts/fixIndexes.js
 */
require("dotenv").config();
const { sequelize } = require("../config/database");

const TABLES = ["users", "activity_types", "task_statuses", "settings", "user_cargos"];

async function fixTable(tableName) {
  const [rows] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);

  // Agrupa por Key_name
  const byKey = {};
  for (const row of rows) {
    if (!byKey[row.Key_name]) byKey[row.Key_name] = [];
    byKey[row.Key_name].push(row.Column_name);
  }

  // Para cada coluna, mantém só o primeiro índice não-PRIMARY e dropa os demais (name_2, name_3, ...)
  const keyNames = Object.keys(byKey);
  const toDrop = keyNames.filter(k => k !== "PRIMARY" && /_.+$/.test(k));

  if (toDrop.length === 0) {
    console.log(`${tableName}: ok, nenhum duplicado`);
    return;
  }

  for (const idx of toDrop) {
    await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${idx}\``);
    console.log(`${tableName}: dropped ${idx}`);
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    for (const t of TABLES) {
      await fixTable(t);
    }
    console.log("\nIndexes limpos com sucesso.");
    process.exit(0);
  } catch (e) {
    console.error("Erro:", e.message);
    process.exit(1);
  }
})();
