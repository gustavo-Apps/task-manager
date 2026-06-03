/**
 * Service: ClickUp Integration
 *
 * Envia um relatorio semanal como Doc no ClickUp (API v3).
 * O conteudo e enviado em Markdown (content_format: "text/md"),
 * o que garante formatacao correta dentro do Doc.
 *
 * Suporte a overwrite: se o relatorio ja tem um Doc vinculado,
 * atualiza o conteudo existente em vez de criar um novo.
 */

const settingsService = require("./settingsService");
const reportService = require("./reportService");
const AppError = require("../utils/AppError");

const CLICKUP_V3 = "https://api.clickup.com/api/v3";

/**
 * Busca e valida as configuracoes necessarias para o ClickUp de um usuario.
 *
 * @param {number} userId
 */
async function getClickUpConfig(userId) {
  const [token, workspaceId] = await Promise.all([
    settingsService.getValue(userId, "clickup_api_token"),
    settingsService.getValue(userId, "clickup_workspace_id"),
  ]);

  if (!token)       throw new AppError("ClickUp API Token nao configurado. Configure em Configuracoes.", 422);
  if (!workspaceId) throw new AppError("ClickUp Workspace ID nao configurado. Configure em Configuracoes.", 422);

  return { token, workspaceId };
}

/**
 * Verifica se o relatorio ja tem um Doc vinculado no ClickUp.
 *
 * @param {number} reportId
 * @param {number} userId
 * @returns {Promise<{ exists: boolean, docId: string|null, docUrl: string|null }>}
 */
async function getReportClickUpStatus(reportId, userId) {
  const report = await reportService.getReport(reportId, userId);
  return {
    exists: !!report.clickup_doc_id,
    docId:  report.clickup_doc_id  || null,
    docUrl: report.clickup_doc_url || null,
  };
}

/**
 * Envia (ou atualiza) um relatorio semanal no ClickUp como Doc.
 *
 * - overwrite=false (default): cria um Doc novo
 * - overwrite=true: atualiza o Doc existente (se houver docId salvo)
 *
 * @param {number} reportId
 * @param {number} userId
 * @param {boolean} overwrite
 * @returns {Promise<{ docId: string, docUrl: string, docName: string, updated: boolean }>}
 */
async function sendReportToClickUp(reportId, userId, overwrite = false) {
  const { token, workspaceId } = await getClickUpConfig(userId);

  const report = await reportService.getReport(reportId, userId);
  const markdown = buildMarkdown(report);

  const docName = `Relatorio Semanal QA - Semana ${report.week_number}/${report.year} (${formatDate(report.start_date)} a ${formatDate(report.end_date)})`;

  let docId  = null;
  let docUrl = null;
  let updated = false;

  if (overwrite && report.clickup_doc_id) {
    // --- Atualiza Doc existente ---
    docId   = report.clickup_doc_id;
    docUrl  = report.clickup_doc_url;
    updated = true;

    await upsertDocPage(token, workspaceId, docId, docName, markdown);

  } else {
    // --- Cria novo Doc ---
    const docRes = await fetchClickUp(
      `${CLICKUP_V3}/workspaces/${workspaceId}/docs`,
      token,
      "POST",
      { name: docName, create_page: true }
    );

    docId  = docRes.id;
    docUrl = docRes.url || `https://app.clickup.com/${workspaceId}/docs/${docId}`;

    await upsertDocPage(token, workspaceId, docId, docName, markdown);
  }

  // Persiste o docId/docUrl no WeeklyReport para uso futuro
  const { WeeklyReport } = require("../models");
  await WeeklyReport.update(
    { clickup_doc_id: docId, clickup_doc_url: docUrl },
    { where: { id: reportId } }
  );

  return { docId, docUrl, docName, updated };
}

/**
 * Busca a primeira pagina do doc e atualiza (ou cria se nao houver).
 */
async function upsertDocPage(token, workspaceId, docId, docName, markdown) {
  const pagesRes = await fetchClickUp(
    `${CLICKUP_V3}/workspaces/${workspaceId}/docs/${docId}/pages`,
    token,
    "GET"
  );

  const pages  = pagesRes.pages || pagesRes || [];
  const pageId = Array.isArray(pages) && pages.length > 0 ? pages[0].id : null;

  if (pageId) {
    await fetchClickUp(
      `${CLICKUP_V3}/workspaces/${workspaceId}/docs/${docId}/pages/${pageId}`,
      token,
      "PUT",
      { name: docName, content: markdown, content_format: "text/md" }
    );
  } else {
    await fetchClickUp(
      `${CLICKUP_V3}/workspaces/${workspaceId}/docs/${docId}/pages`,
      token,
      "POST",
      { name: docName, content: markdown, content_format: "text/md" }
    );
  }
}

/**
 * Helper: faz chamadas autenticadas para a API do ClickUp.
 */
async function fetchClickUp(url, token, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  let text = "";
  try { text = await response.text(); } catch { text = ""; }

  if (!response.ok) {
    throw new AppError(`Erro na API do ClickUp (${response.status}): ${text}`, 502);
  }

  try { return JSON.parse(text); } catch { return {}; }
}

/**
 * Gera o Markdown do relatorio (inline, sem disco).
 */
function buildMarkdown(report) {
  const { tasks, user } = report;
  const lines = [];

  lines.push(`# Relatorio Semanal - Semana ${report.week_number}/${report.year}`);
  lines.push("");
  lines.push(`**Colaborador:** ${user.username}`);
  lines.push(`**Periodo:** ${formatDate(report.start_date)} a ${formatDate(report.end_date)}`);
  lines.push(`**Status:** ${report.status === "open" ? "Em andamento" : "Finalizado"}`);
  lines.push(`**Gerado em:** ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (tasks.length === 0) {
    lines.push("_Nenhuma atividade registrada nesta semana._");
    return lines.join("\n");
  }

  lines.push("## Atividades Realizadas");
  lines.push("");

  const tasksByDate = tasks.reduce((acc, task) => {
    const start = task.task_date;
    const end   = task.task_end_date || task.task_date;
    const dates = [];
    const cur   = new Date(start + "T00:00:00Z");
    const last  = new Date(end   + "T00:00:00Z");
    while (cur <= last) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    dates.forEach((date, idx) => {
      if (!acc[date]) acc[date] = [];
      acc[date].push({ task, isFirstDay: idx === 0 });
    });
    return acc;
  }, {});

  const sortedDates = Object.keys(tasksByDate).sort();

  for (const date of sortedDates) {
    lines.push(`### ${formatDatePtBR(date)}`);
    lines.push("");

    for (const { task, isFirstDay } of tasksByDate[date]) {
      const statusLabel = task.taskStatus?.name  || "-";
      const typeLabel   = task.activityType?.name || "-";
      const isMultiDay  = task.task_end_date && task.task_end_date !== task.task_date;
      const displayTitle =
        isFirstDay || !isMultiDay
          ? task.title
          : `Continuando ${task.activityType?.name || "atividade"} do: ${task.title}`;

      if (task.azure_ticket_id && isFirstDay) {
        lines.push(`- **[${typeLabel}]** ${displayTitle}`);
        lines.push(`  - Ticket Azure: \`${task.azure_ticket_id}\` *(${statusLabel})*`);
        if (task.description) lines.push(`  - ${task.description}`);
        if (task.notes)        lines.push(`  > ${task.notes}`);
        if (task.discord_link) lines.push(`  > Topico Discord: ${task.discord_link}`);
      } else {
        lines.push(`- **[${typeLabel}]** ${displayTitle} *(${statusLabel})*`);
        if (isFirstDay) {
          if (task.description)  lines.push(`  > ${task.description}`);
          if (task.discord_link) lines.push(`  - Topico Discord: ${task.discord_link}`);
          if (task.notes)        lines.push(`  - Observacoes: ${task.notes}`);
        }
      }
      lines.push("");
    }
  }

  const ticketTasks = tasks.filter((t) => t.azure_ticket_id);
  if (ticketTasks.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Tickets Testados");
    lines.push("");
    lines.push("| Ticket | Descricao | Data | Status |");
    lines.push("|--------|-----------|------|--------|");
    for (const task of ticketTasks) {
      const statusLabel = task.taskStatus?.name || "-";
      lines.push(`| \`${task.azure_ticket_id}\` | ${task.title} | ${task.task_date} | ${statusLabel} |`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Resumo");
  lines.push("");
  lines.push(`- **Total de atividades:** ${tasks.length}`);
  lines.push(`- **Tickets testados:** ${ticketTasks.length}`);
  lines.push(`- **Atividades concluidas:** ${tasks.filter((t) => t.taskStatus?.name?.toLowerCase().includes("conclu")).length}`);

  if (report.notes) {
    lines.push("");
    lines.push("## Observacoes Gerais");
    lines.push("");
    lines.push(report.notes);
  }

  lines.push("");
  lines.push("---");
  lines.push("_Relatorio gerado automaticamente pelo sistema Weekly Reports._");

  return lines.join("\n");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDatePtBR(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${Number(d)} de ${months[Number(m) - 1]} de ${y}`;
}

module.exports = { sendReportToClickUp, getClickUpConfig, getReportClickUpStatus };
