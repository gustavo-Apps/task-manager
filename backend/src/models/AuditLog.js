/**
 * Model: AuditLog
 *
 * Registra todas as operações de INSERT, UPDATE e DELETE feitas nos models
 * auditados. Preenchido automaticamente pelos Sequelize hooks definidos em
 * src/utils/auditHooks.js — não deve ser escrito manualmente.
 *
 * Campos:
 *   table_name  — nome da tabela afetada
 *   record_id   — PK do registro afetado
 *   action      — INSERT | UPDATE | DELETE
 *   old_data    — estado anterior (null em INSERT)
 *   new_data    — estado novo (null em DELETE)
 *   changed_by  — ID do usuário que fez a operação (via CLS)
 *   changed_at  — timestamp automático
 */

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    table_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // null quando o ID não é inteiro simples
    },
    action: {
      type: DataTypes.ENUM("INSERT", "UPDATE", "DELETE"),
      allowNull: false,
    },
    // Estado anterior do registro (null em INSERT)
    old_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Estado novo do registro (null em DELETE)
    new_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // ID do usuário responsável pela ação — vem do CLS
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = ação de sistema/seed/migration
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "audit_logs",
    underscored: true,
    timestamps: false, // gerenciamos changed_at manualmente
  }
);

module.exports = AuditLog;
