/**
 * Página: detalhe de um relatório semanal.
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";
import { generatePdf } from "../lib/generatePdf";

function formatDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [closing, setClosing] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then((res) => setReport(res.data.data.report))
      .catch(() => toast.error("Relatorio nao encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleClose() {
    if (!window.confirm("Fechar este relatorio? Ele nao podera mais receber novas tarefas.")) return;
    try {
      setClosing(true);
      const res = await api.post(`/reports/${id}/close`);
      setReport(res.data.data.report);
      toast.success("Relatorio fechado. Webhooks configurados foram notificados automaticamente.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao fechar relatorio.");
    } finally {
      setClosing(false);
    }
  }

  async function handleNotify() {
    if (!window.confirm(
      "Enviar webhook agora?\n\nIsso disparara uma notificacao para todos os seus webhooks ativos com os dados deste relatorio."
    )) return;
    try {
      setNotifying(true);
      const res = await api.post(`/reports/${id}/notify`);
      const { sent, failed, message } = res.data.data;
      if (failed > 0) {
        toast.error(message);
      } else {
        toast.success(message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao enviar webhook.");
    } finally {
      setNotifying(false);
    }
  }

  async function handleExportPdf() {
    try {
      setExportingPdf(true);
      await generatePdf(report);
      toast.success("PDF exportado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

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

  if (loading) return <p className="text-sm text-gray-300">Carregando...</p>;
  if (!report)  return <p className="text-sm text-red-400">Relatorio nao encontrado.</p>;

  return (
    <div className="max-w-3xl">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/reports" className="text-xs text-gray-300 hover:text-gray-200 transition-colors flex items-center gap-1 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-xl font-bold text-white">
            Semana {report.week_number}/{report.year}
          </h1>
          <p className="text-sm text-gray-300 mt-0.5">
            {formatDateBR(report.start_date)} ate {formatDateBR(report.end_date)}
            <span className="ml-2 text-gray-400">{report.tasks.length} atividade(s)</span>
          </p>
        </div>
        <div className="flex gap-2">
          {report.status === "open" && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 border border-gray-500 text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {closing ? "Fechando..." : "Fechar Relatorio"}
            </button>
          )}
          <button
            onClick={handleNotify}
            disabled={notifying}
            title="Dispara manualmente o webhook para todos os seus destinos ativos"
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 border border-gray-500 text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifying ? "Enviando..." : "Enviar Webhook"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v8m0 0l-3 3m3-3l3 3" />
            </svg>
            {generating ? "Gerando..." : "Gerar .md"}
          </button>
        </div>
      </div>

      {/* Lista */}
      {report.tasks.length === 0 ? (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-300">Nenhuma atividade registrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {report.tasks.map((task) => (
            <div key={task.id} className="bg-gray-700 border border-gray-500 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors">
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
                    <span className="text-xs text-gray-300">{formatDateBR(task.task_date)}</span>
                    {task.activityType && (
                      <Badge label={task.activityType.name} color={task.activityType.color} />
                    )}
                    {task.taskStatus && (
                      <Badge label={task.taskStatus.name} color={task.taskStatus.color} />
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-300 mt-2">{task.description}</p>
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
