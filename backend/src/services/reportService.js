/**
 * Service: WeeklyReports
 *
 * Gerencia relatórios semanais: listagem, busca e geração de Markdown.
 */

const path = require("path");
const fs = require("fs");
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

    for (const date of sortedDates) {
      lines.push(`### ${formatDatePtBR(date)}`);
      lines.push("");

      for (const { task, isFirstDay } of tasksByDate[date]) {
        const statusLabel = task.taskStatus?.name || "—";
        const typeLabel = task.activityType?.name || "—";
        const isMultiDay = task.task_end_date && task.task_end_date !== task.task_date;

        // Primeiro dia: título normal. Dias seguintes: "Continuando..."
        const displayTitle = isFirstDay || !isMultiDay
          ? task.title
          : `Continuando ${task.activityType?.name || "atividade"} do: ${task.title}`;

        lines.push(`- **[${typeLabel}]** ${displayTitle} *(${statusLabel})*`);

        // Descrição e detalhes só no primeiro dia para não repetir
        if (isFirstDay) {
          if (task.description) {
            lines.push(`  > ${task.description}`);
          }
          if (task.azure_ticket_id) {
            lines.push(`  - Ticket Azure: \`${task.azure_ticket_id}\``);
          }
          if (task.discord_link) {
            lines.push(`  - Topico Discord: ${task.discord_link}`);
          }
          if (task.notes) {
            lines.push(`  - Observacoes: ${task.notes}`);
          }
        }

        lines.push("");
      }
    }

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

module.exports = { listReports, getReport, generateMarkdown, closeReport };
