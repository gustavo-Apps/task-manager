/**
 * Controller: WeeklyReports
 *
 * Gerencia visualização de relatórios e download do Markdown.
 */

const path = require("path");
const reportService = require("../services/reportService");
const webhookService = require("../services/webhookService");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Monta o payload Discord-friendly para envio via webhook.
 * Usa "embeds" se o destino for Discord; caso contrario payload generico JSON.
 * O dispatch no service envia o objeto inteiro como JSON — cabe ao receptor usar o que quiser.
 */
function buildWebhookPayload({ event, report, username, filePath }) {
  const statusLabel = report.status === "closed" ? "Fechado" : "Em andamento";
  const period      = `${report.start_date} ate ${report.end_date}`;
  const taskCount   = report.tasks?.length ?? 0;
  const weekRef     = `Semana ${report.week_number}/${report.year}`;

  // Payload compativel com Discord Webhooks (embeds) e outros (campos planos)
  return {
    // Campos planos para receptores genericos
    event,
    username,
    week:    weekRef,
    period,
    status:  statusLabel,
    tasks:   taskCount,
    // Embed Discord
    embeds: [
      {
        title:       event === "report.generated" ? `Relatorio gerado — ${weekRef}` : `Relatorio fechado — ${weekRef}`,
        description: event === "report.generated"
          ? `O arquivo .md de **${weekRef}** foi gerado por **${username}**.`
          : `O relatorio de **${weekRef}** foi fechado por **${username}**.`,
        color: event === "report.generated" ? 0x3b82f6 : 0x22c55e,
        fields: [
          { name: "Periodo",     value: period,            inline: true },
          { name: "Status",      value: statusLabel,       inline: true },
          { name: "Atividades",  value: String(taskCount), inline: true },
        ],
        footer: { text: "Weekly Reports" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/** Dispara webhooks em background — nunca bloqueia a resposta HTTP. */
function dispatchSilent(userId, payload) {
  webhookService.dispatch(userId, payload).catch((err) =>
    console.error("[webhook dispatch]", err.message)
  );
}

const list = asyncHandler(async (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await reportService.listReports(req.user.id, { page, limit });
  return success(res, result);
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
  const reportId = Number(req.params.id);
  const filePath = await reportService.generateMarkdown(reportId, req.user.id);

  // Disparo silencioso — nao bloqueia o download
  const report = await reportService.getReport(reportId, req.user.id);
  dispatchSilent(req.user.id, buildWebhookPayload({
    event:    "report.generated",
    report,
    username: req.user.username,
    filePath,
  }));

  res.download(filePath, path.basename(filePath), (err) => {
    if (err) console.error("Erro ao enviar arquivo:", err.message);
  });
});

const exportJson = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(Number(req.params.id), req.user.id);
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-semana${report.week_number}-${report.year}.json"`);
  res.setHeader('Content-Type', 'application/json');
  return res.json({ report });
});

const close = asyncHandler(async (req, res) => {
  const report = await reportService.closeReport(Number(req.params.id), req.user.id);

  // Disparo silencioso após fechar
  dispatchSilent(req.user.id, buildWebhookPayload({
    event:    "report.closed",
    report,
    username: req.user.username,
  }));

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

module.exports = { list, getCurrent, getForDate, getOne, exportJson, downloadMarkdown, downloadMarkdownForPeriod, close };
