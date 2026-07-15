/**
 * Service: Manager
 *
 * Logica de negocio para o painel gestor.
 * Todas as queries verificam se o employeeId pertence ao manager antes de retornar dados.
 */

const { Op, fn, col, literal } = require("sequelize");
const { User, Task, ActivityType, TaskStatus, UserCargos, UserManager } = require("../models");
const { getISOWeek, getWeekBounds } = require("../utils/isoWeek");

// Retorna array de IDs dos colaboradores do manager.
// Se admin sem vinculos, retorna todos os IDs de users ativos.
async function getEmployeeIds(managerId, role) {
  const links = await UserManager.findAll({
    where: { manager_id: managerId },
    attributes: ["employee_id"],
  });

  if (links.length === 0 && role === "admin") {
    const all = await User.findAll({ where: { is_active: true }, attributes: ["id"] });
    return all.map((u) => u.id);
  }

  return links.map((l) => l.employee_id);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentWeekBounds() {
  const now = new Date();
  const { weekNumber, year } = getISOWeek(now);
  return getWeekBounds(weekNumber, year);
}

// Calcula o status do colaborador baseado nas suas tasks.
function calcStatus(tasks) {
  const today = todayStr();
  const { startDate } = currentWeekBounds();

  const hasToday = tasks.some((t) => t.task_date === today);
  if (hasToday) return "working";

  const hasThisWeek = tasks.some((t) => t.task_date >= startDate && t.task_date <= today);
  if (hasThisWeek) return "no_update_today";

  return "no_activity_week";
}

async function getDashboard(managerId, role) {
  const employeeIds = await getEmployeeIds(managerId, role);
  if (employeeIds.length === 0) {
    return {
      totalEmployees: 0,
      activitiesToday: 0,
      activitiesWeek: 0,
      ticketsWeek: 0,
      withoutUpdateToday: 0,
      withPendencies: 0,
      employees: [],
    };
  }

  const today = todayStr();
  const { startDate, endDate } = currentWeekBounds();

  // Busca todos os employees com suas tasks desta semana
  const employees = await User.findAll({
    where: { id: { [Op.in]: employeeIds } },
    attributes: ["id", "username", "email", "cargo"],
    include: [
      { model: UserCargos, as: "userCargo", attributes: ["id", "name"] },
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "task_date", "azure_ticket_id"],
        where: { task_date: { [Op.between]: [startDate, endDate] } },
        required: false,
      },
    ],
  });

  let activitiesToday = 0;
  let activitiesWeek = 0;
  let ticketsWeek = 0;
  let withoutUpdateToday = 0;
  let withPendencies = 0;

  const employeeList = employees.map((emp) => {
    const tasks = emp.tasks || [];
    const todayTasks = tasks.filter((t) => t.task_date === today);
    const weekTickets = tasks.filter((t) => t.azure_ticket_id != null);
    const lastTask = tasks.sort((a, b) => b.task_date.localeCompare(a.task_date))[0];
    const status = calcStatus(tasks);

    activitiesToday += todayTasks.length;
    activitiesWeek += tasks.length;
    ticketsWeek += weekTickets.length;
    if (status === "no_update_today") withoutUpdateToday++;
    if (status === "no_activity_week") withPendencies++;

    return {
      id: emp.id,
      username: emp.username,
      email: emp.email,
      cargo: emp.userCargo?.name || null,
      lastActivity: lastTask?.task_date || null,
      activitiesWeek: tasks.length,
      ticketsWeek: weekTickets.length,
      status,
    };
  });

  return {
    totalEmployees: employees.length,
    activitiesToday,
    activitiesWeek,
    ticketsWeek,
    withoutUpdateToday,
    withPendencies,
    employees: employeeList,
  };
}

async function getEmployees(managerId, role) {
  const employeeIds = await getEmployeeIds(managerId, role);
  if (employeeIds.length === 0) return [];

  const today = todayStr();
  const { startDate, endDate } = currentWeekBounds();

  const employees = await User.findAll({
    where: { id: { [Op.in]: employeeIds } },
    attributes: ["id", "username", "email", "cargo", "is_active"],
    include: [
      { model: UserCargos, as: "userCargo", attributes: ["id", "name"] },
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "task_date", "azure_ticket_id"],
        where: { task_date: { [Op.between]: [startDate, endDate] } },
        required: false,
      },
    ],
    order: [["username", "ASC"]],
  });

  return employees.map((emp) => {
    const tasks = emp.tasks || [];
    const lastTask = [...tasks].sort((a, b) => b.task_date.localeCompare(a.task_date))[0];
    return {
      id: emp.id,
      username: emp.username,
      email: emp.email,
      cargo: emp.userCargo?.name || null,
      isActive: emp.is_active,
      lastActivity: lastTask?.task_date || null,
      activitiesWeek: tasks.length,
      ticketsWeek: tasks.filter((t) => t.azure_ticket_id != null).length,
      status: calcStatus(tasks),
    };
  });
}

async function getEmployee(managerId, employeeId, role) {
  const employeeIds = await getEmployeeIds(managerId, role);
  if (!employeeIds.includes(Number(employeeId))) {
    const err = new Error("Colaborador nao encontrado ou nao pertence a este gestor.");
    err.statusCode = 404;
    throw err;
  }

  const emp = await User.findByPk(employeeId, {
    attributes: ["id", "username", "email", "cargo", "is_active", "createdAt"],
    include: [{ model: UserCargos, as: "userCargo", attributes: ["id", "name"] }],
  });
  if (!emp) {
    const err = new Error("Colaborador nao encontrado.");
    err.statusCode = 404;
    throw err;
  }

  // Todas as tasks do colaborador
  const allTasks = await Task.findAll({
    where: { user_id: employeeId },
    attributes: ["id", "task_date", "description", "azure_ticket_id", "activity_type_id", "task_status_id"],
    include: [
      { model: ActivityType, as: "activityType", attributes: ["id", "name"] },
      { model: TaskStatus, as: "taskStatus", attributes: ["id", "name"] },
    ],
    order: [["task_date", "DESC"]],
  });

  // Agrupar por semana
  const weekMap = {};
  for (const task of allTasks) {
    const { weekNumber, year } = getISOWeek(task.task_date);
    const key = `${year}-W${String(weekNumber).padStart(2, "0")}`;
    if (!weekMap[key]) {
      const { startDate, endDate } = getWeekBounds(weekNumber, year);
      weekMap[key] = { week: key, year, weekNumber, startDate, endDate, tasks: [] };
    }
    weekMap[key].tasks.push(task);
  }

  const { startDate, endDate } = currentWeekBounds();
  const weekTasks = allTasks.filter((t) => t.task_date >= startDate && t.task_date <= endDate);
  const today = todayStr();

  return {
    employee: {
      id: emp.id,
      username: emp.username,
      email: emp.email,
      cargo: emp.userCargo?.name || null,
      isActive: emp.is_active,
      createdAt: emp.createdAt,
    },
    summary: {
      activitiesToday: allTasks.filter((t) => t.task_date === today).length,
      activitiesWeek: weekTasks.length,
      ticketsWeek: weekTasks.filter((t) => t.azure_ticket_id != null).length,
      status: calcStatus(allTasks),
    },
    history: Object.values(weekMap).sort((a, b) => b.week.localeCompare(a.week)),
  };
}

async function getActivities(managerId, role, filters = {}) {
  const employeeIds = await getEmployeeIds(managerId, role);
  if (employeeIds.length === 0) return [];

  const where = { user_id: { [Op.in]: employeeIds } };

  if (filters.date_from) where.task_date = { ...where.task_date, [Op.gte]: filters.date_from };
  if (filters.date_to) where.task_date = { ...where.task_date, [Op.lte]: filters.date_to };
  if (filters.employee_id) where.user_id = Number(filters.employee_id);
  if (filters.activity_type_id) where.activity_type_id = Number(filters.activity_type_id);
  if (filters.task_status_id) where.task_status_id = Number(filters.task_status_id);
  if (filters.azure_ticket_id) where.azure_ticket_id = filters.azure_ticket_id;

  const tasks = await Task.findAll({
    where,
    attributes: ["id", "task_date", "description", "azure_ticket_id", "activity_type_id", "task_status_id", "user_id"],
    include: [
      { model: User, as: "user", attributes: ["id", "username"] },
      { model: ActivityType, as: "activityType", attributes: ["id", "name"] },
      { model: TaskStatus, as: "taskStatus", attributes: ["id", "name"] },
    ],
    order: [["task_date", "DESC"], ["id", "DESC"]],
  });

  return tasks;
}

async function getStatistics(managerId, role, filters = {}) {
  const employeeIds = await getEmployeeIds(managerId, role);
  if (employeeIds.length === 0) {
    return { byEmployee: [], byWeek: [], byDay: [], byActivityType: [] };
  }

  const where = { user_id: { [Op.in]: employeeIds } };
  if (filters.date_from) where.task_date = { ...where.task_date, [Op.gte]: filters.date_from };
  if (filters.date_to) where.task_date = { ...where.task_date, [Op.lte]: filters.date_to };

  const tasks = await Task.findAll({
    where,
    attributes: ["id", "task_date", "azure_ticket_id", "activity_type_id", "user_id"],
    include: [
      { model: User, as: "user", attributes: ["id", "username"] },
      { model: ActivityType, as: "activityType", attributes: ["id", "name"] },
    ],
    order: [["task_date", "ASC"]],
  });

  // Atividades por colaborador
  const empMap = {};
  for (const t of tasks) {
    const uname = t.user?.username || `#${t.user_id}`;
    empMap[uname] = (empMap[uname] || 0) + 1;
  }
  const byEmployee = Object.entries(empMap).map(([username, count]) => ({ username, count }));

  // Atividades por dia (ultimos 30 dias se sem filtro)
  const dayMap = {};
  for (const t of tasks) {
    dayMap[t.task_date] = (dayMap[t.task_date] || 0) + 1;
  }
  const byDay = Object.entries(dayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  // Tickets por semana (ultimas 8 semanas)
  const weekMap = {};
  for (const t of tasks) {
    if (t.azure_ticket_id) {
      const { weekNumber, year } = getISOWeek(t.task_date);
      const key = `${year}-W${String(weekNumber).padStart(2, "0")}`;
      weekMap[key] = (weekMap[key] || 0) + 1;
    }
  }
  const byWeek = Object.entries(weekMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([week, count]) => ({ week, count }));

  // Distribuicao por tipo de atividade
  const typeMap = {};
  for (const t of tasks) {
    const name = t.activityType?.name || `tipo #${t.activity_type_id}`;
    typeMap[name] = (typeMap[name] || 0) + 1;
  }
  const byActivityType = Object.entries(typeMap).map(([name, count]) => ({ name, count }));

  return { byEmployee, byWeek, byDay, byActivityType };
}

async function exportMd(managerId, role, filters = {}) {
  const tasks = await getActivities(managerId, role, filters);
  const today = todayStr();

  let md = `# Relatorio da Equipe - ${today}\n\n`;

  if (tasks.length === 0) {
    md += "_Nenhuma atividade encontrada para os filtros informados._\n";
    return md;
  }

  // Agrupar por colaborador
  const grouped = {};
  for (const t of tasks) {
    const uname = t.user?.username || `#${t.user_id}`;
    if (!grouped[uname]) grouped[uname] = [];
    grouped[uname].push(t);
  }

  for (const [username, userTasks] of Object.entries(grouped)) {
    md += `## ${username}\n\n`;
    md += `| Data | Descricao | Tipo | Status | Ticket |\n`;
    md += `|------|-----------|------|--------|--------|\n`;
    for (const t of userTasks) {
      const desc = (t.description || "").replace(/\|/g, "/").replace(/\n/g, " ");
      const tipo = t.activityType?.name || "-";
      const status = t.taskStatus?.name || "-";
      const ticket = t.azure_ticket_id || "-";
      md += `| ${t.task_date} | ${desc} | ${tipo} | ${status} | ${ticket} |\n`;
    }
    md += "\n";
  }

  return md;
}

module.exports = {
  getEmployeeIds,
  getDashboard,
  getEmployees,
  getEmployee,
  getActivities,
  getStatistics,
  exportMd,
};
