/**
 * Scheduler: fecha automaticamente relatórios da semana anterior toda segunda-feira às 00:05.
 */
const cron = require("node-cron");
const { WeeklyReport } = require("./models");
const { getISOWeek } = require("./utils/isoWeek");

function startScheduler() {
  // Toda segunda-feira às 00:05
  cron.schedule("5 0 * * 1", async () => {
    console.log("[scheduler] Fechando relatórios da semana anterior...");
    try {
      const today = new Date();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - 7);
      const { weekNumber, year } = getISOWeek(lastMonday.toISOString().slice(0, 10));

      const [count] = await WeeklyReport.update(
        { status: "closed" },
        { where: { week_number: weekNumber, year, status: "open" } }
      );
      console.log(`[scheduler] ${count} relatorio(s) fechado(s) — semana ${weekNumber}/${year}`);
    } catch (err) {
      console.error("[scheduler] Erro ao fechar relatorios:", err.message);
    }
  });

  console.log("[scheduler] Scheduler iniciado — relatórios fecham toda segunda às 00:05.");
}

module.exports = { startScheduler };
