/**
 * Página: Dashboard
 *
 * Mostra o relatório da semana selecionada.
 * Presets: Semana atual / Semana passada / Retrasada / Personalizado (por data).
 */

import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";
import { useLookups } from "../hooks/useLookups";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function getMondayOfRelativeWeek(offsetWeeks = 0) {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return toISO(monday);
}

const PRESETS = [
  { label: "Semana atual",   value: "current" },
  { label: "Semana passada", value: "last"    },
  { label: "Retrasada",      value: "before"  },
  { label: "Por data",       value: "custom"  },
];

const PRESET_OFFSET = { current: 0, last: -1, before: -2 };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const preset       = searchParams.get("preset") || "current";
  const dateParam    = searchParams.get("date")   || "";
  const statusFilter = searchParams.get("status") || "";
  const search       = searchParams.get("q")      || "";

  function setPreset(value) {
    setSearchParams((p) => { p.set("preset", value); if (value !== "custom") p.delete("date"); return p; }, { replace: true });
  }
  function setDate(value) {
    setSearchParams((p) => { p.set("date", value); p.set("preset", "custom"); return p; }, { replace: true });
  }
  function setStatusFilter(value) {
    setSearchParams((p) => { value ? p.set("status", value) : p.delete("status"); return p; }, { replace: true });
  }
  function setSearch(value) {
    setSearchParams((p) => { value ? p.set("q", value) : p.delete("q"); return p; }, { replace: true });
  }

  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { taskStatuses } = useLookups();

  function resolveDate() {
    if (preset === "custom") return dateParam || toISO(new Date());
    return getMondayOfRelativeWeek(PRESET_OFFSET[preset] ?? 0);
  }

  const isFirstRender = useRef(true);

  function fetchReport(date) {
    setLoading(true);
    const endpoint = date === getMondayOfRelativeWeek(0)
      ? "/reports/current"
      : `/reports/for-date?date=${date}`;

    api.get(endpoint)
      .then((res) => setReport(res?.data?.data?.report || null))
      .catch(() => toast.error("Erro ao carregar o relatorio."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (preset === "custom" && !dateParam) return;
    fetchReport(resolveDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, dateParam]);

  async function handleDownload() {
    if (!report) return;
    try {
      setGenerating(true);
      const res = await api.get(`/reports/${report.id}/markdown`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `relatorio-semana${report.week_number}-${report.year}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatorio gerado com sucesso.");
    } catch {
      toast.error("Erro ao gerar relatorio.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setReport((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));
      toast.success("Tarefa excluida.");
    } catch {
      toast.error("Erro ao excluir tarefa.");
    }
  }

  const filteredTasks = report?.tasks?.filter((task) => {
    const matchStatus = statusFilter ? task.taskStatus?.id === Number(statusFilter) : true;
    const q = search.trim().toLowerCase();
    const matchSearch = q
      ? task.title?.toLowerCase().includes(q) ||
        task.azure_ticket_id?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q)
      : true;
    return matchStatus && matchSearch;
  }) ?? [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">

      {/* ─── Cabeçalho com ação principal ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          {!loading && report && (
            <p className="text-sm text-gray-300 mt-1">
              Semana {report.week_number}/{report.year} — {report.start_date} ate {report.end_date}
              <span
                className={`ml-3 px-2 py-0.5 rounded text-xs font-medium ${
                  report.status === "open"
                    ? "bg-green-800/50 text-green-300"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {report.status === "open" ? "Em andamento" : "Fechado"}
              </span>
            </p>
          )}
        </div>

        {/* Ação principal: Gerar Relatório */}
        {report && (
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v8m0 0l-3 3m3-3l3 3" />
            </svg>
            {generating ? "Gerando..." : "Gerar Relatorio .md"}
          </button>
        )}
      </div>

      {/* ─── Filtro de semana ─────────────────────────────────────────────── */}
      <div className="bg-gray-700 border border-gray-500 rounded-lg px-4 py-3 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Semana</label>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  preset === p.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === "custom" && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Qualquer data da semana</label>
            <input
              type="date"
              value={dateParam}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Filtros inline */}
        <div className="ml-auto flex items-end gap-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-2 flex items-center text-gray-300 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar titulo, ticket..."
              className="bg-gray-700 border border-gray-500 text-gray-100 placeholder-gray-400 text-xs rounded pl-7 pr-3 py-2 w-48 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            {taskStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <Link
            to="/tasks/new"
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-3 py-2 rounded transition-colors"
          >
            + Nova tarefa
          </Link>
        </div>
      </div>

      {/* ─── Estado de carregamento ────────────────────────────────────────── */}
      {loading && (
        <p className="text-sm text-gray-300">Carregando...</p>
      )}

      {/* ─── Lista de tarefas ─────────────────────────────────────────────── */}
      {!loading && (!report || filteredTasks.length === 0) ? (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-300">
            {statusFilter || search
              ? "Nenhuma atividade corresponde ao filtro."
              : report
              ? "Nenhuma atividade registrada nesta semana."
              : preset === "custom" && !dateParam
              ? "Selecione uma data para ver a semana."
              : "Nenhum relatorio encontrado para esta semana."}
          </p>
          {!statusFilter && !search && preset === "current" && (
            <Link to="/tasks/new" className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-3 inline-block">
              Adicionar primeira tarefa
            </Link>
          )}
        </div>
      ) : !loading ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-700 border border-gray-500 hover:border-gray-600 rounded-lg px-4 py-3 flex items-start justify-between gap-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-white font-medium truncate">{task.title}</span>
                  {task.azure_ticket_id && (
                    <span className="text-xs text-blue-400 font-mono bg-blue-900/30 px-1.5 py-0.5 rounded">
                      #{task.azure_ticket_id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-300">{task.task_date}</span>
                  {task.activityType && (
                    <Badge label={task.activityType.name} color={task.activityType.color} />
                  )}
                  {task.taskStatus && (
                    <Badge label={task.taskStatus.name} color={task.taskStatus.color} />
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-300 mt-1.5 line-clamp-1">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to={`/tasks/${task.id}/edit`}
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
