/**
 * Classe de erro da aplicação (AppError)
 *
 * Estende o Error padrão com um statusCode HTTP.
 * O middleware errorHandler usa instanceof AppError para decidir
 * se loga o stack trace (erros inesperados) ou apenas retorna a mensagem.
 *
 * Uso:
 *   throw new AppError("Usuário não encontrado", 404);
 *   throw new AppError("Token inválido", 401);
 */

class AppError extends Error {
  /**
   * @param {string} message Mensagem de erro para o cliente
   * @param {number} statusCode HTTP status code
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";

    // Mantém o stack trace correto no Node.js
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
