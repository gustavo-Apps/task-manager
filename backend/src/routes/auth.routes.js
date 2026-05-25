/**
 * Rotas de autenticação
 *
 * POST /api/auth/register  — cria nova conta
 * POST /api/auth/login     — autentica e retorna JWT
 * GET  /api/auth/me        — retorna dados do usuário logado (requer token)
 */

const router = require("express").Router();
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/authenticate");
const { registerSchema, loginSchema } = require("../dtos/auth.dto");
const authController = require("../controllers/authController");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);

module.exports = router;
