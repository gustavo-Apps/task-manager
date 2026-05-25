/**
 * Model: ActivityType
 *
 * Tipos de atividade disponíveis no sistema.
 * Populado via seed com valores padrão.
 * Pode ser gerenciado por admins no futuro.
 *
 * Exemplos: Teste, Validação, Reunião, Documentação, Desenvolvimento
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class ActivityType extends Model {}

ActivityType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Cor em hexadecimal para uso no frontend (ex: "#3B82F6")
    color: {
      type: DataTypes.STRING(7),
      defaultValue: "#6B7280",
      validate: {
        is: /^#[0-9A-Fa-f]{6}$/,
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "ActivityType",
    tableName: "activity_types",
    underscored: true,
  }
);

module.exports = ActivityType;
