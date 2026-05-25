/**
 * Rotas de tarefas (protegidas por autenticação)
 *
 * POST   /api/tasks         — cria tarefa (cria relatório semanal automaticamente)
 * GET    /api/tasks         — lista tarefas do usuário logado
 * GET    /api/tasks/:id     — busca tarefa por ID
 * PATCH  /api/tasks/:id     — atualiza campos da tarefa
 * DELETE /api/tasks/:id     — remove tarefa
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const { validate } = require("../middleware/validate");
const { createTaskSchema, updateTaskSchema } = require("../dtos/task.dto");
const taskController = require("../controllers/taskController");

// Protege todas as rotas abaixo com JWT
router.use(authenticate);

router.post("/", validate(createTaskSchema), taskController.create);
router.get("/", taskController.list);
router.get("/:id", taskController.getOne);
router.patch("/:id", validate(updateTaskSchema), taskController.update);
router.delete("/:id", taskController.remove);

module.exports = router;
