/**
 * Controller: Tasks
 *
 * Extrai parâmetros da requisição e delega para taskService.
 * Todos os métodos são wrappers finos — sem regras de negócio.
 */

const taskService = require("../services/taskService");
const { success, created } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  return created(res, { task });
});

const list = asyncHandler(async (req, res) => {
  // Filtros opcionais via query string: ?status=done&activity_type_id=2
  const filters = {
    weekly_report_id: req.query.weekly_report_id,
    task_status_id: req.query.task_status_id,
    activity_type_id: req.query.activity_type_id,
    date_from: req.query.date_from,
    date_to:   req.query.date_to,
  };
  const tasks = await taskService.listTasks(req.user.id, filters);
  return success(res, { tasks });
});

const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(Number(req.params.id), req.user.id);
  return success(res, { task });
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(Number(req.params.id), req.user.id, req.body);
  return success(res, { task });
});

const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(Number(req.params.id), req.user.id);
  return success(res, { message: "Tarefa removida com sucesso." });
});

/**
 * GET /api/tasks/check-ticket?azure_ticket_id=X
 * Retorna a task pendente existente com esse ticket, ou null.
 */
const checkTicket = asyncHandler(async (req, res) => {
  const { azure_ticket_id } = req.query;
  if (!azure_ticket_id) throw new AppError("azure_ticket_id e obrigatorio.", 400);

  const existing = await taskService.checkTicketPending(req.user.id, azure_ticket_id);
  return success(res, { existing: existing || null });
});

/**
 * GET /api/tasks/tickets?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Lista tickets testados (azure_ticket_id preenchido) no intervalo.
 */
const listTickets = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) throw new AppError("from e to sao obrigatorios.", 400);

  const tickets = await taskService.listTickets(req.user.id, from, to);
  
  return success(res, { tickets });
});

module.exports = { create, list, getOne, update, remove, checkTicket, listTickets };
