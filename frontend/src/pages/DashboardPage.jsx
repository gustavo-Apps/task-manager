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
  const typeFilter   = searchParams.get("type")   || "";
  const search       = searchParams.get("q")      || "";
  const sortCol      = searchParams.get("sort")   || "task_date";
  const sortDir      = searchParams.get("dir")    || "asc";

  function setPreset(value) {
    setSearchParams((p) => { p.set("preset", value); if (value !== "custom") p.delete("date"); return p; }, { replace: true });
  }
  function setDate(value) {
    setSearchParams((p) => { p.set("date", value); p.set("preset", "custom"); return p; }, { replace: true });
  }
  function setStatusFilter(value) {
    setSearchParams((p) => { value ? p.set("status", value) : p.delete("status"); return p; }, { replace: true });
  }
  function setTypeFilter(value) {
    setSearchParams((p) => { value ? p.set("type", value) : p.delete("type"); return p; }, { replace: true });
  }
  function setSearch(value) {
    setSearchParams((p) => { value ? p.set("q", value) : p.delete("q"); return p; }, { replace: true });
  }
  function handleSort(col) {
    setSearchParams((p) => {
      if (p.get("sort") === col) {
        p.set("dir", p.get("dir") === "asc" ? "desc" : "asc");
      } else {
        p.set("sort", col);
        p.set("dir", "asc");
      }
      return p;
    }, { replace: true });
  }
  function SortBtn({ col, label }) {
    const active = sortCol === col;
    return (
      <button
        onClick={() => handleSort(col)}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors select-none ${
          active
            ? "bg-gray-600 text-white"
            : "bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600"
        }`}
      >
        {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
      </button>
    );
  }

  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { taskStatuses, activityTypes } = useLookups();

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

  async function handleStatusChange(taskId, value) {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { task_status_id: Number(value) });
      const updated = res?.data?.data?.task;
      setReport((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
      toast.success("Status atualizado.");
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  async function handleDuplicateTask(taskId) {
    try {
      const res = await api.post(`/tasks/${taskId}/duplicate`);
      const newTask = res?.data?.data?.task;
      setReport((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
      toast.success("Tarefa duplicada.");
    } catch {
      toast.error("Erro ao duplicar tarefa.");
    }
  }

  function getSortedTasks(tasks) {
    return [...tasks].sort((a, b) => {
      let aVal, bVal;
      if (sortCol === "task_date") {
        aVal = a.task_date ?? "";
        bVal = b.task_date ?? "";
      } else if (sortCol === "azure_ticket_id") {
        if (!a.azure_ticket_id && !b.azure_ticket_id) return 0;
        if (!a.azure_ticket_id) return 1;
        if (!b.azure_ticket_id) return -1;
        aVal = a.azure_ticket_id;
        bVal = b.azure_ticket_id;
      } else if (sortCol === "tipo") {
        aVal = a.activityType?.name ?? "";
        bVal = b.activityType?.name ?? "";
      } else if (sortCol === "status") {
        aVal = a.taskStatus?.name ?? "";
        bVal = b.taskStatus?.name ?? "";
      } else {
        return 0;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const filteredTasks = report?.tasks?.filter((task) => {
    const matchStatus = statusFilter ? task.taskStatus?.id === Number(statusFilter) : true;
    const matchType   = typeFilter   ? task.activityType?.id === Number(typeFilter)  : true;
    const q = search.trim().toLowerCase();
    const matchSearch = q
      ? task.title?.toLowerCase().includes(q) ||
        task.azure_ticket_id?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q)
      : true;
    return matchStatus && matchType && matchSearch;
  }) ?? [];

  const sortedTasks = getSortedTasks(filteredTasks);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">

      {/* ─── Cabeçalho com ação principal ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          {!loading && report && (
            <p className="text-sm text-gray-300 mt-1 flex items-center gap-2 flex-wrap">
              Semana {report.week_number}/{report.year} — {report.start_date} ate {report.end_date}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                report.status === "open" ? "bg-green-800/50 text-green-300" : "bg-gray-700 text-gray-300"
              }`}>
                {report.status === "open" ? "Em andamento" : "Fechado"}
              </span>
              {preset === "current" && (
                <span className="bg-blue-800/50 text-blue-300 border border-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                  Semana atual
                </span>
              )}
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os tipos</option>
            {activityTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
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
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-600 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-600 rounded w-16" />
                  <div className="h-3 bg-gray-600 rounded w-20" />
                  <div className="h-3 bg-gray-600 rounded w-14" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-3 bg-gray-600 rounded w-10" />
                <div className="h-3 bg-gray-600 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Lista de tarefas ─────────────────────────────────────────────── */}
      {!loading && (!report || filteredTasks.length === 0) ? (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-300">
            {statusFilter || typeFilter || search
              ? "Nenhuma atividade corresponde ao filtro."
              : report
              ? "Nenhuma atividade registrada nesta semana."
              : preset === "custom" && !dateParam
              ? "Selecione uma data para ver a semana."
              : "Nenhum relatorio encontrado para esta semana."}
          </p>
          {!statusFilter && !typeFilter && !search && preset === "current" && (
            <Link to="/tasks/new" className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-3 inline-block">
              Adicionar primeira tarefa
            </Link>
          )}
        </div>
      ) : !loading ? (
        <div className="space-y-2">
          {/* Barra de ordenacao */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-xs text-gray-500 mr-1">Ordenar:</span>
            <SortBtn col="task_date" label="Data" />
            <SortBtn col="tipo" label="Tipo" />
            <SortBtn col="status" label="Status" />
            <SortBtn col="azure_ticket_id" label="Ticket" />
          </div>
          {sortedTasks.map((task) => (
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
                  <select
                    value={task.taskStatus?.id ?? ""}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 px-1 py-0.5 focus:outline-none focus:border-blue-500"
                  >
                    {taskStatuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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
                  onClick={() => handleDuplicateTask(task.id)}
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  Duplicar
                </button>
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
