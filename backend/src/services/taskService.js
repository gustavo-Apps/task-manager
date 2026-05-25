/**
 * Service: Tasks
 *
 * Regras de negócio para criação e gerenciamento de tarefas.
 *
 * Responsabilidades principais:
 * 1. Calcular a semana ISO da task_date
 * 2. Criar o WeeklyReport automaticamente se não existir (findOrCreate)
 * 3. Aplicar título automático "Testado Hoje" quando azure_ticket_id é informado
 * 4. Garantir que o usuário só acessa suas próprias tarefas
 */

const { Task, WeeklyReport, ActivityType, TaskStatus, User } = require("../models");
const { getISOWeek, getWeekBounds } = require("../utils/isoWeek");
const AppError = require("../utils/AppError");

/**
 * Cria uma nova tarefa.
 * - Detecta a semana pelo campo task_date
 * - Cria WeeklyReport automaticamente se for a primeira tarefa da semana
 * - Aplica título automático se azure_ticket_id for informado
 *
 * @param {number} userId
 * @param {object} data Dados validados pelo DTO
 * @returns {Promise<Task>}
 */
async function createTask(userId, data) {
  // Valida se o tipo de atividade existe e está ativo
  const activityType = await ActivityType.findOne({
    where: { id: data.activity_type_id, is_active: true },
  });
  if (!activityType) {
    throw new AppError("Tipo de atividade inválido ou inativo.", 422);
  }

  // Valida se o status existe e está ativo
  const taskStatus = await TaskStatus.findOne({
    where: { id: data.task_status_id, is_active: true },
  });
  if (!taskStatus) {
    throw new AppError("Status de tarefa inválido ou inativo.", 422);
  }

  // Calcula a semana ISO com base na data informada
  const { weekNumber, year } = getISOWeek(data.task_date);
  const { startDate, endDate } = getWeekBounds(weekNumber, year);

  // Cria o relatório semanal ou retorna o existente (operação atômica)
  const [weeklyReport] = await WeeklyReport.findOrCreate({
    where: { user_id: userId, week_number: weekNumber, year },
    defaults: {
      user_id: userId,
      week_number: weekNumber,
      year,
      start_date: startDate,
      end_date: endDate,
      status: "open",
    },
  });

  // Regra automática: se tem ticket Azure, título é "Testado Hoje"
  let title = data.title;
  if (data.azure_ticket_id && !title) {
    title = "Testado Hoje";
  }
  if (!title) {
    throw new AppError("O campo title é obrigatório quando azure_ticket_id não é informado.", 400);
  }

  const task = await Task.create({
    weekly_report_id: weeklyReport.id,
    user_id: userId,
    activity_type_id: data.activity_type_id,
    title,
    description: data.description || null,
    task_date: data.task_date,
    task_status_id: data.task_status_id,
    discord_link: data.discord_link || null,
    azure_ticket_id: data.azure_ticket_id || null,
    notes: data.notes || null,
  });

  // Retorna a task com as associações para a resposta ser completa
  return Task.findByPk(task.id, {
    include: [
      { model: ActivityType, as: "activityType" },
      { model: TaskStatus, as: "taskStatus" },
      { model: WeeklyReport, as: "weeklyReport" },
    ],
  });
}

/**
 * Lista as tarefas do usuário com filtros opcionais.
 *
 * @param {number} userId
 * @param {{ weeklyReportId?, status?, task_date? }} filters
 * @returns {Promise<Task[]>}
 */
async function listTasks(userId, filters = {}) {
  const where = { user_id: userId };

  if (filters.weekly_report_id) where.weekly_report_id = filters.weekly_report_id;
  if (filters.task_status_id) where.task_status_id = filters.task_status_id;
  if (filters.activity_type_id) where.activity_type_id = filters.activity_type_id;

  return Task.findAll({
    where,
    include: [
      { model: ActivityType, as: "activityType" },
      { model: TaskStatus, as: "taskStatus" },
    ],
    order: [["task_date", "DESC"]],
  });
}

/**
 * Busca uma tarefa por ID (garantindo que pertence ao usuário).
 *
 * @param {number} taskId
 * @param {number} userId
 * @returns {Promise<Task>}
 */
async function getTask(taskId, userId) {
  const task = await Task.findOne({
    where: { id: taskId, user_id: userId },
    include: [
      { model: ActivityType, as: "activityType" },
      { model: TaskStatus, as: "taskStatus" },
      { model: WeeklyReport, as: "weeklyReport" },
    ],
  });

  if (!task) throw new AppError("Tarefa não encontrada.", 404);
  return task;
}

/**
 * Atualiza uma tarefa existente.
 *
 * @param {number} taskId
 * @param {number} userId
 * @param {object} data Campos a atualizar
 * @returns {Promise<Task>}
 */
async function updateTask(taskId, userId, data) {
  const task = await getTask(taskId, userId);

  // Se o azure_ticket_id foi atualizado e não há título, mantém "Testado Hoje"
  if (data.azure_ticket_id && !data.title && task.title === "Testado Hoje") {
    delete data.title; // não sobrescreve
  }

  await task.update(data);
  return getTask(taskId, userId);
}

/**
 * Remove uma tarefa.
 *
 * @param {number} taskId
 * @param {number} userId
 */
async function deleteTask(taskId, userId) {
  const task = await getTask(taskId, userId);
  await task.destroy();
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
