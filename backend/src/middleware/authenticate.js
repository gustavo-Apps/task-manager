/**
 * Middleware: autenticação via JWT
 *
 * Verifica o Bearer token no header Authorization.
 * Se válido, anexa req.user = { id, username, email, role }.
 * Se inválido ou ausente, retorna 401.
 *
 * Uso nas rotas:
 *   router.get("/me", authenticate, controller.me);
 *   router.use(authenticate); // protege todas as rotas do router
 */

const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { setAuditUserId } = require("../utils/auditContext");

function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  // O header deve ter o formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Token de autenticação não fornecido.", 401));
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[Auth] Token verificado para userId:", payload.sub);
    // payload.sub deve ser o ID numérico do usuário (definido no authService.login)
    if (!payload.sub) {
      return next(new AppError("Token inválido: identificador de usuário ausente.", 401));
    }

    // Apenas os dados necessários ficam em req.user (não o token inteiro)
    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      cargo: payload.cargo ?? null,
    };

    // Grava o userId no contexto CLS para que os hooks de auditoria
    // possam ler quem fez a operação, sem precisar passar por parâmetro.
    setAuditUserId(payload.sub);

    next();
  } catch (err) {
    // Deixa o errorHandler central tratar JsonWebTokenError e TokenExpiredError
    next(err);
  }
}

/**
 * Middleware: restrição de acesso por role.
 * Deve ser usado APÓS authenticate.
 *
 * Uso: router.delete("/users/:id", authenticate, requireRole("admin"), controller.delete);
 *
 * @param {...string} roles Roles permitidos
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new AppError("Acesso não autorizado.", 403);
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
