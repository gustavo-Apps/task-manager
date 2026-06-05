/**
 * Controller: ClickUp Integration
 *
 * GET  /api/clickup/status           - valida se as configuracoes estao ok
 * GET  /api/clickup/reports/:id      - verifica se o relatorio ja tem Doc vinculado
 * POST /api/clickup/reports/:id      - envia (ou atualiza) o relatorio no ClickUp
 *                                      body: { overwrite: true } para sobrescrever
 */

const clickupService = require("../services/clickupService");
const { success } = require("../utils/response");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const checkStatus = asyncHandler(async (req, res) => {
  await clickupService.getClickUpConfig(req.user.id);
  return success(res, { configured: true, message: "ClickUp configurado corretamente." });
});

const getDocStatus = asyncHandler(async (req, res) => {
  const reportId = Number(req.params.id);
  const result = await clickupService.getReportClickUpStatus(reportId, req.user.id);
  return success(res, result);
});

const sendReport = asyncHandler(async (req, res) => {
  const reportId = Number(req.params.id);
  const overwrite = req.body?.overwrite === true;
  const result = await clickupService.sendReportToClickUp(reportId, req.user.id, overwrite);
  const message = result.updated
    ? "Doc atualizado no ClickUp com sucesso."
    : "Relatorio enviado para o ClickUp com sucesso.";
  return success(res, { message, doc: result });
});

const listDestinations = asyncHandler(async (req, res) => {
  const destinations = await clickupService.listDestinations(req.user.id);
  return success(res, { destinations });
});

module.exports = { sendReport, checkStatus, getDocStatus, listDestinations };
