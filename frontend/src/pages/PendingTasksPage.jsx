/**
 * Página: Tarefas Pendentes
 *
 * Lista todas as tarefas do usuário com status != Concluído,
 * em todas as semanas. Mesmos dados e ações do Dashboard.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";
import { useLookups } from "../hooks/useLookups";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PendingTasksPage() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [search,       setSearch]       = useState("");
  const [sortCol,      setSortCol]      = useState("task_date");
  const [sortDir,      setSortDir]      = useState("desc");

  const { taskStatuses, activityTypes } = useLookups();

  // ─── Carga inicial ───────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    api.get("/tasks/pending")
      .then((res) => setTasks(res?.data?.data?.tasks ?? []))
      .catch(() => toast.error("Erro ao carregar tarefas pendentes."))
      .finally(() => setLoading(false));
  }, []);

  // ─── Ações inline ────────────────────────────────────────────────────────

  async function handleStatusChange(taskId, value) {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { task_status_id: Number(value) });
      const updated = res?.data?.data?.task;

      // Se o novo status for "Concluido", remove da lista de pendentes
      const doneStatus = taskStatuses.find(
        (s) => s.name.toLowerCase() === "concluido" || s.name.toLowerCase() === "concluído"
      );
      if (doneStatus && Number(value) === doneStatus.id) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success("Tarefa concluída e removida da lista.");
      } else {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        toast.success("Status atualizado.");
      }
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Tarefa excluída.");
    } catch {
      toast.error("Erro ao excluir tarefa.");
    }
  }

  async function handleDuplicateTask(taskId) {
    try {
      const res = await api.post(`/tasks/${taskId}/duplicate`);
      const newTask = res?.data?.data?.task;
      setTasks((prev) => [...prev, newTask]);
      toast.success("Tarefa duplicada.");
    } catch {
      toast.error("Erro ao duplicar tarefa.");
    }
  }

  // ─── Ordenação ───────────────────────────────────────────────────────────

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
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

  // ─── Filtro + ordenação ──────────────────────────────────────────────────

  const filtered = tasks.filter((task) => {
    const matchStatus = statusFilter ? task.taskStatus?.id === Number(statusFilter) : true;
    const matchType   = typeFilter   ? task.activityType?.id === Number(typeFilter)  : true;
    const q = search.trim().toLowerCase();
    const matchSearch = q
      ? task.title?.toLowerCase().includes(q) ||
        task.azure_ticket_id?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q)
      : true;
    return matchStatus && matchType && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    if (sortCol === "task_date") {
      aVal = a.task_date ?? "";
      bVal = b.task_date ?? "";
    } else if (sortCol === "semana") {
      aVal = `${a.weeklyReport?.year ?? 0}-${String(a.weeklyReport?.week_number ?? 0).padStart(2, "0")}`;
      bVal = `${b.weeklyReport?.year ?? 0}-${String(b.weeklyReport?.week_number ?? 0).padStart(2, "0")}`;
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

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Tarefas Pendentes</h1>
          {!loading && (
            <p className="text-sm text-gray-300 mt-1">
              {sorted.length} tarefa{sorted.length !== 1 ? "s" : ""} pendente{sorted.length !== 1 ? "s" : ""} em todas as semanas
            </p>
          )}
        </div>

        <Link
          to="/tasks/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg"
        >
          + Nova tarefa
        </Link>
      </div>

      {/* Barra de filtros */}
      <div className="bg-gray-700 border border-gray-500 rounded-lg px-4 py-3 mb-5 flex flex-wrap items-end gap-3">
        {/* Busca */}
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

        {/* Filtro de status (sem "Concluído" pois a lista já exclui) */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos os status</option>
          {taskStatuses
            .filter((s) => s.name.toLowerCase() !== "concluido" && s.name.toLowerCase() !== "concluído")
            .map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </select>

        {/* Filtro de tipo */}
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
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
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

      {/* Estado vazio */}
      {!loading && sorted.length === 0 && (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-300">
            {statusFilter || typeFilter || search
              ? "Nenhuma tarefa corresponde ao filtro."
              : "Nenhuma tarefa pendente. Tudo em dia!"}
          </p>
          {!statusFilter && !typeFilter && !search && (
            <Link to="/tasks/new" className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-3 inline-block">
              Adicionar tarefa
            </Link>
          )}
        </div>
      )}

      {/* Lista */}
      {!loading && sorted.length > 0 && (
        <div className="space-y-2">
          {/* Barra de ordenação */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-xs text-gray-500 mr-1">Ordenar:</span>
            <SortBtn col="task_date"       label="Data"   />
            <SortBtn col="semana"          label="Semana" />
            <SortBtn col="tipo"            label="Tipo"   />
            <SortBtn col="status"          label="Status" />
            <SortBtn col="azure_ticket_id" label="Ticket" />
          </div>

          {sorted.map((task) => (
            <div
              key={task.id}
              className="bg-gray-700 border border-gray-500 hover:border-gray-400 rounded-lg px-4 py-3 flex items-start justify-between gap-4 transition-colors"
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
                  {task.weeklyReport && (
                    <span className="text-xs text-gray-400">
                      Sem {task.weeklyReport.week_number}/{task.weeklyReport.year}
                    </span>
                  )}
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
      )}
    </div>
  );
}
