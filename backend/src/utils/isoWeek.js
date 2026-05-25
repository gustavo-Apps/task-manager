/**
 * Utilitário: semanas ISO 8601
 *
 * Semanas ISO começam sempre na segunda-feira.
 * A semana 1 é a primeira semana que contém uma quinta-feira do ano.
 *
 * Todas as funções de data da aplicação passam por aqui,
 * garantindo consistência no cálculo de semanas.
 */

/**
 * Retorna o número da semana ISO e o ano ISO para uma data.
 * O "ano ISO" pode diferir do ano calendário em semanas de transição
 * (ex: 30/12/2024 pode ser semana 1 do ano ISO 2025).
 *
 * @param {Date|string} date
 * @returns {{ weekNumber: number, year: number }}
 */
function getISOWeek(date) {
  const d = new Date(date);

  // Garante que estamos trabalhando com a data correta (meio-dia UTC)
  d.setUTCHours(12, 0, 0, 0);

  // Dia da semana: 0=Dom, 1=Seg, ..., 6=Sáb
  const day = d.getUTCDay();

  // Ajusta para que segunda=0, ..., domingo=6
  const mondayOffset = (day + 6) % 7;

  // Encontra a quinta-feira da mesma semana
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() - mondayOffset + 3);

  const year = thursday.getUTCFullYear();

  // Primeiro dia do ano da quinta-feira
  const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
  firstDayOfYear.setUTCHours(12, 0, 0, 0);

  // Diferença em dias entre a quinta e o primeiro dia do ano
  const diffDays = Math.round((thursday - firstDayOfYear) / 86400000);

  const weekNumber = Math.floor(diffDays / 7) + 1;

  return { weekNumber, year };
}

/**
 * Retorna a data da segunda-feira de uma semana ISO.
 *
 * @param {number} weekNumber
 * @param {number} year
 * @returns {Date}
 */
function getMondayOfISOWeek(weekNumber, year) {
  // 4 de janeiro é sempre na semana 1 do ano ISO
  const jan4 = new Date(Date.UTC(year, 0, 4, 12, 0, 0));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // segunda=0

  // Calcula a segunda-feira da semana desejada
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + (weekNumber - 1) * 7);

  return monday;
}

/**
 * Retorna start_date (segunda) e end_date (domingo) de uma semana ISO.
 *
 * @param {number} weekNumber
 * @param {number} year
 * @returns {{ startDate: string, endDate: string }} Formato YYYY-MM-DD
 */
function getWeekBounds(weekNumber, year) {
  const monday = getMondayOfISOWeek(weekNumber, year);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
}

/**
 * Formata uma data YYYY-MM-DD para exibição: "Segunda-feira, 20 de maio de 2026"
 *
 * @param {string} dateString Formato YYYY-MM-DD
 * @returns {string}
 */
function formatDatePtBR(dateString) {
  const date = new Date(dateString + "T12:00:00Z");
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

module.exports = { getISOWeek, getWeekBounds, formatDatePtBR };
