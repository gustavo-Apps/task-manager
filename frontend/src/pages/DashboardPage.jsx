/**
 * Página: Dashboard
 *
 * Mostra o relatório da semana atual com todas as tarefas do usuário.
 * Link rápido para adicionar nova tarefa e gerar o Markdown.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";
import { useLookups } from "../hooks/useLookups";

export default function DashboardPage() {
  const [report, setReport]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]             = useState("");

  const { taskStatuses } = useLookups();

  useEffect(() => {
    // Busca o relatório mais recente (semana atual, se existir)
    api.get("/reports")
      .then((res) => {
        const reports = res.data.data.reports;
        if (reports.length > 0) {
          // O primeiro é sempre o mais recente (ORDER BY year DESC, week_number DESC)
          return api.get(`/reports/${reports[0].id}`);
        }
        return null;
      })
      .then((res) => setReport(res?.data?.data?.report || null))
      .catch(() => toast.error("Erro ao carregar o relatorio."))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
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

  return (
    <div className="max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">
            {report
              ? `Semana ${report.week_number}/${report.year}`
              : "Nenhuma atividade ainda"}
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
        </div>

        <div className="flex items-center gap-2">
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

      {/* Lista de tarefas */}
      {!report || filteredTasks.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-600">
            {statusFilter
              ? "Nenhuma atividade com este status nesta semana."
              : "Nenhuma atividade registrada nesta semana."}
          </p>
          {!statusFilter && (
            <Link to="/tasks/new" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
              Adicionar primeira tarefa
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2 ">
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
      )}
    </div>
  );
}
