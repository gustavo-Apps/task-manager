/**
 * Controller: Manager
 *
 * Endpoints do painel gestor. Todos requerem role manager ou admin.
 */

const managerService = require("../services/managerService");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /manager/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const data = await managerService.getDashboard(req.user.id, req.user.role);
  return success(res, data);
});

// GET /manager/employees
const getEmployees = asyncHandler(async (req, res) => {
  const data = await managerService.getEmployees(req.user.id, req.user.role);
  return success(res, { employees: data });
});

// GET /manager/employees/:id
const getEmployee = asyncHandler(async (req, res) => {
  const data = await managerService.getEmployee(req.user.id, req.params.id, req.user.role);
  return success(res, data);
});

// GET /manager/activities
const getActivities = asyncHandler(async (req, res) => {
  const { date_from, date_to, employee_id, activity_type_id, task_status_id, azure_ticket_id } = req.query;
  const data = await managerService.getActivities(req.user.id, req.user.role, {
    date_from, date_to, employee_id, activity_type_id, task_status_id, azure_ticket_id,
  });
  return success(res, { activities: data });
});

// GET /manager/statistics
const getStatistics = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  const data = await managerService.getStatistics(req.user.id, req.user.role, { date_from, date_to });
  return success(res, data);
});

// GET /manager/export/md
const exportMd = asyncHandler(async (req, res) => {
  const { employee_id, date_from, date_to } = req.query;
  const md = await managerService.exportMd(req.user.id, req.user.role, { employee_id, date_from, date_to });
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="relatorio-equipe.md"`);
  return res.send(md);
});

// GET /manager/export/pdf — stub que retorna markdown com header para download
const exportPdf = asyncHandler(async (req, res) => {
  const { employee_id, date_from, date_to } = req.query;
  const md = await managerService.exportMd(req.user.id, req.user.role, { employee_id, date_from, date_to });
  // Stub: retorna markdown como PDF placeholder
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="relatorio-equipe.md"`);
  return res.send(md);
});

module.exports = { getDashboard, getEmployees, getEmployee, getActivities, getStatistics, exportMd, exportPdf };
