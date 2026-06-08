/**
 * Controller: Webhooks do usuário
 *
 * GET    /api/webhooks          — lista todos do usuário autenticado
 * POST   /api/webhooks          — cria (máx 5)
 * PATCH  /api/webhooks/:id      — edita label / url / enabled
 * DELETE /api/webhooks/:id      — remove
 * POST   /api/webhooks/:id/test — dispara payload de teste para um webhook específico
 */

const webhookService = require("../services/webhookService");
const { success } = require("../utils/response");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const list = asyncHandler(async (req, res) => {
  const webhooks = await webhookService.listByUser(req.user.id);
  return success(res, { webhooks });
});

const create = asyncHandler(async (req, res) => {
  const webhook = await webhookService.create(req.user.id, req.body);
  return success(res, { webhook }, 201);
});

const update = asyncHandler(async (req, res) => {
  const webhook = await webhookService.update(req.user.id, req.params.id, req.body);
  return success(res, { webhook });
});

const remove = asyncHandler(async (req, res) => {
  await webhookService.remove(req.user.id, req.params.id);
  return success(res, { message: "Webhook removido." });
});

const test = asyncHandler(async (req, res) => {
  const { UserWebhook } = require("../models");
  const AppError = require("../utils/AppError");

  const webhook = await UserWebhook.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!webhook) throw new AppError("Webhook nao encontrado.", 404);

  const payload = {
    event: "test",
    message: "Teste de webhook do Weekly Reports",
    user: req.user.username,
    timestamp: new Date().toISOString(),
  };

  try {
    const r = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return success(res, { ok: true, message: "Webhook disparado com sucesso." });
  } catch (err) {
    return success(res, { ok: false, message: `Falha: ${err.message}` });
  }
});

module.exports = { list, create, update, remove, test };
