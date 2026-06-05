/**
 * Rotas de integração com Azure DevOps (protegidas por autenticação)
 *
 * GET /api/azure/status         - verifica se configurado
 * GET /api/azure/ticket/:id     - busca título de um work item
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const azureController = require("../controllers/azureController");

router.use(authenticate);

router.get("/status", azureController.getStatus);
router.get("/ticket/:ticketId", azureController.getTicket);

module.exports = router;
