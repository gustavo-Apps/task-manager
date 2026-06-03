/**
 * Service: Autenticação
 *
 * Contém a lógica de negócio de registro e login.
 * Controllers apenas delegam para cá — sem regras de negócio fora deste arquivo.
 *
 * Princípios aplicados:
 * - Senha sempre com bcrypt (custo 12 — bom equilíbrio entre segurança e desempenho)
 * - JWT carrega apenas dados não-sensíveis (sem senha, sem dados privados)
 * - Mensagem de erro genérica no login (não revela se o email existe)
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const AppError = require("../utils/AppError");

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Registra um novo usuário.
 * @param {{ username, email, password, cargo }} data
 * @returns {Promise<User>} Usuário criado (sem password_hash)
 */
async function register({ username, email, password, cargo }) {
  // Verifica duplicatas antes de tentar inserir
  const existing = await User.unscoped().findOne({
    where: { email },
    attributes: ["id"],
  });

  if (existing) {
    throw new AppError("Este email já está cadastrado.", 409);
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await User.create({ username, email, password_hash, cargo });

  // Retorna sem o hash — nunca exponha a senha
  return User.findByPk(user.id);
}

/**
 * Autentica um usuário e retorna um JWT.
 * @param {{ email, password }} data
 * @returns {Promise<{ token: string, user: User }>}
 */
async function login({ email, password }) {
  // unscoped() bypassa o defaultScope (que exclui password_hash),
  // retornando todas as colunas incluindo o hash para comparação.
  // Mais seguro que combinar scopes com exclude+include no Sequelize 6.
  const user = await User.unscoped().findOne({ where: { email } });

  // Mensagem genérica intencional: não revela se o email existe no banco
  const INVALID_CREDENTIALS = "Email ou senha inválidos.";

  if (!user) throw new AppError(INVALID_CREDENTIALS, 401);
  if (!user.is_active) throw new AppError("Conta desativada.", 403);

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) throw new AppError(INVALID_CREDENTIALS, 401);

  const token = jwt.sign(
    {
      sub: user.id,         // "sub" é o campo padrão JWT para o ID do sujeito
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Retorna o usuário sem o hash
  const userPublic = await User.findByPk(user.id);
  return { token, user: userPublic };
}

module.exports = { register, login };
