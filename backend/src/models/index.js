/**
 * Índice de models — registra associações entre entidades.
 *
 * Centralizar as associações aqui evita dependências circulares
 * entre os arquivos de model.
 *
 * Como importar em outros arquivos:
 *   const { User, Task, WeeklyReport, ActivityType } = require("../models");
 */
const UserCargos = require("./Cargos");
const User = require("./User");
const Setting = require("./Setting");
const ActivityType = require("./ActivityType");
const TaskStatus = require("./TaskStatus");
const WeeklyReport = require("./WeeklyReport");
const Task = require("./Task");
const AuditLog = require("./AuditLog");
const UserWebhook = require("./UserWebhook");
const { applyAuditHooksToAll } = require("../utils/auditHooks");

// Um usuário pertence a um cargo
UserCargos.hasMany(User, { foreignKey: "cargo", as: "users" });
User.belongsTo(UserCargos, { foreignKey: "cargo", as: "userCargo" });

// Um usuário tem vários relatórios semanais
User.hasMany(WeeklyReport, { foreignKey: "user_id", as: "weeklyReports" });
WeeklyReport.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Um relatório semanal contém várias tarefas
WeeklyReport.hasMany(Task, { foreignKey: "weekly_report_id", as: "tasks" });
Task.belongsTo(WeeklyReport, { foreignKey: "weekly_report_id", as: "weeklyReport" });

// Uma tarefa pertence a um usuário (facilita queries diretas)
User.hasMany(Task, { foreignKey: "user_id", as: "tasks" });
Task.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Uma tarefa tem um tipo de atividade
ActivityType.hasMany(Task, { foreignKey: "activity_type_id", as: "tasks" });
Task.belongsTo(ActivityType, { foreignKey: "activity_type_id", as: "activityType" });

// Uma tarefa tem um status
TaskStatus.hasMany(Task, { foreignKey: "task_status_id", as: "tasks" });
Task.belongsTo(TaskStatus, { foreignKey: "task_status_id", as: "taskStatus" });

// Um usuário tem até 5 webhooks
User.hasMany(UserWebhook, { foreignKey: "user_id", as: "webhooks" });
UserWebhook.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = { User, ActivityType, TaskStatus, WeeklyReport, Task, UserCargos, Setting, AuditLog, UserWebhook };

// Aplica hooks de auditoria em todos os models que representam dados de negócio.
// AuditLog e Setting são excluídos intencionalmente:
//   - AuditLog: auditá-lo causaria loop infinito
//   - Setting: mudanças de config não precisam de audit trail detalhado
applyAuditHooksToAll([User, ActivityType, TaskStatus, WeeklyReport, Task, UserCargos]);
