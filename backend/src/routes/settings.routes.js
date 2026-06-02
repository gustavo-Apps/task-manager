/**
 * Rotas de configuracoes (protegidas por autenticacao)
 *
 * GET /api/settings   - lista configuracoes (mascaradas)
 * PUT /api/settings   - atualiza configuracoes
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const settingsController = require("../controllers/settingsController");

router.use(authenticate);

router.get("/", settingsController.getAll);
router.put("/", settingsController.update);

module.exports = router;
