/**
 * Rotas de relatórios semanais (protegidas por autenticação)
 *
 * GET  /api/reports                    — lista todos os relatórios do usuário
 * GET  /api/reports/period             — download .md para período customizado (?dataInicio=&dataFim=)
 * GET  /api/reports/current            — relatório da semana atual
 * GET  /api/reports/for-date           — relatório por data (?date=YYYY-MM-DD)
 * GET  /api/reports/:id                — relatório com tarefas completas
 * GET  /api/reports/:id/markdown       — download do arquivo .md
 * GET  /api/reports/:id/json           — exportar relatório em JSON
 * POST /api/reports/:id/close          — fecha o relatório (status: closed)
 * POST /api/reports/:id/notify         — disparo manual de webhook pelo usuário
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const reportController = require("../controllers/reportController");

router.use(authenticate);

router.get("/", reportController.list);
router.get("/current", reportController.getCurrent);
router.get("/for-date", reportController.getForDate);
router.get("/period", reportController.downloadMarkdownForPeriod);
router.get("/:id/json", reportController.exportJson);
router.get("/:id", reportController.getOne);
router.get("/:id/markdown", reportController.downloadMarkdown);
router.post("/:id/close", reportController.close);
router.post("/:id/notify", reportController.notify);

module.exports = router;
