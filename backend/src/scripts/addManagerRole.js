/**
 * Script: addManagerRole
 *
 * Adiciona o valor 'manager' ao ENUM role da tabela users
 * e cria a tabela user_managers se nao existir.
 *
 * Uso: node backend/src/scripts/addManagerRole.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { sequelize } = require("../config/database");

async function run() {
  try {
    await sequelize.authenticate();
    console.log("[Migration] Conexao OK.");

    // Alter ENUM
    await sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('user','manager','admin') NOT NULL DEFAULT 'user'"
    );
    console.log("[Migration] ENUM role atualizado para incluir 'manager'.");

    // Create user_managers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_managers (
        id            INT          NOT NULL AUTO_INCREMENT,
        manager_id    INT          NOT NULL,
        employee_id   INT          NOT NULL,
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_manager_employee (manager_id, employee_id),
        CONSTRAINT fk_um_manager  FOREIGN KEY (manager_id)  REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_um_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[Migration] Tabela user_managers criada (ou ja existia).");

    await sequelize.close();
    console.log("[Migration] Concluido.");
  } catch (err) {
    console.error("[Migration] Erro:", err.message);
    process.exit(1);
  }
}

run();
