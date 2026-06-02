require("dotenv").config();
const { sequelize } = require("../config/database");
const settingsService = require("../services/settingsService");

async function migrate() {
  const [rows] = await sequelize.query("SELECT value FROM settings WHERE `key` = 'clickup_list_id'");
  const oldValue = rows[0]?.value || "";

  await sequelize.query("DELETE FROM settings WHERE `key` = 'clickup_list_id'");
  console.log("Removida chave clickup_list_id");

  await settingsService.initDefaults();
  console.log("Defaults inicializados");

  if (oldValue) {
    await settingsService.setValues({ clickup_workspace_id: oldValue });
    console.log("Valor migrado:", oldValue);
  }

  console.log("Migracao concluida.");
  process.exit(0);
}

migrate().catch((e) => { console.error(e.message); process.exit(1); });
