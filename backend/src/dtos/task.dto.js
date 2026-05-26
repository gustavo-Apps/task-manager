/**
 * DTOs: Tasks
 *
 * Valida os dados de criação e atualização de tarefas.
 */

const Joi = require("joi");

const createTaskSchema = Joi.object({
  activity_type_id: Joi.number().integer().positive().required(),

  title: Joi.string().max(200).optional(), // gerado automaticamente se azure_ticket_id for informado

  description: Joi.string().max(5000).optional().allow("", null),

  task_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ "string.pattern.base": "task_date deve estar no formato YYYY-MM-DD" }),

  task_status_id: Joi.number().integer().positive().default(3), // 3 = Concluído no seed

  discord_link: Joi.string().uri().max(500).optional().allow("", null),

  azure_ticket_id: Joi.string().max(50).optional().allow("", null),

  notes: Joi.string().max(2000).optional().allow("", null),

  task_end_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow("", null)
    .messages({ "string.pattern.base": "task_end_date deve estar no formato YYYY-MM-DD" }),
});

const updateTaskSchema = Joi.object({
  activity_type_id: Joi.number().integer().positive().optional(),
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(5000).optional().allow("", null),
  task_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  task_status_id: Joi.number().integer().positive().optional(),
  discord_link: Joi.string().uri().max(500).optional().allow("", null),
  azure_ticket_id: Joi.string().max(50).optional().allow("", null),
  notes: Joi.string().max(2000).optional().allow("", null),
  task_end_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow("", null)
    .messages({ "string.pattern.base": "task_end_date deve estar no formato YYYY-MM-DD" }),
}).min(1); // ao menos um campo deve ser enviado no update

module.exports = { createTaskSchema, updateTaskSchema };
