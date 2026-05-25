/**
 * Página: Histórico de relatórios semanais
 *
 * Lista todas as semanas com contagem de tarefas e opções de visualização/download.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports")
      .then((res) => setReports(res.data.data.reports))
      .catch(() => toast.error("Erro ao carregar relatorios."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(report) {
    try {
      const res = await api.get(`/reports/${report.id}/markdown`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `relatorio-semana${report.week_number}-${report.year}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatorio baixado.");
    } catch {
      toast.error("Erro ao gerar relatorio.");
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-100 mb-6">Historico de relatorios</h1>

      {reports.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-600">Nenhum relatorio ainda.</p>
          <Link to="/tasks/new" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
            Adicionar primeira tarefa
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-sm text-gray-200 font-medium">
                  Semana {report.week_number}/{report.year}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {report.start_date} ate {report.end_date}
                  <span className="ml-2 text-gray-600">
                    {report.tasks?.length ?? 0} atividade(s)
                  </span>
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      report.status === "open"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {report.status === "open" ? "Aberto" : "Fechado"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/reports/${report.id}`}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Ver
                </Link>
                <button
                  onClick={() => handleDownload(report)}
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  .md
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
