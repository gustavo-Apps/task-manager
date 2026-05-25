/**
 * Middleware: fábrica de validação via Joi
 *
 * Retorna um middleware que valida req.body contra o schema fornecido.
 * - stripUnknown: remove campos não definidos no schema (segurança)
 * - abortEarly: false — retorna TODOS os erros de uma vez
 *
 * Uso:
 *   const { validate } = require("../middleware/validate");
 *   const { createTaskSchema } = require("../dtos/task.dto");
 *   router.post("/", validate(createTaskSchema), taskController.create);
 */

const AppError = require("../utils/AppError");

function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,    // coleta todos os erros
      stripUnknown: true,   // remove campos extras (proteção contra mass assignment)
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));

      return next(
        Object.assign(new AppError("Dados inválidos.", 400), { details })
      );
    }

    // Substitui req.body pelo valor sanitizado pelo Joi
    req.body = value;
    next();
  };
}

module.exports = { validate };
