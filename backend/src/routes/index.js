/**
 * Índice de rotas
 *
 * Monta todos os grupos de rotas sob /api.
 * Adicionar novos módulos aqui sem tocar no app.js.
 */

const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/tasks", require("./task.routes"));
router.use("/reports", require("./report.routes"));
router.use("/lookups", require("./lookup.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/clickup", require("./clickup.routes"));
router.use("/azure", require("./azure.routes"));

module.exports = router;
