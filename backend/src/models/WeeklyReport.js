/**
 * Model: WeeklyReport
 *
 * Agrupa as tarefas de uma semana específica para um usuário.
 * Criado automaticamente quando a primeira tarefa da semana é adicionada.
 *
 * Semanas seguem o padrão ISO 8601: começam na segunda-feira,
 * numeradas de 1 a 53. Isso garante consistência independente do fuso.
 *
 * Constraint única (user_id, week_number, year) impede duplicatas.
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class WeeklyReport extends Model {}

WeeklyReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    // Número da semana ISO (1-53)
    week_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 53 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Data de início e fim calculadas automaticamente no service
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // "open" = semana em andamento | "closed" = relatório finalizado
    status: {
      type: DataTypes.ENUM("open", "closed"),
      defaultValue: "open",
    },
    // Observações gerais da semana (campo livre do usuário)
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "WeeklyReport",
    tableName: "weekly_reports",
    underscored: true,
    indexes: [
      {
        // Garante que cada usuário tem no máximo um relatório por semana/ano
        unique: true,
        fields: ["user_id", "week_number", "year"],
      },
    ],
  }
);

module.exports = WeeklyReport;
