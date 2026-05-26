/**
 * Model: Task
 *
 * Representa uma atividade realizada pelo usuário em um dia específico.
 * Sempre vinculada a um WeeklyReport (calculado automaticamente pelo service).
 *
 * Campo azure_ticket_id: quando preenchido, dispara geração automática do título
 * "Testado Hoje" no service de criação.
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    weekly_report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "weekly_reports", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    activity_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "activity_types", key: "id" },
    },
    // Título curto da atividade
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    // Descrição completa — o que foi feito, como, por quê
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Data em que a atividade foi realizada (determina a semana do relatório)
    task_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // Data de término — quando a tarefa dura mais de um dia.
    // Se nulo, assume-se que durou apenas o dia de task_date.
    task_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    task_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "task_statuses", key: "id" },
    },
    // Link direto para o tópico no Discord relacionado à tarefa
    discord_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: { isUrl: true },
    },
    // ID do ticket/caso de teste no Azure DevOps
    azure_ticket_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Campo livre para observações adicionais
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Task",
    tableName: "tasks",
    underscored: true,
  }
);

module.exports = Task;
