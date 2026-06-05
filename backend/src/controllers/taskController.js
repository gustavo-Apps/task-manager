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
 * GET /api/tasks/tickets?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
 * Lista tickets testados (azure_ticket_id preenchido) no intervalo, com paginação.
 */
const listTickets = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) throw new AppError("from e to sao obrigatorios.", 400);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

  const result = await taskService.listTickets(req.user.id, from, to, { page, limit });

  return success(res, result);
});

/**
 * PATCH /api/tasks/:id/status
 * Toggle rápido de status — lê task_status_id do body e atualiza.
 */
const patchStatus = asyncHandler(async (req, res) => {
  const { task_status_id } = req.body;
  if (!task_status_id) throw new AppError("task_status_id e obrigatorio.", 400);

  const task = await taskService.updateTask(Number(req.params.id), req.user.id, { task_status_id });
  return success(res, { task });
});

/**
 * POST /api/tasks/:id/duplicate
 * Duplica a task, ajustando task_date para hoje e zerando task_end_date.
 */
const duplicate = asyncHandler(async (req, res) => {
  const task = await taskService.duplicateTask(Number(req.params.id), req.user.id);
  return created(res, { task });
});

module.exports = { create, list, getOne, update, remove, checkTicket, listTickets, patchStatus, duplicate };
