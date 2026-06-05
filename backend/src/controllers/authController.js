/**
 * Controller: Autenticação
 *
 * Recebe e valida a requisição HTTP, delega para o service,
 * e formata a resposta. Zero lógica de negócio aqui.
 */

const authService = require("../services/authService");
const { created, success } = require("../utils/response");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return created(res, { user });
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  return success(res, { token, user });
});

const me = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  return success(res, { user, message: "Perfil atualizado com sucesso." });
});

module.exports = { register, login, me, updateProfile };
