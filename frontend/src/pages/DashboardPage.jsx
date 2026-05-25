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

export default function DashboardPage() {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  return (
    <div className="max-w-3xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">
            {report
              ? `Semana ${report.week_number}/${report.year}`
              : "Nenhuma atividade ainda"}
          </h1>
          {report && (
            <p className="text-xs text-gray-500 mt-1">
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

        <div className="flex gap-2">
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
      {!report || report.tasks.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-600">Nenhuma atividade registrada nesta semana.</p>
          <Link to="/tasks/new" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
            Adicionar primeira tarefa
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {report.tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-200 font-medium truncate">{task.title}</span>
                  {task.azure_ticket_id && (
                    <span className="text-xs text-gray-500 font-mono">#{task.azure_ticket_id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-600">{task.task_date}</span>
                  {task.activityType && (
                    <Badge label={task.activityType.name} color={task.activityType.color} />
                  )}
                  {task.taskStatus && (
                    <Badge label={task.taskStatus.name} color={task.taskStatus.color} />
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                )}
              </div>

              <Link
                to={`/tasks/${task.id}/edit`}
                className="text-xs text-gray-600 hover:text-gray-300 shrink-0 transition-colors"
              >
                Editar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
