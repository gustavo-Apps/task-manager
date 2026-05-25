/**
 * Controller: WeeklyReports
 *
 * Gerencia visualização de relatórios e download do Markdown.
 */

const path = require("path");
const reportService = require("../services/reportService");
const { success } = require("../utils/response");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const list = asyncHandler(async (req, res) => {
  const reports = await reportService.listReports(req.user.id);
  return success(res, { reports });
});

const getOne = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(Number(req.params.id), req.user.id);
  return success(res, { report });
});

const downloadMarkdown = asyncHandler(async (req, res) => {
  const filePath = await reportService.generateMarkdown(
    Number(req.params.id),
    req.user.id
  );

  // Envia o arquivo como download com o header correto
  res.download(filePath, path.basename(filePath), (err) => {
    if (err) {
      console.error("Erro ao enviar arquivo:", err.message);
    }
  });
});

const close = asyncHandler(async (req, res) => {
  const report = await reportService.closeReport(Number(req.params.id), req.user.id);
  return success(res, { report });
});

module.exports = { list, getOne, downloadMarkdown, close };
