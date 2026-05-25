/**
 * Utilitário: respostas HTTP padronizadas
 *
 * Centraliza o formato das respostas para garantir consistência.
 * Todos os endpoints retornam { ok, data } ou { ok, message }.
 */

/**
 * Resposta de sucesso.
 * @param {import("express").Response} res
 * @param {*} data
 * @param {number} status HTTP status code (padrão 200)
 */
function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

/**
 * Resposta de criação de recurso.
 * @param {import("express").Response} res
 * @param {*} data
 */
function created(res, data) {
  return success(res, data, 201);
}

/**
 * Resposta de erro.
 * @param {import("express").Response} res
 * @param {string} message
 * @param {number} status HTTP status code (padrão 400)
 * @param {*} [details] Detalhes extras (ex: erros de validação)
 */
function error(res, message, status = 400, details = undefined) {
  const body = { ok: false, message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, created, error };
