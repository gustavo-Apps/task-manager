/**
 * Controller: Azure DevOps
 *
 * GET /api/azure/ticket/:ticketId
 *   Busca o título de um work item usando o PAT configurado pelo usuário.
 *   Retorna { title } para uso no preenchimento automático do formulário de tarefa.
 */

const settingsService = require("../services/settingsService");
const AppError = require("../utils/AppError");
const { success } = require("../utils/response");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  if (!ticketId || !/^\d+$/.test(ticketId)) {
    throw new AppError("ID do ticket invalido.", 400);
  }

  const userId = req.user.id;

  const [token, org, project] = await Promise.all([
    settingsService.getValue(userId, "azure_devops_token"),
    settingsService.getValue(userId, "azure_devops_org"),
    settingsService.getValue(userId, "azure_devops_project"),
  ]);

  if (!token || !org || !project) {
    throw new AppError(
      "Azure DevOps nao configurado. Configure o token, organizacao e projeto em Configuracoes > Azure DevOps.",
      400
    );
  }

  const encoded = Buffer.from(`:${token}`).toString("base64");
  // Decodifica antes de encodar para evitar duplo encoding
  // (cobre casos em que o usuario salvou o valor ja com %20 ou similar)
  const safeOrg     = encodeURIComponent(decodeURIComponent(org.trim()));
  const safeProject = encodeURIComponent(decodeURIComponent(project.trim()));
  const url = `https://dev.azure.com/${safeOrg}/${safeProject}/_apis/wit/workitems/${ticketId}?api-version=7.1&$select=System.Title`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new AppError("Falha ao conectar com o Azure DevOps. Verifique sua conexao.", 502);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError("Token Azure DevOps invalido ou sem permissao de leitura.", 401);
  }
  if (response.status === 404) {
    console.warn('Ticket nao encontrado:', url);
    throw new AppError(`Ticket #${ticketId} nao encontrado.`, 404);
  }
  if (!response.ok) {
    throw new AppError(`Erro ao buscar ticket no Azure DevOps (HTTP ${response.status}).`, 502);
  }

  const data = await response.json();
  const title = data?.fields?.["System.Title"];

  if (!title) {
    throw new AppError("Titulo nao encontrado para este ticket.", 404);
  }

  return success(res, { title });
});

/**
 * GET /api/azure/status
 * Verifica se o usuario tem Azure DevOps configurado (sem expor o token).
 */
const getStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [token, org, project] = await Promise.all([
    settingsService.getValue(userId, "azure_devops_token"),
    settingsService.getValue(userId, "azure_devops_org"),
    settingsService.getValue(userId, "azure_devops_project"),
  ]);

  const configured = Boolean(token && org && project);
  return success(res, { configured, org: configured ? org : null, project: configured ? project : null });
});

module.exports = { getTicket, getStatus };
