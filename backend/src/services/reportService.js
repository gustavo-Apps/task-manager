/**
 * Service: WeeklyReports
 *
 * Gerencia relatórios semanais: listagem, busca e geração de Markdown.
 */

const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const { WeeklyReport, Task, ActivityType, TaskStatus, User } = require("../models");
const { formatDatePtBR } = require("../utils/isoWeek");
const AppError = require("../utils/AppError");

/**
 * Lista todos os relatórios semanais de um usuário, do mais recente para o mais antigo.
 *
 * @param {number} userId
 * @returns {Promise<WeeklyReport[]>}
 */
async function listReports(userId) {
  return WeeklyReport.findAll({
    where: { user_id: userId },
    order: [
      ["year", "DESC"],
      ["week_number", "DESC"],
    ],
    include: [
      {
        model: Task,
        as: "tasks",
        // Só conta as tarefas, não carrega tudo (evita payload gigante na listagem)
        attributes: ["id"],
      },
    ],
  });
}

/**
 * Busca um relatório com todas as tarefas (para visualização detalhada).
 *
 * @param {number} reportId
 * @param {number} userId
 * @returns {Promise<WeeklyReport>}
 */
async function getReport(reportId, userId) {
  const report = await WeeklyReport.findOne({
    where: { id: reportId, user_id: userId },
    include: [
      {
        model: Task,
        as: "tasks",
        include: [{ model: ActivityType, as: "activityType" }, { model: TaskStatus, as: "taskStatus" }],
        order: [["task_date", "ASC"]],
      },
      { model: User, as: "user", attributes: ["id", "username", "email"] },
    ],
  });

  if (!report) throw new AppError("Relatório não encontrado.", 404);
  return report;
}

/**
 * @param {Object} tasksByDate  Mapa { 'YYYY-MM-DD': [{ task, isFirstDay }] }
 * @param {string[]} sortedDates Datas ordenadas
 * @returns {string[]}
 */
function buildDateSections(tasksByDate, sortedDates) {
  const lines = [];

  for (const date of sortedDates) {
    lines.push(`### ${formatDatePtBR(date)}`);
    lines.push("");

    const entries = tasksByDate[date];

    // ── Sem ticket: formato padrão ──────────────────────────────────────────────
    const withoutTicket = entries.filter(({ task }) => !task.azure_ticket_id);
    for (const { task, isFirstDay } of withoutTicket) {
      const statusLabel = task.taskStatus?.name  || "—";
      const typeLabel   = task.activityType?.name || "—";
      const isMultiDay  = task.task_end_date && task.task_end_date !== task.task_date;

      const displayTitle = isFirstDay || !isMultiDay
        ? task.title
        : `Continuando ${task.activityType?.name || "atividade"} do: ${task.title}`;

      lines.push(`- **[${typeLabel}]** ${displayTitle} *(${statusLabel})*`);

      if (isFirstDay) {
        if (task.description)  lines.push(`  > ${task.description}`);
        if (task.discord_link) lines.push(`  - Topico Discord: ${task.discord_link}`);
        if (task.notes)        lines.push(`  - Observacoes: ${task.notes}`);
      }

      lines.push("");
    }

    // ── Com ticket: agrupa por tipo + título ───────────────────────────────────
    // Apenas isFirstDay para não repetir em tasks multi-dia
    const ticketEntries = entries.filter(({ task, isFirstDay }) => task.azure_ticket_id && isFirstDay);

    // Agrupa: { 'Tipo||Titulo' => { typeLabel, title, tasks[] } }
    const groups = new Map();
    for (const { task } of ticketEntries) {
      const typeLabel = task.activityType?.name || "—";
      const key = `${typeLabel}||${task.title}`;
      if (!groups.has(key)) groups.set(key, { typeLabel, title: task.title, tasks: [] });
      groups.get(key).tasks.push(task);
    }

    for (const { typeLabel, title, tasks: groupTasks } of groups.values()) {
      // Linha de cabeçalho do grupo — apenas tipo e título
      lines.push(`- **[${typeLabel}]** ${title}`);

      for (const task of groupTasks) {
        const statusLabel = task.taskStatus?.name || "—";
        const descSuffix  = task.description ? ` — ${task.description}` : "";
        lines.push(`- Ticket Azure: \`${task.azure_ticket_id}\` - *(${statusLabel})*${descSuffix}`);
        if (task.notes)        lines.push(`  > ${task.notes}`);
        if (task.discord_link) lines.push(`  > Topico Discord: ${task.discord_link}`);
      }

      lines.push("");
    }
  }

  return lines;
}

/**
 * Gera o arquivo Markdown de um relatório semanal e retorna o caminho do arquivo.
 *
 * Estrutura do Markdown gerado:
 * - Cabeçalho com semana, usuário e período
 * - Atividades agrupadas por data
 * - Seção separada para tickets testados (azure_ticket_id)
 * - Resumo quantitativo ao final
 *
 * @param {number} reportId
 * @param {number} userId
 * @returns {Promise<string>} Caminho absoluto do arquivo .md gerado
 */
async function generateMarkdown(reportId, userId) {
  const report = await getReport(reportId, userId);
  const { tasks, user } = report;

  const lines = [];

  // ─── Cabeçalho ─────────────────────────────────────────────────────────────
  lines.push(`# Relatório Semanal — Semana ${report.week_number}/${report.year}`);
  lines.push("");
  lines.push(`**Colaborador:** ${user.username}`);
  lines.push(`**Período:** ${formatDatePtBR(report.start_date)} a ${formatDatePtBR(report.end_date)}`);
  lines.push(`**Status:** ${report.status === "open" ? "Em andamento" : "Finalizado"}`);
  lines.push(`**Gerado em:** ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (tasks.length === 0) {
    lines.push("_Nenhuma atividade registrada nesta semana._");
  } else {
    // ─── Atividades agrupadas por data ────────────────────────────────────────
    lines.push("## Atividades Realizadas");
    lines.push("");

    // Agrupa tasks por data — tasks com task_end_date aparecem em cada dia do intervalo
    const tasksByDate = tasks.reduce((acc, task) => {
      const start = task.task_date;
      const end   = task.task_end_date || task.task_date;

      // Gera todas as datas entre start e end (inclusive)
      const dates = [];
      const cur = new Date(start + "T00:00:00Z");
      const last = new Date(end   + "T00:00:00Z");
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

    // Ordena as datas
    const sortedDates = Object.keys(tasksByDate).sort();

    lines.push(...buildDateSections(tasksByDate, sortedDates));

    // ─── Seção de Tickets Testados ────────────────────────────────────────────
    const ticketTasks = tasks.filter((t) => t.azure_ticket_id);

    if (ticketTasks.length > 0) {
      lines.push("---");
      lines.push("");
      lines.push("## Tickets Testados");
      lines.push("");
      lines.push("| Ticket | Descricao | Data | Status |");
      lines.push("|--------|-----------|------|--------|");

      for (const task of ticketTasks) {
        const statusLabel = task.taskStatus?.name || "—";
        lines.push(`| \`${task.azure_ticket_id}\` | ${task.title} | ${task.task_date} | ${statusLabel} |`);
      }

      lines.push("");
    }

    // ─── Resumo ───────────────────────────────────────────────────────────────
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
  }

  lines.push("");
  lines.push("---");
  lines.push("_Relatorio gerado automaticamente pelo sistema Weekly Reports._");

  // ─── Salva o arquivo ──────────────────────────────────────────────────────
  const reportsDir = path.resolve(
    __dirname,
    "../../",
    process.env.REPORTS_DIR || "reports/generated"
  );

  // Cria a pasta se não existir
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `relatorio-semana${report.week_number}-${report.year}-${user.username}.md`;
  const filePath = path.join(reportsDir, filename);

  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");

  return filePath;
}

/**
 * Fecha um relatório semanal (status: closed).
 * Um relatório fechado pode ainda ser visualizado, mas não receberá novas tarefas.
 *
 * @param {number} reportId
 * @param {number} userId
 * @returns {Promise<WeeklyReport>}
 */
async function closeReport(reportId, userId) {
  const report = await getReport(reportId, userId);

  if (report.status === "closed") {
    throw new AppError("Este relatório já está fechado.", 409);
  }

  await report.update({ status: "closed" });
  return report;
}

/**
 * Gera um arquivo Markdown para um período customizado (data inicio → data fim).
 *
 * Busca tarefas diretamente por task_date no intervalo, sem depender de WeeklyReport.
 *
 * @param {number} userId
 * @param {string} dataInicio  Formato YYYY-MM-DD
 * @param {string} dataFim     Formato YYYY-MM-DD
 * @returns {Promise<string>} Caminho absoluto do arquivo .md gerado
 */
async function generateMarkdownForPeriod(userId, dataInicio, dataFim) {
  if (!dataInicio || !dataFim) {
    throw new AppError("Parâmetros dataInicio e dataFim são obrigatórios.", 400);
  }

  if (dataInicio > dataFim) {
    throw new AppError("dataInicio não pode ser posterior a dataFim.", 400);
  }

  const user = await User.findByPk(userId, { attributes: ["id", "username", "email"] });
  if (!user) throw new AppError("Usuário não encontrado.", 404);

  const tasks = await Task.findAll({
    where: {
      user_id: userId,
      task_date: { [Op.between]: [dataInicio, dataFim] },
    },
    include: [
      { model: ActivityType, as: "activityType" },
      { model: TaskStatus,   as: "taskStatus"   },
    ],
    order: [["task_date", "ASC"]],
  });

  const lines = [];

  // ─── Cabeçalho ─────────────────────────────────────────────────────────────
  lines.push(`# Relatório por Período`);
  lines.push("");
  lines.push(`**Colaborador:** ${user.username}`);
  lines.push(`**Período:** ${formatDatePtBR(dataInicio)} a ${formatDatePtBR(dataFim)}`);
  lines.push(`**Gerado em:** ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (tasks.length === 0) {
    lines.push("_Nenhuma atividade registrada neste período._");
  } else {
    // ─── Atividades agrupadas por data ────────────────────────────────────────
    lines.push("## Atividades Realizadas");
    lines.push("");

    const tasksByDate = tasks.reduce((acc, task) => {
      const start = task.task_date;
      const end   = task.task_end_date || task.task_date;

      const dates = [];
      const cur  = new Date(start + "T00:00:00Z");
      const last = new Date(end   + "T00:00:00Z");
      // Limita ao dataFim para não vazar fora do período solicitado
      const fence = new Date(dataFim + "T00:00:00Z");
      while (cur <= last && cur <= fence) {
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

    lines.push(...buildDateSections(tasksByDate, sortedDates));

    // ─── Tickets testados ─────────────────────────────────────────────────────
    const ticketTasks = tasks.filter((t) => t.azure_ticket_id);

    if (ticketTasks.length > 0) {
      lines.push("---");
      lines.push("");
      lines.push("## Tickets Testados");
      lines.push("");
      lines.push("| Ticket | Descricao | Data | Status |");
      lines.push("|--------|-----------|------|--------|");

      for (const task of ticketTasks) {
        const statusLabel = task.taskStatus?.name || "—";
        lines.push(`| \`${task.azure_ticket_id}\` | ${task.title} | ${task.task_date} | ${statusLabel} |`);
      }

      lines.push("");
    }

    // ─── Resumo ───────────────────────────────────────────────────────────────
    lines.push("---");
    lines.push("");
    lines.push("## Resumo");
    lines.push("");
    lines.push(`- **Total de atividades:** ${tasks.length}`);
    lines.push(`- **Tickets testados:** ${ticketTasks.length}`);
    lines.push(`- **Atividades concluidas:** ${tasks.filter((t) => t.taskStatus?.name?.toLowerCase().includes("conclu")).length}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("_Relatorio gerado automaticamente pelo sistema Weekly Reports._");

  // ─── Salva o arquivo ──────────────────────────────────────────────────────
  const reportsDir = path.resolve(
    __dirname,
    "../../",
    process.env.REPORTS_DIR || "reports/generated"
  );

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `relatorio-periodo-${dataInicio}-${dataFim}-${user.username}.md`;
  const filePath = path.join(reportsDir, filename);

  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");

  return filePath;
}

module.exports = { listReports, getReport, generateMarkdown, generateMarkdownForPeriod, closeReport };
