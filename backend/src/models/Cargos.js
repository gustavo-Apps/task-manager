/**
 * Model: UserCargo
 *
 * Representa os cargos disponíveis para os usuários.
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class UserCargo extends Model {}

UserCargo.init(
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
    }
  },
  {
    sequelize,
    modelName: "UserCargos",
    tableName: "user_cargos",
    underscored: true,
  }
);

module.exports = UserCargo;