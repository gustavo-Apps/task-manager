/**
 * DTOs: Autenticação
 *
 * Define e valida os dados esperados nas rotas de auth.
 * O Joi valida e sanitiza antes de chegar no controller.
 */

const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.alphanum": "username deve conter apenas letras e números",
      "string.min": "username deve ter pelo menos 3 caracteres",
    }),

  email: Joi.string().email().max(150).required(),

  password: Joi.string()
    .min(8)
    .max(72) // bcrypt limita a 72 chars
    .required()
    .messages({
      "string.min": "Senha deve ter pelo menos 8 caracteres",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
