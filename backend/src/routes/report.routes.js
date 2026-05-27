/**
 * Rotas de relatórios semanais (protegidas por autenticação)
 *
 * GET  /api/reports                    — lista todos os relatórios do usuário
 * GET  /api/reports/period             — download .md para período customizado (?dataInicio=&dataFim=)
 * GET  /api/reports/:id                — relatório com tarefas completas
 * GET  /api/reports/:id/markdown       — download do arquivo .md
 * POST /api/reports/:id/close         — fecha o relatório (status: closed)
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const reportController = require("../controllers/reportController");

router.use(authenticate);

router.get("/", reportController.list);
router.get("/period", reportController.downloadMarkdownForPeriod);
router.get("/:id", reportController.getOne);
router.get("/:id/markdown", reportController.downloadMarkdown);
router.post("/:id/close", reportController.close);

module.exports = router;
