/**
 * Pagina: Configuracoes
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
  const [settings, setSettings]         = useState({});
  const [form, setForm]                 = useState({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [showTokens, setShowTokens]     = useState({});
  const [clickupStatus, setClickupStatus]   = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await api.get("/settings");
      const map = {};
      for (const s of res.data.data.settings) map[s.key] = s.value || "";
      setSettings(map);
      const emptyForm = {};
      for (const key of Object.keys(map)) emptyForm[key] = "";
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao carregar configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const updates = {};
    for (const [key, value] of Object.entries(form)) {
      if (value.trim() !== "") updates[key] = value.trim();
    }
    if (Object.keys(updates).length === 0) {
      toast("Nenhum campo foi alterado.", { icon: "ℹ️" });
      return;
    }
    try {
      setSaving(true);
      const res = await api.put("/settings", updates);
      const map = {};
      for (const s of res.data.data.settings) map[s.key] = s.value || "";
      setSettings(map);
      const emptyForm = {};
      for (const key of Object.keys(map)) emptyForm[key] = "";
      setForm(emptyForm);
      setClickupStatus(null);
      toast.success("Configuracoes salvas.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar configuracoes.");
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
      toast.error(err.response?.data?.message || "ClickUp nao configurado ou token invalido.");
    } finally {
      setCheckingStatus(false);
    }
  }

  function toggleShow(key) {
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) return <p className="text-sm text-gray-300">Carregando...</p>;

  return (
    <div className="max-w-xl">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Configuracoes</h1>
        <p className="text-sm text-gray-300 mt-1">
          Tokens e parametros de integracao. Valores sensiveis sao armazenados no banco de dados.
        </p>
      </div>

      {/* ClickUp section */}
      <div className="bg-gray-700 border border-gray-500 rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Integracao ClickUp</h2>
            <p className="text-xs text-gray-300 mt-0.5">Configure o token e workspace para enviar relatorios</p>
          </div>

          <div className="flex items-center gap-2">
            {clickupStatus === "ok" && (
              <span className="text-xs text-green-300 bg-green-800/50 border border-green-700 px-2 py-1 rounded font-medium">
                Conectado
              </span>
            )}
            {clickupStatus === "error" && (
              <span className="text-xs text-red-300 bg-red-800/50 border border-red-700 px-2 py-1 rounded font-medium">
                Erro
              </span>
            )}
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-100 font-medium rounded px-3 py-1.5 transition-colors border border-gray-600"
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
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  {meta.label}
                </label>

                {currentMasked && (
                  <p className="text-xs text-gray-400 mb-1.5 font-mono bg-gray-800 px-2 py-1 rounded border border-gray-600">
                    Atual: {currentMasked}
                  </p>
                )}

                <div className="relative">
                  <input
                    type={meta.sensitive && !isVisible ? "password" : "text"}
                    value={form[key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={currentMasked ? "Deixe vazio para manter o atual" : meta.placeholder}
                    className="w-full bg-gray-700 border border-gray-500 text-gray-100 placeholder-gray-400 text-xs rounded px-3 py-2.5 focus:outline-none focus:border-blue-500 pr-16 font-mono"
                  />
                  {meta.sensitive && (
                    <button
                      type="button"
                      onClick={() => toggleShow(key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 hover:text-gray-200 transition-colors"
                    >
                      {isVisible ? "Ocultar" : "Mostrar"}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">{meta.description}</p>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded px-4 py-2.5 transition-colors"
            >
              {saving ? "Salvando..." : "Salvar configuracoes"}
            </button>
          </div>
        </form>
      </div>

      {/* Instruções */}
      <div className="bg-gray-700 border border-gray-500 rounded-lg p-4 text-xs text-gray-300 space-y-2">
        <p className="font-semibold text-gray-200">Como obter as informacoes do ClickUp:</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            <span className="font-medium text-gray-300">API Token:</span>{" "}
            ClickUp &rarr; Perfil &rarr; Apps &rarr; API Token
          </li>
          <li>
            <span className="font-medium text-gray-300">Workspace ID:</span>{" "}
            O numero na URL do ClickUp:{" "}
            <span className="font-mono text-gray-300">app.clickup.com/<strong>WORKSPACE_ID</strong>/...</span>
          </li>
          <li>
            <span className="font-medium text-gray-300">Assignee ID (opcional):</span>{" "}
            ID numerico do usuario no ClickUp
          </li>
        </ol>
      </div>
    </div>
  );
}
