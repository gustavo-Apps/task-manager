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

/** Segunda-feira da semana relativa (0 = atual, -1 = anterior, ...) */
function getMondayOfRelativeWeek(offsetWeeks = 0) {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7; // 0=seg, 6=dom
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

  // Preset e data persistidos na URL
  const preset     = searchParams.get("preset") || "current";
  const dateParam  = searchParams.get("date")   || "";
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
  const { taskStatuses } = useLookups();

  // Resolve qual data usar para o endpoint
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

  // Busca ao montar e ao mudar preset/data
  useEffect(() => {
    if (preset === "custom" && !dateParam) return; // aguarda o usuário digitar uma data
    fetchReport(resolveDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, dateParam]);

  async function handleDownload() {
    if (!report) return;
    try {
      const res = await api.get(`/reports/${report.id}/markdown`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `relatorio-semana${report.week_number}-${report.year}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatorio gerado.");
    } catch {
      toast.error("Erro ao gerar relatorio.");
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

  // ─── Filtragem local ────────────────────────────────────────────────────────

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

      {/* ─── Filtro de semana ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-500 rounded-lg px-4 py-3 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Semana</label>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  preset === p.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input de data — visível só no modo custom */}
        {preset === "custom" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Qualquer data da semana</label>
            <input
              type="date"
              value={dateParam}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-2 focus:outline-none focus:border-gray-500"
            />
          </div>
        )}
      </div>

      {/* ─── Cabeçalho ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-gray-100">
                {report
                  ? `Semana ${report.week_number}/${report.year}`
                  : "Nenhuma atividade nesta semana"}
              </h1>
              {report && (
                <p className="text-xs text-gray-400 mt-1">
                  {report.start_date} ate {report.end_date}
                  <span
                    className={`ml-3 px-2 py-0.5 rounded text-xs ${
                      report.status === "open"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {report.status === "open" ? "Em andamento" : "Fechado"}
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Ações + filtros */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Busca */}
          <div className="relative">
            <span className="absolute inset-y-0 left-2 flex items-center text-gray-500 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por titulo, ticket..."
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded pl-7 pr-3 py-2 w-52 focus:outline-none focus:border-gray-500 placeholder-gray-600"
            />
          </div>

          {/* Filtro por status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">Todos os status</option>
            {taskStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <Link
            to="/tasks/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded transition-colors"
          >
            Nova tarefa
          </Link>
          {report && (
            <button
              onClick={handleDownload}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-3 py-2 rounded transition-colors"
            >
              Gerar .md
            </button>
          )}
        </div>
      </div>

      {/* ─── Lista de tarefas ─────────────────────────────────────────────── */}
      {!loading && (!report || filteredTasks.length === 0) ? (
        <div className="border border-dashed border-gray-800 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-600">
            {statusFilter || search
              ? "Nenhuma atividade corresponde ao filtro."
              : report
              ? "Nenhuma atividade registrada nesta semana."
              : preset === "custom" && !dateParam
              ? "Selecione uma data para ver a semana."
              : "Nenhum relatorio encontrado para esta semana."}
          </p>
          {!statusFilter && !search && preset === "current" && (
            <Link to="/tasks/new" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
              Adicionar primeira tarefa
            </Link>
          )}
        </div>
      ) : !loading ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-900 border border-gray-500 rounded-lg px-4 py-3 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-white-200 font-medium truncate">{task.title}</span>
                  {task.azure_ticket_id && (
                    <span className="text-xs text-white-500 font-mono">#{task.azure_ticket_id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-white-600">{task.task_date}</span>
                  {task.activityType && (
                    <Badge label={task.activityType.name} color={task.activityType.color} />
                  )}
                  {task.taskStatus && (
                    <Badge label={task.taskStatus.name} color={task.taskStatus.color} />
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1">{task.description}</p>
                )}
              </div>

              <Link
                to={`/tasks/${task.id}/edit`}
                className="text-xs text-gray-200 hover:text-gray-300 shrink-0 transition-colors"
              >
                Editar
              </Link>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-xs text-gray-200 hover:text-gray-300 shrink-0 transition-colors"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
