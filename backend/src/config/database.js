/**
 * Conexão com o banco de dados via Sequelize.
 *
 * Centraliza a instância do Sequelize para ser importada
 * pelos models e pelo server.js.
 */

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,     // máximo de conexões simultâneas
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = { sequelize };
