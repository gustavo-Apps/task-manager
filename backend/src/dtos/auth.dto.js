/**
 * DTOs: Autenticação
 *
 * Define e valida os dados esperados nas rotas de auth.
 * O Joi valida e sanitiza antes de chegar no controller.
 */

const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required()
    .messages({
      "string.alphanum": "username deve conter apenas letras e numeros",
      "string.min": "username deve ter pelo menos 3 caracteres",
    }),
  email:    Joi.string().email({ tlds: { allow: false } }).max(150).required(),
  password: Joi.string().min(3).max(72).required()
    .messages({ "string.min": "Senha deve ter pelo menos 3 caracteres" }),
  cargo:    Joi.number().integer().min(1).max(5).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  current_password: Joi.string().required()
    .messages({ "any.required": "Informe a senha atual para salvar alteracoes." }),
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9._]+$/)
    .min(3).max(50)
    .optional()
    .messages({
      "string.pattern.base": "username deve conter apenas letras, numeros, ponto ou underscore",
      "string.min": "username deve ter pelo menos 3 caracteres",
    }),
  new_password: Joi.string().min(3).max(72).optional()
    .messages({ "string.min": "Nova senha deve ter pelo menos 3 caracteres" }),
}).or("username", "new_password")
  .messages({ "object.missing": "Informe ao menos username ou nova senha para alterar." });

module.exports = { registerSchema, loginSchema, updateProfileSchema };
