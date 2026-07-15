/**
 * Model: User
 *
 * Representa um usuário do sistema.
 * A senha nunca é retornada nas queries (defaultScope exclui password_hash).
 * O role "admin" terá acesso a funcionalidades futuras de gestão.
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        // Permite apenas letras, números, ponto e underscore
        is: /^[a-zA-Z0-9._]+$/,
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    // Nunca armazene a senha em texto puro. Sempre use bcrypt.
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "manager", "admin"),
      defaultValue: "user",
      allowNull: false,
    },
    cargo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "user_cargos", key: "id" },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    underscored: true, // converte camelCase para snake_case nas colunas
    // defaultScope garante que password_hash nunca vaze nas queries padrão
    defaultScope: {
      attributes: { exclude: ["password_hash"] },
    },
  }
);

module.exports = User;
