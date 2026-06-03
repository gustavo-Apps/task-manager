/**
 * Service: Settings
 *
 * Configuracoes por usuario — cada usuario tem seu proprio conjunto de valores.
 * A chave unica e (user_id, key).
 */

const { Setting } = require("../models");
const AppError = require("../utils/AppError");

// Chaves conhecidas com defaults e descricoes
const SETTING_DEFAULTS = [
  {
    key: "clickup_api_token",
    value: "",
    description: "Token de API pessoal do ClickUp (Personal API Token)",
  },
  {
    key: "clickup_workspace_id",
    value: "",
    description: "ID do workspace no ClickUp (numero na URL: app.clickup.com/WORKSPACE_ID/...)",
  },
  {
    key: "clickup_assignee_id",
    value: "",
    description: "ID do usuario no ClickUp para atribuir as tasks (opcional)",
  },
];

/**
 * Garante que os registros padrao existem para um usuario especifico.
 * Chamado no primeiro acesso ou login.
 *
 * @param {number} userId
 */
async function initDefaultsForUser(userId) {
  for (const def of SETTING_DEFAULTS) {
    await Setting.findOrCreate({
      where: { user_id: userId, key: def.key },
      defaults: { user_id: userId, key: def.key, value: def.value, description: def.description },
    });
  }
}

/**
 * Retorna todas as configuracoes do usuario.
 *
 * @param {number} userId
 * @param {boolean} masked - Se true, mascara tokens sensiveis
 */
async function getAll(userId, masked = false) {
  // Garante que os defaults existem para este usuario
  await initDefaultsForUser(userId);

  const settings = await Setting.findAll({
    where: { user_id: userId },
    order: [["key", "ASC"]],
  });

  if (!masked) return settings;

  return settings.map((s) => ({
    ...s.toJSON(),
    value: isSensitive(s.key) && s.value ? maskValue(s.value) : s.value,
  }));
}

/**
 * Retorna o valor bruto de uma chave para um usuario especifico.
 *
 * @param {number} userId
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function getValue(userId, key) {
  const setting = await Setting.findOne({ where: { user_id: userId, key } });
  return setting?.value ?? null;
}

/**
 * Atualiza um conjunto de chaves/valores para um usuario.
 *
 * @param {number} userId
 * @param {Object} updates - { key: value, ... }
 */
async function setValues(userId, updates) {
  const allowedKeys = SETTING_DEFAULTS.map((d) => d.key);

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      throw new AppError(`Chave de configuracao invalida: ${key}`, 400);
    }

    const [, created] = await Setting.findOrCreate({
      where: { user_id: userId, key },
      defaults: { user_id: userId, key, value: value ?? "" },
    });

    if (!created) {
      await Setting.update({ value: value ?? "" }, { where: { user_id: userId, key } });
    }
  }
}

function isSensitive(key) {
  return key.includes("token") || key.includes("secret") || key.includes("password");
}

function maskValue(value) {
  if (!value || value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

module.exports = { initDefaultsForUser, getAll, getValue, setValues };
