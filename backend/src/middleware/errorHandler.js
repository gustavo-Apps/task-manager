/**
 * Middleware: tratamento global de erros
 *
 * Captura qualquer erro propagado via next(error) ou throw dentro de async.
 * Deve ser registrado APÓS todas as rotas no app.js.
 *
 * Comportamento:
 * - AppError: retorna a mensagem diretamente (erro esperado)
 * - Erro do Sequelize (validação): formata os campos com problema
 * - Erro genérico: loga o stack e retorna 500 sem vazar detalhes internos
 */

const AppError = require("../utils/AppError");

function errorHandler(err, _req, res, _next) {
  // Erro esperado da aplicação (gerado com throw new AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      message: err.message,
    });
  }

  // Erro de validação do Sequelize (ex: campo único duplicado)
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({
      ok: false,
      message: "Erro de validação no banco de dados.",
      details,
    });
  }

  // Erro de JWT expirado/inválido
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      ok: false,
      message: "Token inválido ou expirado.",
    });
  }

  // Erro inesperado — loga internamente mas não vaza detalhes para o cliente
  console.error("[ERROR]", err);
  return res.status(500).json({
    ok: false,
    message: "Erro interno do servidor.",
  });
}

module.exports = errorHandler;
