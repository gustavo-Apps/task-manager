/**
 * Controller: Tasks
 *
 * Extrai parâmetros da requisição e delega para taskService.
 * Todos os métodos são wrappers finos — sem regras de negócio.
 */

const taskService = require("../services/taskService");
const { success, created } = require("../utils/response");

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

module.exports = { create, list, getOne, update, remove };
