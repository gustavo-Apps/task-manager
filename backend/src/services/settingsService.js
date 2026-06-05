/**
 * Service: Settings
 *
 * Configuracoes por usuario — cada usuario tem seu proprio conjunto de valores.
 * A chave unica e (user_id, key).
 */

const { Setting } = require("../models");
const AppError = require("../utils/AppError");

// Defaults de personalização do .md por cargo (user_cargos.id)
// Fallback: cargo desconhecido usa os valores de 'default'
const MD_DEFAULTS_BY_CARGO = {
  // Analista de Testes (id=2)
  2: {
    md_verb:                  "Testado",
    md_ticket_section_title:  "Tickets Testados",
    md_activity_section_title:"Atividades de Teste Realizadas",
    md_report_title:          "Relatório Semanal — QA",
    md_footer:                "",
  },
  // Desenvolvedor (id=1)
  1: {
    md_verb:                  "Desenvolvido",
    md_ticket_section_title:  "Tickets Desenvolvidos",
    md_activity_section_title:"Atividades de Desenvolvimento",
    md_report_title:          "Relatório Semanal — Dev",
    md_footer:                "",
  },
  // Gerente de Projeto (id=3)
  3: {
    md_verb:                  "Acompanhado",
    md_ticket_section_title:  "Tickets Acompanhados",
    md_activity_section_title:"Atividades de Gestão",
    md_report_title:          "Relatório Semanal — Gestão",
    md_footer:                "",
  },
  // Analista de Requisitos (id=4)
  4: {
    md_verb:                  "Detalhado",
    md_ticket_section_title:  "Tickets Detalhados",
    md_activity_section_title:"Atividades de Requisitos",
    md_report_title:          "Relatório Semanal — Requisitos",
    md_footer:                "",
  },
  // Engenheiro de DevOps (id=5)
  5: {
    md_verb:                  "Configurado",
    md_ticket_section_title:  "Tickets Configurados",
    md_activity_section_title:"Atividades de DevOps",
    md_report_title:          "Relatório Semanal — DevOps",
    md_footer:                "",
  },
  default: {
    md_verb:                  "Realizado",
    md_ticket_section_title:  "Tickets Trabalhados",
    md_activity_section_title:"Atividades Realizadas",
    md_report_title:          "Relatório Semanal",
    md_footer:                "",
  },
};

// Chaves conhecidas com defaults fixos (independentes de cargo)
const SETTING_DEFAULTS_FIXED = [
  {
    key: "azure_devops_token",
    value: "",
    description: "Personal Access Token do Azure DevOps (permissao Work Items — Read)",
  },
  {
    key: "azure_devops_org",
    value: "",
    description: "Organizacao no Azure DevOps (ex: appelsoft)",
  },
  {
    key: "azure_devops_project",
    value: "",
    description: "Projeto no Azure DevOps (ex: Time Desktop - Desenvolvimento)",
  },
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
  {
    key: "clickup_doc_parent_id",
    value: "",
    description: "ID do destino onde o Doc sera criado (Space, Folder ou List)",
  },
  {
    key: "clickup_doc_parent_type",
    value: "",
    description: "Tipo do destino: space | folder | list",
  },
];

// Chaves de personalizacao do .md (defaults dependem do cargo)
const SETTING_DEFAULTS_MD = [
  {
    key: "md_verb",
    description: "Verbo usado para descrever o que foi feito (ex: Testado, Desenvolvido)",
  },
  {
    key: "md_report_title",
    description: "Titulo do relatorio no cabecalho do .md",
  },
  {
    key: "md_activity_section_title",
    description: "Titulo da secao de atividades no .md",
  },
  {
    key: "md_ticket_section_title",
    description: "Titulo da secao de tickets no .md",
  },
  {
    key: "md_footer",
    description: "Texto de rodape personalizado no .md (opcional)",
  },
  {
    key: "md_header_extra",
    description: "Texto adicional exibido no cabecalho do relatorio (ex: equipe, observacao geral)",
  },
];

// Lista completa para validacao de chaves permitidas
const SETTING_DEFAULTS = [
  ...SETTING_DEFAULTS_FIXED,
  ...SETTING_DEFAULTS_MD,
];

/**
 * Garante que os registros padrao existem para um usuario especifico.
 * Para chaves de .md, usa os defaults do cargo do usuario.
 *
 * @param {number} userId
 * @param {number|null} cargoId - ID do cargo (user_cargos.id); se null, usa 'default'
 */
async function initDefaultsForUser(userId, cargoId = null) {
  // Chaves fixas (ClickUp etc.)
  for (const def of SETTING_DEFAULTS_FIXED) {
    await Setting.findOrCreate({
      where: { user_id: userId, key: def.key },
      defaults: { user_id: userId, key: def.key, value: def.value ?? "", description: def.description },
    });
  }

  // Chaves do .md — valor default vem do cargo
  const mdDefaults = MD_DEFAULTS_BY_CARGO[cargoId] ?? MD_DEFAULTS_BY_CARGO.default;
  for (const def of SETTING_DEFAULTS_MD) {
    await Setting.findOrCreate({
      where: { user_id: userId, key: def.key },
      defaults: {
        user_id: userId,
        key: def.key,
        value: mdDefaults[def.key] ?? "",
        description: def.description,
      },
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
