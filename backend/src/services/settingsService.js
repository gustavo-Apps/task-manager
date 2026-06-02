/**
 * Service: Settings
 *
 * Gerencia configuracoes da aplicacao persistidas no banco.
 * Fornece metodos de leitura, escrita e inicializacao dos defaults.
 */

const { Setting } = require("../models");
const AppError = require("../utils/AppError");

// Chaves conhecidas com seus defaults e descricoes
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
 * Garante que os registros padrao existem no banco.
 * Chamado no startup da aplicacao.
 */
async function initDefaults() {
  for (const def of SETTING_DEFAULTS) {
    await Setting.findOrCreate({
      where: { key: def.key },
      defaults: { key: def.key, value: def.value, description: def.description },
    });
  }
}

/**
 * Retorna todas as configuracoes.
 * Valores sensiveis (tokens) sao mascarados para exibicao.
 *
 * @param {boolean} masked - Se true, mascara tokens sensiveis
 */
async function getAll(masked = false) {
  const settings = await Setting.findAll({ order: [["key", "ASC"]] });

  if (!masked) return settings;

  return settings.map((s) => ({
    ...s.toJSON(),
    value: isSensitive(s.key) && s.value ? maskValue(s.value) : s.value,
  }));
}

/**
 * Retorna o valor bruto de uma chave especifica.
 *
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function getValue(key) {
  const setting = await Setting.findOne({ where: { key } });
  return setting?.value ?? null;
}

/**
 * Atualiza um conjunto de chaves/valores.
 * Aceita um objeto { key: value, ... }.
 *
 * @param {Object} updates
 */
async function setValues(updates) {
  const allowedKeys = SETTING_DEFAULTS.map((d) => d.key);

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      throw new AppError(`Chave de configuracao invalida: ${key}`, 400);
    }

    await Setting.update({ value: value ?? "" }, { where: { key } });
  }
}

function isSensitive(key) {
  return key.includes("token") || key.includes("secret") || key.includes("password");
}

function maskValue(value) {
  if (!value || value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

module.exports = { initDefaults, getAll, getValue, setValues };
