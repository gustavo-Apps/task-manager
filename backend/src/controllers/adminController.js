const bcrypt = require("bcryptjs");
const { User, WeeklyReport, UserCargos, UserManager } = require("../models");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAdmin(req) {
  if (req.user.role !== "admin") throw new AppError("Acesso negado.", 403);
}

// GET /admin/users
const listUsers = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const users = await User.unscoped().findAll({
    attributes: ["id", "username", "email", "role", "cargo", "is_active", "createdAt"],
    include: [{ model: UserCargos, as: "userCargo", attributes: ["id", "name"] }],
    order: [["createdAt", "ASC"]],
  });
  return success(res, { users });
});

// POST /admin/users
const createUser = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { username, email, password, role, cargo } = req.body;
  if (!username || !email || !password) throw new AppError("username, email e password sao obrigatorios.", 400);

  const existing = await User.unscoped().findOne({ where: { email }, attributes: ["id"] });
  if (existing) throw new AppError("Email ja cadastrado.", 409);

  const password_hash = await bcrypt.hash(password, 12);
  const created = await User.create({ username, email, password_hash, role: role || "user", cargo: cargo || 1 });
  const user = await User.unscoped().findByPk(created.id, {
    attributes: ["id", "username", "email", "role", "cargo", "is_active", "createdAt"],
    include: [{ model: UserCargos, as: "userCargo", attributes: ["id", "name"] }],
  });
  return success(res, { user }, 201);
});

// PATCH /admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { id } = req.params;
  const { username, email, role, cargo, is_active } = req.body;

  const user = await User.unscoped().findByPk(id);
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (email    !== undefined) updates.email    = email;
  if (role     !== undefined) updates.role     = role;
  if (cargo    !== undefined) updates.cargo    = cargo;
  if (is_active !== undefined) updates.is_active = is_active;

  await user.update(updates);

  const updated = await User.unscoped().findByPk(id, {
    attributes: ["id", "username", "email", "role", "cargo", "is_active", "createdAt"],
    include: [{ model: UserCargos, as: "userCargo", attributes: ["id", "name"] }],
  });
  return success(res, { user: updated });
});

// POST /admin/users/:id/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { id } = req.params;
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) throw new AppError("Nova senha deve ter ao menos 6 caracteres.", 400);

  const user = await User.unscoped().findByPk(id);
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  const password_hash = await bcrypt.hash(new_password, 12);
  await user.update({ password_hash });
  return success(res, { message: "Senha redefinida com sucesso." });
});

// DELETE /admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { id } = req.params;
  if (Number(id) === req.user.id) throw new AppError("Voce nao pode excluir a propria conta.", 400);

  const user = await User.unscoped().findByPk(id);
  if (!user) throw new AppError("Usuario nao encontrado.", 404);
  await user.destroy();
  return success(res, { message: "Usuario excluido." });
});

// GET /admin/reports
const listAllReports = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const reports = await WeeklyReport.findAll({
    include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
    order: [["year", "DESC"], ["week_number", "DESC"]],
  });
  return success(res, { reports });
});

// GET /admin/managers
const listManagers = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const managers = await User.findAll({
    where: { role: "manager" },
    attributes: ["id", "username", "email", "cargo", "is_active"],
    include: [{ model: UserCargos, as: "userCargo", attributes: ["id", "name"] }],
    order: [["username", "ASC"]],
  });
  return success(res, { managers });
});

// GET /admin/manager-links
const listManagerLinks = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const links = await UserManager.findAll({
    include: [
      { model: User, as: "manager", attributes: ["id", "username", "email"] },
      { model: User, as: "employee", attributes: ["id", "username", "email"] },
    ],
    order: [["manager_id", "ASC"], ["employee_id", "ASC"]],
  });
  return success(res, { links });
});

// POST /admin/manager-links
const createManagerLink = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { manager_id, employee_id } = req.body;
  if (!manager_id || !employee_id) throw new AppError("manager_id e employee_id sao obrigatorios.", 400);

  const manager = await User.findByPk(manager_id, { attributes: ["id", "role"] });
  if (!manager) throw new AppError("Manager nao encontrado.", 404);
  if (!["manager", "admin"].includes(manager.role))
    throw new AppError("O usuario informado nao tem role manager ou admin.", 400);

  const employee = await User.findByPk(employee_id, { attributes: ["id"] });
  if (!employee) throw new AppError("Colaborador nao encontrado.", 404);

  const [link, created] = await UserManager.findOrCreate({
    where: { manager_id, employee_id },
    defaults: { manager_id, employee_id },
  });
  if (!created) throw new AppError("Vinculo ja existe.", 409);
  return success(res, { link }, 201);
});

// DELETE /admin/manager-links/:id
const deleteManagerLink = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const link = await UserManager.findByPk(req.params.id);
  if (!link) throw new AppError("Vinculo nao encontrado.", 404);
  await link.destroy();
  return success(res, { message: "Vinculo removido." });
});

module.exports = { listUsers, createUser, updateUser, resetPassword, deleteUser, listAllReports, listManagers, listManagerLinks, createManagerLink, deleteManagerLink };

