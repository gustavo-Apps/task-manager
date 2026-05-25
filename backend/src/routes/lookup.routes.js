/**
 * Rotas de dados de referência (lookups)
 *
 * Retorna as tabelas de domínio usadas para popular dropdowns no frontend.
 * Todas as rotas são protegidas — o usuário precisa estar logado.
 *
 * GET /api/lookups/activity-types   — tipos de atividade ativos
 * GET /api/lookups/task-statuses    — status de tarefa ativos
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const { ActivityType, TaskStatus } = require("../models");
const { success } = require("../utils/response");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(authenticate);

router.get(
  "/activity-types",
  asyncHandler(async (_req, res) => {
    const types = await ActivityType.findAll({ where: { is_active: true } });
    return success(res, { activityTypes: types });
  })
);

router.get(
  "/task-statuses",
  asyncHandler(async (_req, res) => {
    const statuses = await TaskStatus.findAll({ where: { is_active: true } });
    return success(res, { taskStatuses: statuses });
  })
);

module.exports = router;
