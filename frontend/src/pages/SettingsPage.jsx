/**
 * Pagina: Configuracoes
 * Abas: ClickUp | Relatorio .md
 */

import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

// ─── Variaveis disponíveis para interpolação ──────────────────────────────────

const VARIABLES = [
  { key: "{{username}}",      desc: "Nome do colaborador"              },
  { key: "{{week_number}}",   desc: "Numero da semana ISO"             },
  { key: "{{year}}",          desc: "Ano"                              },
  { key: "{{period_start}}",  desc: "Data inicio formatada (DD/MM/YYYY)" },
  { key: "{{period_end}}",    desc: "Data fim formatada (DD/MM/YYYY)"    },
  { key: "{{total_tasks}}",   desc: "Total de atividades no periodo"   },
  { key: "{{total_tickets}}", desc: "Total de tickets no periodo"      },
  { key: "{{generated_at}}",  desc: "Data e hora de geracao"           },
];

// ─── Secoes do .md ────────────────────────────────────────────────────────────

const MD_SECTIONS = [
  {
    id: "title",
    label: "Titulo",
    icon: "H1",
    description: "Titulo principal do documento .md (heading H1).",
    fields: [
      {
        key: "md_report_title",
        label: "Titulo do relatorio",
        placeholder: "Relatorio Semanal — QA",
        hint: "Aparece na primeira linha do arquivo. Suporta variaveis.",
        multiline: false,
        vars: ["{{username}}", "{{week_number}}", "{{year}}"],
      },
    ],
  },
  {
    id: "header",
    label: "Informativo Geral",
    icon: "ℹ",
    description: "Cabecalho com dados do colaborador, periodo e texto extra.",
    fields: [
      {
        key: "md_verb",
        label: "Verbo de acao",
        placeholder: "Testado",
        hint: "Palavra que descreve o que foi feito. Ex: Testado, Desenvolvido.",
        multiline: false,
        vars: [],
      },
      {
        key: "md_header_extra",
        label: "Texto adicional no cabecalho (opcional)",
        placeholder: "Equipe: QA | Projeto: FrotaCerta",
        hint: "Exibido apos os dados de periodo. Suporta markdown e variaveis.",
        multiline: true,
        vars: ["{{username}}", "{{period_start}}", "{{period_end}}", "{{total_tasks}}", "{{total_tickets}}"],
      },
    ],
  },
  {
    id: "activities",
    label: "Atividades Realizadas",
    icon: "☑",
    description: "Secao que lista atividades agrupadas por data.",
    fields: [
      {
        key: "md_activity_section_title",
        label: "Titulo da secao",
        placeholder: "Atividades de Teste Realizadas",
        hint: "Aparece como heading H2 antes da listagem.",
        multiline: false,
        vars: ["{{period_start}}", "{{period_end}}", "{{total_tasks}}"],
      },
    ],
  },
  {
    id: "tickets",
    label: "Tickets do Periodo",
    icon: "#",
    description: "Tabela de tickets com azure_ticket_id registrados.",
    fields: [
      {
        key: "md_ticket_section_title",
        label: "Titulo da secao",
        placeholder: "Tickets Testados",
        hint: "Aparece como heading H2 antes da tabela de tickets.",
        multiline: false,
        vars: ["{{total_tickets}}", "{{period_start}}", "{{period_end}}"],
      },
    ],
  },
  {
    id: "footer",
    label: "Rodape",
    icon: "—",
    description: "Texto exibido no final do arquivo, apos o separador ---.",
    fields: [
      {
        key: "md_footer",
        label: "Texto do rodape",
        placeholder: "_Relatorio gerado automaticamente pelo sistema Weekly Reports._",
        hint: "Suporta markdown e variaveis. Vazio = texto padrao do sistema.",
        multiline: true,
        vars: ["{{username}}", "{{generated_at}}", "{{total_tasks}}", "{{total_tickets}}"],
      },
    ],
  },
];

// ─── Preview ao vivo ──────────────────────────────────────────────────────────

function resolve(text, username) {
  const today = new Date();
  const ctx = {
    username:      username || "gustavo.rg",
    week_number:   "23",
    year:          today.getFullYear().toString(),
    period_start:  "02/06/2026",
    period_end:    "06/06/2026",
    total_tasks:   "7",
    total_tickets: "4",
    generated_at:  today.toLocaleString("pt-BR"),
  };
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? `{{${k}}}`);
}

function MdPreview({ values, username }) {
  const r = (k, fb) => resolve(values[k] || fb, username);
  const title         = r("md_report_title",           "Relatorio Semanal");
  const headerExtra   = r("md_header_extra",           "");
  const verb          = r("md_verb",                   "Realizado");
  const activityTitle = r("md_activity_section_title", "Atividades Realizadas");
  const ticketTitle   = r("md_ticket_section_title",   "Tickets Trabalhados");
  const footer        = r("md_footer",                 "_Relatorio gerado automaticamente._");

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto select-text">
      <p className="text-blue-300 font-bold"># {title} — Semana 23/2026</p>
      <p className="text-gray-300 mt-1">&gt; **Colaborador:** {username || "gustavo.rg"}</p>
      <p className="text-gray-300">&gt; **Periodo:** 02/06/2026 a 06/06/2026</p>
      <p className="text-gray-300">&gt; **Gerado em:** {new Date().toLocaleString("pt-BR")}</p>
      {headerExtra && headerExtra.split(/\r?\n/).map((line, i) => (
        <p key={i} className="text-yellow-300 mt-1">&gt; {line}</p>
      ))}
      <p className="text-gray-500 mt-2">---</p>
      <p className="text-green-300 mt-2 font-bold">## {activityTitle}</p>
      <p className="text-gray-400 mt-1">### Terca-feira, 03 de junho de 2026</p>
      <p className="text-gray-300">- **[Teste]** {verb} hoje: Ticket #2804 — Correcao KM pneus <em>(Aprovado)</em></p>
      <p className="text-gray-500 mt-2">---</p>
      <p className="text-green-300 mt-2 font-bold">## {ticketTitle}</p>
      <p className="text-gray-300">| Ticket | Descricao | Data | Status |</p>
      <p className="text-gray-300">| `2804` | Correcao KM pneus | 2026-06-03 | Aprovado |</p>
      <p className="text-gray-500 mt-2">---</p>
      <p className="text-gray-400 mt-1 italic">{footer}</p>
    </div>
  );
}

// ─── Componente de indice de variaveis ───────────────────────────────────────

function VarIndex({ vars, onInsert }) {
  if (!vars || vars.length === 0) return null;
  return (
    <div className="mt-2 bg-gray-700/50 border border-gray-600 rounded p-2.5">
      <p className="text-xs font-semibold text-gray-300 mb-2">Variaveis disponiveis para este campo:</p>
      <div className="flex flex-wrap gap-1.5">
        {vars.map((v) => {
          const meta = VARIABLES.find((x) => x.key === v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onInsert(v)}
              title={meta?.desc || v}
              className="font-mono text-xs bg-gray-800 hover:bg-blue-700/50 border border-gray-600 hover:border-blue-500 text-blue-300 hover:text-blue-200 px-2 py-0.5 rounded transition-colors"
            >
              {v}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1.5">Clique para inserir no campo. Substituido pelo valor real ao gerar.</p>
    </div>
  );
}

// Indice completo de todas as variaveis (exibido como referencia no rodape da aba)
function FullVarReference() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-medium">Referencia de variaveis</span>
        <span className="text-gray-500 font-mono text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-600 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 font-semibold w-40">Variavel</th>
                <th className="pb-2 font-semibold">Descricao</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLES.map((v) => (
                <tr key={v.key} className="border-b border-gray-700/50 last:border-0">
                  <td className="py-1.5 font-mono text-blue-300">{v.key}</td>
                  <td className="py-1.5 text-gray-300">{v.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab]           = useState("clickup");
  const [activeMdSection, setActiveMdSection] = useState("title");
  const [settings, setSettings]             = useState({});
  const [form, setForm]                     = useState({});
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [showToken, setShowToken]           = useState(false);
  const [clickupStatus, setClickupStatus]   = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [username, setUsername]             = useState("");
  const fieldRefs = useRef({});

  useEffect(() => {
    fetchSettings();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsername(payload.username || payload.sub || "");
      }
    } catch {}
  }, []);

  async function fetchSettings() {
    try {
      const res = await api.get("/settings");
      const map = {};
      for (const s of res.data.data.settings) map[s.key] = s.value || "";
      setSettings(map);
      const emptyForm = {};
      for (const k of Object.keys(map)) emptyForm[k] = "";
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao carregar configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  const previewValues = { ...settings };
  for (const [k, v] of Object.entries(form)) {
    if (v.trim() !== "") previewValues[k] = v.trim();
  }

  async function handleSave(e) {
    e.preventDefault();
    const updates = {};
    for (const [key, value] of Object.entries(form)) {
      if (value.trim() !== "") updates[key] = value.trim();
    }
    if (Object.keys(updates).length === 0) {
      toast("Nenhum campo alterado.", { icon: "ℹ️" });
      return;
    }
    try {
      setSaving(true);
      const res = await api.put("/settings", updates);
      const map = {};
      for (const s of res.data.data.settings) map[s.key] = s.value || "";
      setSettings(map);
      const emptyForm = {};
      for (const k of Object.keys(map)) emptyForm[k] = "";
      setForm(emptyForm);
      toast.success("Configuracoes salvas.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar.");
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
      toast.success("ClickUp conectado.");
    } catch (err) {
      setClickupStatus("error");
      toast.error(err.response?.data?.message || "ClickUp nao configurado.");
    } finally {
      setCheckingStatus(false);
    }
  }

  // Insere variavel na posicao do cursor no campo
  function insertVar(fieldKey, variable) {
    const el = fieldRefs.current[fieldKey];
    if (!el) {
      setForm((p) => ({ ...p, [fieldKey]: (p[fieldKey] || settings[fieldKey] || "") + variable }));
      return;
    }
    const start = el.selectionStart ?? (el.value || "").length;
    const end   = el.selectionEnd   ?? start;
    const base  = form[fieldKey] !== undefined && form[fieldKey] !== ""
      ? form[fieldKey]
      : (settings[fieldKey] || "");
    const next  = base.slice(0, start) + variable + base.slice(end);
    setForm((p) => ({ ...p, [fieldKey]: next }));
    setTimeout(() => {
      el.focus();
      const pos = start + variable.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  if (loading) return <p className="text-sm text-gray-300">Carregando...</p>;

  const currentSection = MD_SECTIONS.find((s) => s.id === activeMdSection) || MD_SECTIONS[0];

  return (
    <div className="max-w-4xl">

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Configuracoes</h1>
        <p className="text-sm text-gray-300 mt-1">Integracao ClickUp e personalizacao do relatorio .md.</p>
      </div>

      {/* Abas principais */}
      <div className="flex gap-1 mb-5 border-b border-gray-600">
        {[
          { id: "clickup", label: "Integracao ClickUp" },
          { id: "md",      label: "Relatorio .md"      },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-blue-400 text-white bg-gray-800"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>

        {/* ═══ Aba ClickUp ══════════════════════════════════════════════════ */}
        {activeTab === "clickup" && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 space-y-5 max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Integracao ClickUp</h2>
                <p className="text-xs text-gray-300 mt-0.5">Token e workspace para enviar relatorios</p>
              </div>
              <div className="flex items-center gap-2">
                {clickupStatus === "ok" && (
                  <span className="text-xs text-green-300 bg-green-800/50 border border-green-700 px-2 py-1 rounded">Conectado</span>
                )}
                {clickupStatus === "error" && (
                  <span className="text-xs text-red-300 bg-red-800/50 border border-red-700 px-2 py-1 rounded">Erro</span>
                )}
                <button type="button" onClick={handleCheckStatus} disabled={checkingStatus}
                  className="text-xs bg-gray-700 hover:bg-gray-600 border border-gray-500 disabled:opacity-50 text-gray-100 rounded px-3 py-1.5 transition-colors">
                  {checkingStatus ? "Verificando..." : "Testar conexao"}
                </button>
              </div>
            </div>

            {[
              { key: "clickup_api_token",    label: "API Token",              placeholder: "pk_xxxxxxxxxxxx", sensitive: true,  hint: "Configuracoes > Apps > API Token no ClickUp" },
              { key: "clickup_workspace_id", label: "Workspace ID",           placeholder: "9011883050",      sensitive: false, hint: "Numero na URL: app.clickup.com/ID/..." },
              { key: "clickup_assignee_id",  label: "Assignee ID (opcional)", placeholder: "123456",          sensitive: false, hint: "ID numerico do usuario para atribuir tasks." },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-200 mb-1">{f.label}</label>
                {settings[f.key] && (
                  <p className="text-xs text-gray-400 font-mono bg-gray-700 border border-gray-600 rounded px-2 py-1 mb-1.5">
                    Atual: {settings[f.key]}
                  </p>
                )}
                <div className="relative">
                  <input
                    type={f.sensitive && !showToken ? "password" : "text"}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={settings[f.key] ? "Deixe vazio para manter" : f.placeholder}
                    className={`w-full bg-gray-700 border border-gray-500 text-gray-100 placeholder-gray-400 text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-400 font-mono ${f.sensitive ? "pr-16" : ""}`}
                  />
                  {f.sensitive && (
                    <button type="button" onClick={() => setShowToken((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200">
                      {showToken ? "Ocultar" : "Mostrar"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{f.hint}</p>
              </div>
            ))}

            <div className="pt-1">
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded px-4 py-2.5 transition-colors">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ Aba Relatorio .md ════════════════════════════════════════════ */}
        {activeTab === "md" && (
          <div className="grid grid-cols-[190px_1fr] gap-5">

            {/* Sidebar de secoes */}
            <div className="flex flex-col gap-0.5">
              {MD_SECTIONS.map((section) => (
                <button key={section.id} type="button" onClick={() => setActiveMdSection(section.id)}
                  className={`text-left px-3 py-2.5 rounded text-sm border-l-2 transition-colors ${
                    activeMdSection === section.id
                      ? "bg-blue-600/20 text-white border-blue-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white border-transparent"
                  }`}
                >
                  <span className="font-mono text-xs text-gray-500 mr-1.5">{section.icon}</span>
                  {section.label}
                </button>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-600">
                <button type="submit" disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded px-3 py-2 transition-colors">
                  {saving ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </div>
            </div>

            {/* Painel direito */}
            <div className="flex flex-col gap-4 min-w-0">

              {/* Campos da secao */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-white">{currentSection.label}</h2>
                  <p className="text-xs text-gray-300 mt-0.5">{currentSection.description}</p>
                </div>

                {currentSection.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-200 mb-1">{field.label}</label>
                    {settings[field.key] && (
                      <p className="text-xs text-gray-400 font-mono bg-gray-700 border border-gray-600 rounded px-2 py-1 mb-1.5 break-all">
                        Atual: {settings[field.key]}
                      </p>
                    )}
                    {field.multiline ? (
                      <textarea
                        ref={(el) => { fieldRefs.current[field.key] = el; }}
                        rows={3}
                        value={form[field.key] !== undefined && form[field.key] !== "" ? form[field.key] : (settings[field.key] || "")}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-700 border border-gray-500 text-gray-100 placeholder-gray-400 text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-400 resize-y font-mono"
                      />
                    ) : (
                      <input
                        ref={(el) => { fieldRefs.current[field.key] = el; }}
                        type="text"
                        value={form[field.key] !== undefined && form[field.key] !== "" ? form[field.key] : (settings[field.key] || "")}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-700 border border-gray-500 text-gray-100 placeholder-gray-400 text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
                      />
                    )}
                    <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                    <VarIndex vars={field.vars} onInsert={(v) => insertVar(field.key, v)} />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">Preview do .md</p>
                <MdPreview values={previewValues} username={username} />
                <p className="text-xs text-gray-500 mt-2">
                  Preview com dados de exemplo. As variaveis sao substituidas pelos valores reais ao gerar.
                </p>
              </div>

              {/* Referencia de variaveis colapsavel */}
              <FullVarReference />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
