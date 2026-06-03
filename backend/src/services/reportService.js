/**
 * Service: WeeklyReports
 *
 * Gerencia relatórios semanais: listagem, busca e geração de Markdown.
 */

const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const { WeeklyReport, Task, ActivityType, TaskStatus, User } = require("../models");
const { getISOWeek, getWeekBounds, formatDatePtBR } = require("../utils/isoWeek");
const AppError = require("../utils/AppError");
const settingsService = require("./settingsService");

/**
 * Interpola variaveis {{variavel}} nos campos de preferencia do .md.
 * Substitui pelos valores reais do contexto do relatorio.
 */
function interpolate(text, ctx) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    ctx[key] !== undefined ? ctx[key] : `{{${key}}}`
  );
}

/**
 * Carrega as preferencias de .md do usuario como objeto.
 * Valores vazios caem no fallback padrao.
 */
async function getMdPrefs(userId) {
  const keys = ["md_verb", "md_report_title", "md_activity_section_title", "md_ticket_section_title", "md_footer", "md_header_extra"];
  const result = {};
  for (const key of keys) {
    result[key] = (await settingsService.getValue(userId, key)) || null;
  }
  return {
    verb:            result.md_verb                  || "Realizado",
    reportTitle:     result.md_report_title           || "Relatório Semanal",
    activitySection: result.md_activity_section_title || "Atividades Realizadas",
    ticketSection:   result.md_ticket_section_title   || "Tickets Trabalhados",
    footer:          result.md_footer                 || "",
    headerExtra:     result.md_header_extra           || "",
  };
}

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
function buildDateSections(tasksByDate, sortedDates, verb = "Realizado") {
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
  const rawPrefs = await getMdPrefs(userId);
  const ticketTasks = tasks.filter((t) => t.azure_ticket_id);

  // Contexto de variaveis disponivel para interpolacao nos campos de prefs
  const ctx = {
    username:      user.username,
    cargo:         user.cargo?.toString() || "",
    week_number:   report.week_number.toString(),
    year:          report.year.toString(),
    period_start:  formatDatePtBR(report.start_date),
    period_end:    formatDatePtBR(report.end_date),
    total_tasks:   tasks.length.toString(),
    total_tickets: ticketTasks.length.toString(),
    generated_at:  new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  };

  // Interpola variaveis em todos os campos de prefs
  const prefs = {
    reportTitle:     interpolate(rawPrefs.reportTitle,     ctx),
    verb:            interpolate(rawPrefs.verb,            ctx),
    activitySection: interpolate(rawPrefs.activitySection, ctx),
    ticketSection:   interpolate(rawPrefs.ticketSection,   ctx),
    footer:          interpolate(rawPrefs.footer,          ctx),
    headerExtra:     interpolate(rawPrefs.headerExtra,     ctx),
  };

  const lines = [];

  lines.push(`# ${prefs.reportTitle} — Semana ${report.week_number}/${report.year}`);
  lines.push("");
  lines.push(`**Colaborador:** ${user.username}  `);
  lines.push(`**Período:** ${formatDatePtBR(report.start_date)} a ${formatDatePtBR(report.end_date)}  `);
  lines.push(`**Status:** ${report.status === "open" ? "Em andamento" : "Finalizado"}  `);
  lines.push(`**Gerado em:** ${ctx.generated_at}  `);
  if (prefs.headerExtra) { lines.push(""); prefs.headerExtra.split(/\r?\n/).forEach((l) => lines.push(l + "  ")); }
  lines.push("");
  lines.push("---");
  lines.push("");

  if (tasks.length === 0) {
    lines.push("_Nenhuma atividade registrada nesta semana._");
  } else {
    lines.push(`## ${prefs.activitySection}`);
    lines.push("");

    const tasksByDate = tasks.reduce((acc, task) => {
      const start = task.task_date;
      const end   = task.task_end_date || task.task_date;
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

    const sortedDates = Object.keys(tasksByDate).sort();
    lines.push(...buildDateSections(tasksByDate, sortedDates, prefs.verb));

    if (ticketTasks.length > 0) {
      lines.push("---");
      lines.push("");
      lines.push(`## ${prefs.ticketSection}`);
      lines.push("");
      lines.push("| Ticket | Descricao | Data | Status |");
      lines.push("|--------|-----------|------|--------|");
      for (const task of ticketTasks) {
        const statusLabel = task.taskStatus?.name || "—";
        lines.push(`| \`${task.azure_ticket_id}\` | ${task.title} | ${task.task_date} | ${statusLabel} |`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
    lines.push("## Resumo");
    lines.push("");
    lines.push(`- **Total de atividades:** ${tasks.length}`);
    lines.push(`- **${prefs.ticketSection}:** ${ticketTasks.length}`);
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
  lines.push(prefs.footer || "_Relatorio gerado automaticamente pelo sistema Weekly Reports._");

  const reportsDir = path.resolve(__dirname, "../../", process.env.REPORTS_DIR || "reports/generated");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const filename = `relatorio-semana${report.week_number}-${report.year}-${user.username}.md`;
  const filePath = path.join(reportsDir, filename);
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

async function closeReport(reportId, userId) {
  const report = await getReport(reportId, userId);
  if (report.status === "closed") throw new AppError("Este relatório já está fechado.", 409);
  await report.update({ status: "closed" });
  return report;
}

async function generateMarkdownForPeriod(userId, dataInicio, dataFim) {
  if (!dataInicio || !dataFim) throw new AppError("Parâmetros dataInicio e dataFim são obrigatórios.", 400);
  if (dataInicio > dataFim) throw new AppError("dataInicio não pode ser posterior a dataFim.", 400);

  const user = await User.findByPk(userId, { attributes: ["id", "username", "email"] });
  if (!user) throw new AppError("Usuário não encontrado.", 404);

  const tasks = await Task.findAll({
    where: { user_id: userId, task_date: { [Op.between]: [dataInicio, dataFim] } },
    include: [
      { model: ActivityType, as: "activityType" },
      { model: TaskStatus,   as: "taskStatus"   },
    ],
    order: [["task_date", "ASC"]],
  });

  const rawPrefs = await getMdPrefs(userId);
  const ticketTasks = tasks.filter((t) => t.azure_ticket_id);

  const ctx = {
    username:      user.username,
    cargo:         user.cargo?.toString() || "",
    period_start:  formatDatePtBR(dataInicio),
    period_end:    formatDatePtBR(dataFim),
    total_tasks:   tasks.length.toString(),
    total_tickets: ticketTasks.length.toString(),
    generated_at:  new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    week_number:   "",
    year:          "",
  };

  const prefs = {
    reportTitle:     interpolate(rawPrefs.reportTitle,     ctx),
    verb:            interpolate(rawPrefs.verb,            ctx),
    activitySection: interpolate(rawPrefs.activitySection, ctx),
    ticketSection:   interpolate(rawPrefs.ticketSection,   ctx),
    footer:          interpolate(rawPrefs.footer,          ctx),
    headerExtra:     interpolate(rawPrefs.headerExtra,     ctx),
  };

  const lines = [];

  lines.push(`# ${prefs.reportTitle} — Período`);
  lines.push("");
  lines.push(`**Colaborador:** ${user.username}  `);
  lines.push(`**Período:** ${formatDatePtBR(dataInicio)} a ${formatDatePtBR(dataFim)}  `);
  lines.push(`**Gerado em:** ${ctx.generated_at}  `);
  if (prefs.headerExtra) { lines.push(""); prefs.headerExtra.split(/\r?\n/).forEach((l) => lines.push(l + "  ")); }
  lines.push("");
  lines.push("---");
  lines.push("");

  if (tasks.length === 0) {
    lines.push("_Nenhuma atividade registrada neste período._");
  } else {
    lines.push(`## ${prefs.activitySection}`);
    lines.push("");

    const tasksByDate = tasks.reduce((acc, task) => {
      const start = task.task_date;
      const end   = task.task_end_date || task.task_date;
      const dates = [];
      const cur  = new Date(start + "T00:00:00Z");
      const last = new Date(end   + "T00:00:00Z");
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
    lines.push(...buildDateSections(tasksByDate, sortedDates, prefs.verb));

    if (ticketTasks.length > 0) {
      lines.push("---");
      lines.push("");
      lines.push(`## ${prefs.ticketSection}`);
      lines.push("");
      lines.push("| Ticket | Descricao | Data | Status |");
      lines.push("|--------|-----------|------|--------|");
      for (const task of ticketTasks) {
        const statusLabel = task.taskStatus?.name || "—";
        lines.push(`| \`${task.azure_ticket_id}\` | ${task.title} | ${task.task_date} | ${statusLabel} |`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
    lines.push("## Resumo");
    lines.push("");
    lines.push(`- **Total de atividades:** ${tasks.length}`);
    lines.push(`- **${prefs.ticketSection}:** ${ticketTasks.length}`);
    lines.push(`- **Atividades concluidas:** ${tasks.filter((t) => t.taskStatus?.name?.toLowerCase().includes("conclu")).length}`);
  }

  lines.push("");
  lines.push("---");
  lines.push(prefs.footer || "_Relatorio gerado automaticamente pelo sistema Weekly Reports._");

  const reportsDir = path.resolve(__dirname, "../../", process.env.REPORTS_DIR || "reports/generated");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const filename = `relatorio-periodo-${dataInicio}-${dataFim}-${user.username}.md`;
  const filePath = path.join(reportsDir, filename);
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

async function getCurrentReport(userId) {
  const { weekNumber, year } = getISOWeek(new Date());
  const { startDate, endDate } = getWeekBounds(weekNumber, year);
  const [report, created] = await WeeklyReport.findOrCreate({
    where: { user_id: userId, week_number: weekNumber, year },
    defaults: { user_id: userId, week_number: weekNumber, year, start_date: startDate, end_date: endDate, status: "open" },
  });
  const full = await getReport(report.id, userId);
  return { report: full, created };
}

async function getReportForDate(userId, date) {
  const targetDate = new Date(date + "T12:00:00Z");
  const { weekNumber, year } = getISOWeek(targetDate);
  const { weekNumber: currentWeek, year: currentYear } = getISOWeek(new Date());
  const isCurrentWeek = weekNumber === currentWeek && year === currentYear;
  if (isCurrentWeek) return getCurrentReport(userId);
  const report = await WeeklyReport.findOne({ where: { user_id: userId, week_number: weekNumber, year } });
  if (!report) return { report: null, created: false };
  const full = await getReport(report.id, userId);
  return { report: full, created: false };
}

module.exports = { listReports, getReport, getCurrentReport, getReportForDate, generateMarkdown, generateMarkdownForPeriod, closeReport };