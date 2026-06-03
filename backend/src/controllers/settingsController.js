/**
 * Controller: Settings
 *
 * GET  /api/settings  - lista configuracoes do usuario logado (valores mascarados)
 * PUT  /api/settings  - atualiza configuracoes do usuario logado
 */

const settingsService = require("../services/settingsService");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getAll = asyncHandler(async (req, res) => {
  // Passa o cargo para garantir defaults corretos na primeira inicializacao
  await settingsService.initDefaultsForUser(req.user.id, req.user.cargo);
  const settings = await settingsService.getAll(req.user.id, true);
  return success(res, { settings });
});

const update = asyncHandler(async (req, res) => {
  const updates = req.body;

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new AppError("Body invalido. Envie um objeto { chave: valor }.", 400);
  }

  await settingsService.setValues(req.user.id, updates);

  const settings = await settingsService.getAll(req.user.id, true);
  return success(res, { settings, message: "Configuracoes salvas com sucesso." });
});

module.exports = { getAll, update };
