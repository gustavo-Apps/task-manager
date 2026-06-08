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
 * Monta o payload compacto para Discord e receptores genericos.
 *
 * Discord usa apenas o campo `embeds` — o corpo e ignorado.
 * Receptores genericos (n8n, Slack, Teams) usem os campos planos.
 *
 * Limites Discord:
 *   - embed.title:       256 chars
 *   - embed.description: 4096 chars (nao usamos — apenas fields)
 *   - field.value:       1024 chars cada
 *   - total embed:       6000 chars somados
 *   - embeds por payload: 1 (usamos apenas 1)
 */
function buildWebhookPayload({ event, report, username }) {
  const statusLabel = report.status === "closed" ? "Fechado" : "Em andamento";
  const period      = `${report.start_date} ate ${report.end_date}`;
  const taskCount   = report.tasks?.length ?? 0;
  const ticketCount = report.tasks?.filter((t) => t.azure_ticket_id).length ?? 0;
  const weekRef     = `Semana ${report.week_number}/${report.year}`;

  const eventLabels = {
    "report.closed": { title: `Relatorio fechado — ${weekRef}`, color: 0x22c55e },
    "report.manual": { title: `Relatorio enviado — ${weekRef}`, color: 0x3b82f6 },
    "report.generated": { title: `Relatorio gerado — ${weekRef}`, color: 0x3b82f6 },
  };
  const { title, color } = eventLabels[event] ?? { title: weekRef, color: 0x6b7280 };

  // Lista de atividades compacta (max 15 itens, cada linha ~60 chars)
  let activityList = "";
  if (report.tasks?.length) {
    const items = report.tasks.slice(0, 15).map((t) => {
      const ticket = t.azure_ticket_id ? `#${t.azure_ticket_id} ` : "";
      const status = t.taskStatus?.name || "";
      return `• ${ticket}${t.title} (${status})`;
    });
    if (report.tasks.length > 15)
      items.push(`... e mais ${report.tasks.length - 15} atividades`);
    activityList = items.join("\n").slice(0, 1020); // field.value max 1024
  }

  const fields = [
    { name: "Colaborador", value: username,          inline: true },
    { name: "Periodo",     value: period,            inline: true },
    { name: "Status",      value: statusLabel,       inline: true },
    { name: "Atividades",  value: String(taskCount), inline: true },
    { name: "Tickets",     value: String(ticketCount), inline: true },
  ];

  if (activityList) {
    fields.push({ name: "Lista", value: activityList, inline: false });
  }

  return {
    // Campos planos para receptores genericos
    event,
    username,
    week:    weekRef,
    period,
    status:  statusLabel,
    tasks:   taskCount,
    tickets: ticketCount,
    // Embed Discord-compatible
    embeds: [
      {
        title,
        color,
        fields,
        footer:    { text: "Weekly Reports" },
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

  // Disparo automatico ao fechar — unico gatilho automatico restante
  dispatchSilent(req.user.id, buildWebhookPayload({
    event:    "report.closed",
    report,
    username: req.user.username,
  }));

  return success(res, { report });
});

/**
 * POST /api/reports/:id/notify
 * Disparo manual de webhook pelo usuario.
 * Valida: relatorio existe, pertence ao usuario, tem webhooks ativos.
 */
const notify = asyncHandler(async (req, res) => {
  const reportId = Number(req.params.id);

  if (!reportId || isNaN(reportId)) {
    throw new AppError("ID de relatorio invalido.", 400);
  }

  const report = await reportService.getReport(reportId, req.user.id);
  if (!report) {
    throw new AppError("Relatorio nao encontrado.", 404);
  }

  // Verifica se o usuario tem ao menos um webhook ativo
  const activeWebhooks = await webhookService.listByUser(req.user.id);
  const enabledCount   = activeWebhooks.filter((w) => w.enabled).length;

  if (activeWebhooks.length === 0) {
    throw new AppError(
      "Voce nao possui webhooks configurados. Acesse Configuracoes > Webhooks para adicionar.",
      422
    );
  }

  if (enabledCount === 0) {
    throw new AppError(
      `Voce possui ${activeWebhooks.length} webhook(s) cadastrado(s), mas nenhum esta ativo. Ative ao menos um em Configuracoes > Webhooks.`,
      422
    );
  }

  // Le o .md gerado (se existir) — apenas para logging interno; nao vai no payload
  // O payload Discord e compacto (apenas metadados + lista de tasks)
  const payload = buildWebhookPayload({
    event:    "report.manual",
    report,
    username: req.user.username,
  });

  // Disparo aguardado — retorna quais webhooks tiveram sucesso/falha
  const { sent, failed, results } = await webhookService.dispatch(req.user.id, payload);

  if (sent === 0) {
    // Expoe o erro real do primeiro destino que falhou
    const firstError = results.find((r) => !r.ok)?.error || "erro desconhecido";
    throw new AppError(
      `Falha ao enviar webhook. Detalhe: ${firstError}`,
      502
    );
  }

  const message = failed === 0
    ? `Webhook enviado com sucesso para ${sent} destino(s).`
    : `Enviado para ${sent} destino(s). ${failed} falhou — verifique as URLs em Configuracoes > Webhooks.`;

  return success(res, { sent, failed, results, message });
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

module.exports = { list, getCurrent, getForDate, getOne, exportJson, downloadMarkdown, downloadMarkdownForPeriod, close, notify };
