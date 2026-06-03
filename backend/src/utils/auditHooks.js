/**
 * auditHooks.js
 *
 * Define e registra os Sequelize hooks que gravam na tabela audit_logs.
 *
 * Como funciona:
 *   - afterCreate  → grava action=INSERT com new_data
 *   - afterUpdate  → grava action=UPDATE com old_data + new_data (só campos alterados)
 *   - afterDestroy → grava action=DELETE com old_data
 *
 * O userId é lido do contexto CLS (auditContext.getAuditUserId()).
 * Se não houver contexto ativo (scripts, seeds), changed_by fica null.
 *
 * Uso:
 *   const { applyAuditHooks } = require("../utils/auditHooks");
 *   applyAuditHooks(Task);
 *   applyAuditHooks(User);
 *   // ou para todos de uma vez, no models/index.js
 */

const AuditLog = require("../models/AuditLog");
const { getAuditUserId } = require("./auditContext");

/**
 * Extrai os dados puros de uma instância Sequelize como objeto simples.
 * Remove campos internos do Sequelize (_previousDataValues, etc.).
 *
 * @param {Model} instance
 * @returns {object}
 */
function toPlain(instance) {
  return instance.get({ plain: true });
}

/**
 * Retorna apenas os campos que mudaram em um UPDATE.
 * Compara _previousDataValues com dataValues.
 *
 * @param {Model} instance
 * @returns {{ old: object, new: object }}
 */
function extractChanges(instance) {
  const previous = instance._previousDataValues || {};
  const current = instance.dataValues;

  const changedFields = instance.changed() || Object.keys(current);

  const oldData = {};
  const newData = {};

  for (const field of changedFields) {
    oldData[field] = previous[field];
    newData[field] = current[field];
  }

  return { old: oldData, new: newData };
}

/**
 * Grava um registro em audit_logs.
 *
 * @param {object} params
 */
async function writeLog({ tableName, recordId, action, oldData, newData }) {
  try {
    await AuditLog.create({
      table_name: tableName,
      record_id: recordId ?? null,
      action,
      old_data: oldData ?? null,
      new_data: newData ?? null,
      changed_by: getAuditUserId(),
      changed_at: new Date(),
    });
  } catch (err) {
    // Nunca deixar a auditoria quebrar a operação principal
    console.error(`[AuditLog] Falha ao gravar log (${action} em ${tableName}):`, err.message);
  }
}

/**
 * Aplica os três hooks de auditoria em um model Sequelize.
 *
 * @param {typeof Model} model - Classe do model (ex: Task, User)
 */
function applyAuditHooks(model) {
  const tableName = model.getTableName();

  // INSERT
  model.addHook("afterCreate", "auditInsert", async (instance) => {
    await writeLog({
      tableName,
      recordId: instance.id,
      action: "INSERT",
      oldData: null,
      newData: toPlain(instance),
    });
  });

  // UPDATE — registra apenas os campos que mudaram
  model.addHook("afterUpdate", "auditUpdate", async (instance) => {
    const { old, new: newFields } = extractChanges(instance);
    await writeLog({
      tableName,
      recordId: instance.id,
      action: "UPDATE",
      oldData: old,
      newData: newFields,
    });
  });

  // DELETE
  model.addHook("afterDestroy", "auditDelete", async (instance) => {
    await writeLog({
      tableName,
      recordId: instance.id,
      action: "DELETE",
      oldData: toPlain(instance),
      newData: null,
    });
  });
}

/**
 * Aplica os hooks em uma lista de models de uma vez.
 *
 * @param {Array<typeof Model>} models
 */
function applyAuditHooksToAll(models) {
  for (const model of models) {
    applyAuditHooks(model);
  }
}

module.exports = { applyAuditHooks, applyAuditHooksToAll };
