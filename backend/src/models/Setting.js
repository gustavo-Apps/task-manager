/**
 * Model: Setting
 *
 * Armazena configuracoes da aplicacao como pares chave/valor.
 * Usado para tokens e parametros de integracao (ex: ClickUp).
 * Evita dependencia de variaveis de ambiente para config de usuario.
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Setting extends Model {}

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Usuario dono desta configuracao
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    // Chave da configuracao (ex: "clickup_api_token") — unica por usuario
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // Valor da configuracao (texto livre)
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Descricao legivel para exibir na UI
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Setting",
    tableName: "settings",
    underscored: true,
  }
);

module.exports = Setting;
