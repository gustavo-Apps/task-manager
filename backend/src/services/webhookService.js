/**
 * Service: WebhookService
 *
 * CRUD de webhooks por usuário + disparo de payload para todos os ativos.
 */

const { UserWebhook } = require("../models");
const AppError = require("../utils/AppError");

const MAX = UserWebhook.MAX_PER_USER;

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function listByUser(userId) {
  return UserWebhook.findAll({
    where: { user_id: userId },
    order: [["created_at", "ASC"]],
  });
}

async function create(userId, { label, url, enabled = true }) {
  if (!label?.trim()) throw new AppError("label e obrigatorio.", 400);
  if (!url?.trim())   throw new AppError("url e obrigatoria.", 400);
  if (!isValidUrl(url)) throw new AppError("URL invalida. Use https://...", 400);

  const count = await UserWebhook.count({ where: { user_id: userId } });
  if (count >= MAX) throw new AppError(`Limite de ${MAX} webhooks por usuario atingido.`, 400);

  return UserWebhook.create({ user_id: userId, label: label.trim(), url: url.trim(), enabled });
}

async function update(userId, id, { label, url, enabled }) {
  const webhook = await findOwned(userId, id);

  const updates = {};
  if (label   !== undefined) { if (!label.trim()) throw new AppError("label nao pode ser vazio.", 400); updates.label = label.trim(); }
  if (url     !== undefined) { if (!isValidUrl(url)) throw new AppError("URL invalida.", 400); updates.url = url.trim(); }
  if (enabled !== undefined) updates.enabled = enabled;

  await webhook.update(updates);
  return webhook.reload();
}

async function remove(userId, id) {
  const webhook = await findOwned(userId, id);
  await webhook.destroy();
}

// ─── Disparo ──────────────────────────────────────────────────────────────────

/**
 * Dispara um payload JSON para todos os webhooks ativos de um usuário.
 * Falhas individuais são logadas mas não interrompem os demais.
 *
 * @param {number} userId
 * @param {Object} payload
 * @returns {Promise<{ sent: number, failed: number, results: Array }>}
 */
async function dispatch(userId, payload) {
  const webhooks = await UserWebhook.findAll({
    where: { user_id: userId, enabled: true },
  });

  if (webhooks.length === 0) return { sent: 0, failed: 0, results: [] };

  const results = await Promise.allSettled(
    webhooks.map((wh) =>
      fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { id: wh.id, label: wh.label, status: "ok" };
      })
    )
  );

  let sent = 0, failed = 0;
  const detail = results.map((r, i) => {
    const wh = webhooks[i];
    if (r.status === "fulfilled") { sent++; return { id: wh.id, label: wh.label, ok: true }; }
    failed++;
    console.warn(`[webhook] falha em "${wh.label}" (${wh.url}): ${r.reason?.message}`);
    return { id: wh.id, label: wh.label, ok: false, error: r.reason?.message };
  });

  return { sent, failed, results: detail };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findOwned(userId, id) {
  const webhook = await UserWebhook.findOne({ where: { id, user_id: userId } });
  if (!webhook) throw new AppError("Webhook nao encontrado.", 404);
  return webhook;
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

module.exports = { listByUser, create, update, remove, dispatch };
