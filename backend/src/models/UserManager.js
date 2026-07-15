const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class UserManager extends Model {}

UserManager.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "UserManager",
    tableName: "user_managers",
    underscored: true,
    indexes: [{ unique: true, fields: ["manager_id", "employee_id"] }],
  }
);

module.exports = UserManager;
