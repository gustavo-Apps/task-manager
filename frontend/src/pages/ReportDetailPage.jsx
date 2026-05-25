/**
 * Página: detalhe de um relatório semanal.
 * Lista todas as tarefas com filtro por status e tipo.
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then((res) => setReport(res.data.data.report))
      .catch(() => toast.error("Relatorio nao encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    try {
      const res = await api.get(`/reports/${id}/markdown`, { responseType: "blob" });
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

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;
  if (!report)  return <p className="text-sm text-red-500">Relatorio nao encontrado.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/reports" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Voltar
          </Link>
          <h1 className="text-lg font-semibold text-gray-100 mt-1">
            Semana {report.week_number}/{report.year}
          </h1>
          <p className="text-xs text-gray-500">
            {report.start_date} ate {report.end_date}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-3 py-2 rounded transition-colors"
        >
          Gerar .md
        </button>
      </div>

      {report.tasks.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhuma atividade registrada.</p>
      ) : (
        <div className="space-y-2">
          {report.tasks.map((task) => (
            <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-200 font-medium">{task.title}</span>
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
                    <p className="text-xs text-gray-500 mt-2">{task.description}</p>
                  )}
                  {task.discord_link && (
                    <a
                      href={task.discord_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      Ver no Discord
                    </a>
                  )}
                </div>
                <Link
                  to={`/tasks/${task.id}/edit`}
                  className="text-xs text-gray-600 hover:text-gray-300 shrink-0 transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
