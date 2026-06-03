/**
 * Página: detalhe de um relatório semanal.
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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then((res) => setReport(res.data.data.report))
      .catch(() => toast.error("Relatorio nao encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    try {
      setGenerating(true);
      const res = await api.get(`/reports/${id}/markdown`, { responseType: "blob" });
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

  if (loading) return <p className="text-sm text-gray-400">Carregando...</p>;
  if (!report)  return <p className="text-sm text-red-400">Relatorio nao encontrado.</p>;

  return (
    <div className="max-w-3xl">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/reports" className="text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-xl font-bold text-white">
            Semana {report.week_number}/{report.year}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {report.start_date} ate {report.end_date}
            <span className="ml-2 text-gray-500">{report.tasks.length} atividade(s)</span>
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
          </svg>
          {generating ? "Gerando..." : "Gerar .md"}
        </button>
      </div>

      {/* Lista */}
      {report.tasks.length === 0 ? (
        <div className="border border-dashed border-gray-700 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-400">Nenhuma atividade registrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {report.tasks.map((task) => (
            <div key={task.id} className="bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white font-medium">{task.title}</span>
                    {task.azure_ticket_id && (
                      <span className="text-xs text-blue-400 font-mono bg-blue-900/30 px-1.5 py-0.5 rounded">
                        #{task.azure_ticket_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-400">{task.task_date}</span>
                    {task.activityType && (
                      <Badge label={task.activityType.name} color={task.activityType.color} />
                    )}
                    {task.taskStatus && (
                      <Badge label={task.taskStatus.name} color={task.taskStatus.color} />
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-400 mt-2">{task.description}</p>
                  )}
                  {task.discord_link && (
                    <a
                      href={task.discord_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1.5 inline-block"
                    >
                      Ver no Discord
                    </a>
                  )}
                </div>
                <Link
                  to={`/tasks/${task.id}/edit`}
                  className="text-xs text-gray-300 hover:text-white shrink-0 transition-colors"
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
