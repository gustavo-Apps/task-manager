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
 * Inclui o conteudo real do relatorio no corpo da mensagem.
 * Trunca com aviso quando ultrapassa o limite do Discord (4096 chars no embed).
 */
function buildWebhookPayload({ event, report, username, mdContent }) {
  const statusLabel  = report.status === "closed" ? "Fechado" : "Em andamento";
  const period       = `${report.start_date} ate ${report.end_date}`;
  const taskCount    = report.tasks?.length ?? 0;
  const ticketCount  = report.tasks?.filter((t) => t.azure_ticket_id).length ?? 0;
  const weekRef      = `Semana ${report.week_number}/${report.year}`;

  const isGenerated  = event === "report.generated";
  const color        = isGenerated ? 0x3b82f6 : 0x22c55e;
  const title        = isGenerated
    ? `Relatorio gerado — ${weekRef}`
    : `Relatorio fechado — ${weekRef}`;

  // Conteudo do .md no corpo — truncado em 3800 chars para caber no embed
  const LIMIT = 3800;
  let descBody = "";
  if (mdContent) {
    descBody = mdContent.length > LIMIT
      ? mdContent.slice(0, LIMIT) + `\n\n_(... conteudo truncado — ${mdContent.length} chars no total)_`
      : mdContent;
  } else if (!isGenerated) {
    // Evento de fechamento: sem arquivo, monta resumo a partir das tasks
    const lines = [
      `**Colaborador:** ${username}  `,
      `**Periodo:** ${period}  `,
      `**Status:** ${statusLabel}  `,
      "",
      `**Total de atividades:** ${taskCount}  `,
      `**Tickets:** ${ticketCount}  `,
    ];
    if (report.tasks?.length) {
      lines.push("", "**Atividades:**");
      for (const t of report.tasks.slice(0, 20)) {
        const type   = t.activityType?.name  || "—";
        const status = t.taskStatus?.name    || "—";
        const ticket = t.azure_ticket_id ? ` \`#${t.azure_ticket_id}\`` : "";
        lines.push(`- [${type}]${ticket} ${t.title} _(${status})_`);
      }
      if (report.tasks.length > 20)
        lines.push(`_... e mais ${report.tasks.length - 20} atividades_`);
    }
    descBody = lines.join("\n");
    if (descBody.length > LIMIT)
      descBody = descBody.slice(0, LIMIT) + "\n\n_(... truncado)_";
  }

  return {
    // Campos planos para receptores genericos (Slack, Teams, n8n, etc.)
    event,
    username,
    week:    weekRef,
    period,
    status:  statusLabel,
    tasks:   taskCount,
    tickets: ticketCount,
    content: mdContent ?? null,
    // Embed Discord
    embeds: [
      {
        title,
        description: descBody || `Relatorio de **${weekRef}** por **${username}**.`,
        color,
        fields: [
          { name: "Periodo",     value: period,              inline: true },
          { name: "Status",      value: statusLabel,         inline: true },
          { name: "Atividades",  value: String(taskCount),   inline: true },
          { name: "Tickets",     value: String(ticketCount), inline: true },
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
  // Le o .md gerado para incluir o conteudo real no webhook
  const fs = require("fs");
  const mdContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : null;
  dispatchSilent(req.user.id, buildWebhookPayload({
    event:    "report.generated",
    report,
    username: req.user.username,
    mdContent,
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
    mdContent: null, // fechamento nao gera arquivo — resumo montado a partir das tasks
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
