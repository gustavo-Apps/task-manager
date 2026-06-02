/**
 * Controller: Settings
 *
 * GET  /api/settings       - lista todas as configuracoes (valores mascarados)
 * PUT  /api/settings       - atualiza um ou mais pares chave/valor
 */

const settingsService = require("../services/settingsService");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getAll = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAll(true); // mascarado para exibicao
  return success(res, { settings });
});

const update = asyncHandler(async (req, res) => {
  const updates = req.body;

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new AppError("Body invalido. Envie um objeto { chave: valor }.", 400);
  }

  await settingsService.setValues(updates);

  const settings = await settingsService.getAll(true);
  return success(res, { settings, message: "Configuracoes salvas com sucesso." });
});

module.exports = { getAll, update };
