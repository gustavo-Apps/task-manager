/**
 * Model: UserWebhook
 *
 * Armazena até MAX_PER_USER webhooks por usuário.
 * Usado para envio de relatórios ao fechar/gerar .md.
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

const MAX_PER_USER = 5;

class UserWebhook extends Model {}

UserWebhook.init(
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
    // Label legível para identificar o destino (ex: "Discord QA", "Teams Geral")
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // URL do webhook
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Se false, o webhook é ignorado no envio mas continua salvo
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "UserWebhook",
    tableName: "user_webhooks",
    underscored: true,
  }
);

UserWebhook.MAX_PER_USER = MAX_PER_USER;

module.exports = UserWebhook;
