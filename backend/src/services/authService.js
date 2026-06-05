/**
 * Service: Autenticação
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const AppError = require("../utils/AppError");

const BCRYPT_SALT_ROUNDS = 12;

async function register({ username, email, password, cargo }) {
  const existing = await User.unscoped().findOne({
    where: { email },
    attributes: ["id"],
  });

  if (existing) {
    throw new AppError("Este email ja esta cadastrado.", 409);
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({ username, email, password_hash, cargo });
  return User.findByPk(user.id);
}

async function login({ email, password }) {
  const user = await User.unscoped().findOne({ where: { email } });

  const INVALID_CREDENTIALS = "Email ou senha invalidos.";
  if (!user) throw new AppError(INVALID_CREDENTIALS, 401);
  if (!user.is_active) throw new AppError("Conta desativada.", 403);

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) throw new AppError(INVALID_CREDENTIALS, 401);

  const token = jwt.sign(
    { sub: user.id, username: user.username, email: user.email, role: user.role, cargo: user.cargo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  const userPublic = await User.findByPk(user.id);
  return { token, user: userPublic };
}

/**
 * Atualiza username e/ou senha do usuario autenticado.
 * Exige a senha atual para qualquer alteracao.
 *
 * @param {number} userId
 * @param {{ current_password, username?, new_password? }} data
 */
async function updateProfile(userId, { current_password, username, new_password }) {
  const user = await User.unscoped().findByPk(userId);
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  // Valida senha atual sempre — nunca permite mudanca sem autenticacao
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) throw new AppError("Senha atual incorreta.", 401);

  const updates = {};

  if (username && username !== user.username) {
    // Garante unicidade
    const taken = await User.unscoped().findOne({ where: { username }, attributes: ["id"] });
    if (taken && taken.id !== userId) throw new AppError("Username ja esta em uso.", 409);
    updates.username = username;
  }

  if (new_password) {
    updates.password_hash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("Nenhuma alteracao informada.", 400);
  }

  await User.update(updates, { where: { id: userId } });

  // Retorna usuario atualizado (sem hash)
  return User.findByPk(userId);
}

module.exports = { register, login, updateProfile };
