/**
 * Pagina: Configuracoes
 *
 * Gerencia as configuracoes de integracao (ClickUp, etc.)
 * Valores sensiveis (tokens) sao mascarados na leitura.
 */

import { useState, useEffect } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

const FIELD_LABELS = {
  clickup_api_token: {
    label: "ClickUp API Token",
    placeholder: "pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    description: "Token de API pessoal. Encontrado em: ClickUp > Configuracoes > Apps > API Token",
    sensitive: true,
    type: "password",
  },
  clickup_workspace_id: {
    label: "ClickUp Workspace ID",
    placeholder: "9011883050",
    description: "ID do workspace. E o numero que aparece na URL: app.clickup.com/WORKSPACE_ID/...",
    sensitive: false,
    type: "text",
  },
  clickup_assignee_id: {
    label: "ClickUp Assignee ID (opcional)",
    placeholder: "123456",
    description: "ID do usuario no ClickUp para atribuir as tasks. Deixe vazio para nao atribuir.",
    sensitive: false,
    type: "text",
  },
};

const FIELD_ORDER = ["clickup_api_token", "clickup_workspace_id", "clickup_assignee_id"];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState({});
  const [clickupStatus, setClickupStatus] = useState(null); // null | "ok" | "error"
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await api.get("/settings");
      const map = {};
      for (const s of res.data.data.settings) {
        map[s.key] = s.value || "";
      }
      setSettings(map);
      // Inicializa o form vazio (usuario digita novo valor se quiser alterar)
      const emptyForm = {};
      for (const key of Object.keys(map)) {
        emptyForm[key] = "";
      }
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao carregar configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    // Filtra apenas os campos que o usuario preencheu (nao envia vazios)
    const updates = {};
    for (const [key, value] of Object.entries(form)) {
      if (value.trim() !== "") {
        updates[key] = value.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      toast("Nenhum campo foi alterado.", { icon: "ℹ️" });
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/settings", updates);
      const map = {};
      for (const s of res.data.data.settings) {
        map[s.key] = s.value || "";
      }
      setSettings(map);
      const emptyForm = {};
      for (const key of Object.keys(map)) {
        emptyForm[key] = "";
      }
      setForm(emptyForm);
      setClickupStatus(null); // reseta status apos salvar
      toast.success("Configuracoes salvas.");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao salvar configuracoes.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckStatus() {
    try {
      setCheckingStatus(true);
      setClickupStatus(null);
      await api.get("/clickup/status");
      setClickupStatus("ok");
      toast.success("ClickUp configurado corretamente.");
    } catch (err) {
      setClickupStatus("error");
      const msg = err.response?.data?.message || "ClickUp nao configurado ou token invalido.";
      toast.error(msg);
    } finally {
      setCheckingStatus(false);
    }
  }

  function toggleShow(key) {
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold text-gray-100 mb-1">Configuracoes</h1>
      <p className="text-xs text-gray-500 mb-6">
        Tokens e parametros de integracao. Valores sensiveis sao armazenados no banco de dados.
      </p>

      {/* ClickUp section */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-200">Integracao ClickUp</h2>

          <div className="flex items-center gap-2">
            {clickupStatus === "ok" && (
              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                Conectado
              </span>
            )}
            {clickupStatus === "error" && (
              <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
                Erro
              </span>
            )}
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded px-3 py-1.5 transition-colors"
            >
              {checkingStatus ? "Verificando..." : "Testar conexao"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {FIELD_ORDER.map((key) => {
            const meta = FIELD_LABELS[key];
            if (!meta) return null;
            const currentMasked = settings[key] || "";
            const isVisible = showTokens[key];

            return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {meta.label}
                </label>

                {/* Valor atual mascarado */}
                {currentMasked && (
                  <p className="text-xs text-gray-600 mb-1.5 font-mono">
                    Atual: {currentMasked}
                  </p>
                )}

                <div className="relative">
                  <input
                    type={meta.sensitive && !isVisible ? "password" : "text"}
                    value={form[key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={currentMasked ? "Deixe vazio para manter o atual" : meta.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-gray-500 pr-16 font-mono"
                  />
                  {meta.sensitive && (
                    <button
                      type="button"
                      onClick={() => toggleShow(key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                    >
                      {isVisible ? "Ocultar" : "Mostrar"}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-1">{meta.description}</p>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded px-4 py-2 transition-colors"
            >
              {saving ? "Salvando..." : "Salvar configuracoes"}
            </button>
          </div>
        </form>
      </div>

      {/* Instrucoes */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-500 space-y-2">
        <p className="font-medium text-gray-400">Como obter as informacoes do ClickUp:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <span className="font-medium text-gray-400">API Token:</span> ClickUp - Perfil - Apps - API Token
          </li>
          <li>
            <span className="font-medium text-gray-400">Workspace ID:</span> O numero na URL do ClickUp:{" "}
            <span className="font-mono text-gray-400">app.clickup.com/WORKSPACE_ID/...</span>
          </li>
          <li>
            <span className="font-medium text-gray-400">Assignee ID (opcional):</span> ID numerico do usuario no ClickUp
          </li>
        </ol>
      </div>
    </div>
  );
}
