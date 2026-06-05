/**
 * Rotas de integracao com ClickUp (protegidas por autenticacao)
 *
 * POST /api/clickup/reports/:id  - envia relatorio para o ClickUp
 * GET  /api/clickup/status       - verifica se esta configurado
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const clickupController = require("../controllers/clickupController");

router.use(authenticate);

router.get("/status",          clickupController.checkStatus);
router.get("/destinations",    clickupController.listDestinations);
router.get("/reports/:id",     clickupController.getDocStatus);
router.post("/reports/:id",    clickupController.sendReport);

module.exports = router;
