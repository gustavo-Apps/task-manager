const { User, WeeklyReport } = require("../models");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const listUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new AppError("Acesso negado.", 403);
  const users = await User.findAll({ attributes: ["id", "username", "email", "role", "createdAt"] });
  return success(res, { users });
});

const listAllReports = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new AppError("Acesso negado.", 403);
  const reports = await WeeklyReport.findAll({
    include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
    order: [["year", "DESC"], ["week_number", "DESC"]],
  });
  return success(res, { reports });
});

module.exports = { listUsers, listAllReports };
