/**
 * Controller: Autenticação
 *
 * Recebe e valida a requisição HTTP, delega para o service,
 * e formata a resposta. Zero lógica de negócio aqui.
 */

const authService = require("../services/authService");
const { created, success } = require("../utils/response");

// Captura erros assíncronos sem precisar de try/catch em cada método
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return created(res, { user });
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  return success(res, { token, user });
});

// Retorna o usuário autenticado (dados do JWT + banco)
const me = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

module.exports = { register, login, me };
