/**
 * auditContext.js
 *
 * Gerencia o contexto de auditoria usando CLS (Continuation Local Storage).
 *
 * O CLS funciona como um "thread-local" para Node.js assíncrono:
 * cada request HTTP recebe seu próprio namespace isolado, e qualquer código
 * que rode dentro daquele request (incluindo Sequelize hooks) consegue ler
 * o userId sem precisar recebê-lo como parâmetro.
 *
 * Uso:
 *   // Gravar (no middleware de autenticação):
 *   setAuditUserId(req.user.id);
 *
 *   // Ler (dentro dos hooks Sequelize):
 *   const userId = getAuditUserId(); // retorna null fora de um request
 */

const cls = require("cls-hooked");

const NAMESPACE = "audit-context";

// Cria (ou reutiliza) o namespace CLS global
const auditNamespace = cls.getNamespace(NAMESPACE) || cls.createNamespace(NAMESPACE);

const USER_KEY = "userId";

/**
 * Retorna o namespace CLS de auditoria.
 * Necessário para integrá-lo ao Sequelize (Sequelize.useCLS).
 */
function getAuditNamespace() {
  return auditNamespace;
}

/**
 * Grava o ID do usuário no contexto do request atual.
 * Deve ser chamado após a autenticação JWT.
 *
 * @param {number|null} userId
 */
function setAuditUserId(userId) {
  if (auditNamespace.active) {
    auditNamespace.set(USER_KEY, userId ?? null);
  }
}

/**
 * Lê o ID do usuário do contexto do request atual.
 * Retorna null quando chamado fora de um contexto ativo (ex: seeds, scripts).
 *
 * @returns {number|null}
 */
function getAuditUserId() {
  return auditNamespace.get(USER_KEY) ?? null;
}

/**
 * Middleware Express: abre o contexto CLS para o request e fecha ao final.
 * Deve ser o PRIMEIRO middleware registrado no app.js.
 */
function auditContextMiddleware(req, _res, next) {
  auditNamespace.run(() => next());
}

module.exports = {
  getAuditNamespace,
  setAuditUserId,
  getAuditUserId,
  auditContextMiddleware,
};
