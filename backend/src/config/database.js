/**
 * Conexão com o banco de dados via Sequelize.
 *
 * Aceita as variáveis padrão (DB_*) ou as variáveis injetadas
 * automaticamente pelo plugin MySQL do Railway (MYSQL*).
 */

const { Sequelize } = require("sequelize");
const { getAuditNamespace } = require("../utils/auditContext");

// Railway injeta MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
// Fallback para DB_* usados no desenvolvimento local
const dbName = process.env.DB_NAME     || process.env.MYSQLDATABASE || "weekly_reports";
const dbUser = process.env.DB_USER     || process.env.MYSQLUSER     || "root";
const dbPass = process.env.DB_PASS     || process.env.MYSQLPASSWORD || "";
const dbHost = process.env.DB_HOST     || process.env.MYSQLHOST     || "localhost";
const dbPort = process.env.DB_PORT     || process.env.MYSQLPORT     || 3306;

// Integra o namespace CLS ao Sequelize ANTES de criar a instância.
// Isso garante que os hooks de auditoria consigam ler o userId
// do contexto do request atual, mesmo dentro de Promises encadeadas.
Sequelize.useCLS(getAuditNamespace());

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: Number(dbPort),
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = { sequelize };
