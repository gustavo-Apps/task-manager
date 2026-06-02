/**
 * Controller: WeeklyReports
 *
 * Gerencia visualização de relatórios e download do Markdown.
 */

const path = require("path");
const reportService = require("../services/reportService");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const list = asyncHandler(async (req, res) => {
  const reports = await reportService.listReports(req.user.id);
  return success(res, { reports });
});

const getCurrent = asyncHandler(async (req, res) => {
  const { report, created } = await reportService.getCurrentReport(req.user.id);
  return success(res, { report, created });
});

const getForDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError("Par\u00e2metro date inv\u00e1lido. Use o formato YYYY-MM-DD.", 400);
  }
  const { report, created } = await reportService.getReportForDate(req.user.id, date);
  return success(res, { report, created });
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

const downloadMarkdownForPeriod = asyncHandler(async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  const filePath = await reportService.generateMarkdownForPeriod(
    req.user.id,
    dataInicio,
    dataFim
  );

  res.download(filePath, path.basename(filePath), (err) => {
    if (err) {
      console.error("Erro ao enviar arquivo de periodo:", err.message);
    }
  });
});

module.exports = { list, getCurrent, getForDate, getOne, downloadMarkdown, downloadMarkdownForPeriod, close };
