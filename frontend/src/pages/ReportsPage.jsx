/**
 * Página: Histórico de relatórios semanais
 *
 * Lista todas as semanas com contagem de tarefas e opções de visualização/download.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

const PRESETS = [
  { label: "Semana atual",    value: "current"  },
  { label: "Semana passada",  value: "last"     },
  { label: "Retrasada",       value: "before"   },
  { label: "Personalizado",   value: "custom"   },
];


export default function ReportsPage() {
  const [preset, setPreset]   = useState("current");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get("/reports")
      .then((res) => setReports(res.data.data.reports))
      .catch(() => toast.error("Erro ao carregar relatorios."))
      .finally(() => setLoading(false));
  }, []);

  // Quando um preset e selecionado, calcula e preenche o range automaticamente
  useEffect(() => {
    if (preset === "custom") return;

    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7; // dias ate a segunda da semana atual

    function toISO(d) {
      return d.toISOString().slice(0, 10);
    }

    function getWeekRange(weeksBack) {
      const monday = new Date(today);
      monday.setDate(today.getDate() - mondayOffset - weeksBack * 7);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: toISO(monday), to: toISO(sunday) };
    }

    if (preset === "current") setRange(getWeekRange(0));
    if (preset === "last")    setRange(getWeekRange(1));
    if (preset === "before")  setRange(getWeekRange(2));
  }, [preset]);

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

  async function handleDownloadForPeriod() {
    if (!range.from || !range.to) {
      toast.error("Selecione as datas de inicio e fim.");
      return;
    }
    if (range.from > range.to) {
      toast.error("A data de inicio nao pode ser posterior ao fim.");
      return;
    }
    try {
      setDownloading(true);
      const res = await api.get(`/reports/period`, {
        params: { dataInicio: range.from, dataFim: range.to },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `relatorio-periodo-${range.from}-${range.to}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatorio baixado.");
    } catch {
      toast.error("Erro ao gerar relatorio de periodo.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-gray-100 mb-6">Historico de relatorios</h1>

      {/* ─── Filtro por periodo ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-500 rounded-lg px-4 py-3 mb-6 flex flex-wrap items-end gap-3">
      {/* Presets */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Periodo</label>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPreset(p.value); console.log(p.value); }}
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

        <div>
          <label className="block text-xs text-gray-400 mb-1">De</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, from: e.target.value })); }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-2 focus:outline-none focus:border-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Ate</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, to: e.target.value })); }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-2 focus:outline-none focus:border-gray-500"
          />
        </div>
        <button
          onClick={handleDownloadForPeriod}
          disabled={downloading}
          className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded px-3 py-2 transition-colors"
        >
          {downloading ? "Gerando..." : "Baixar periodo .md"}
        </button>
      </div>

      {/* ─── Lista de relatorios semanais ───────────────────────────────────── */}
      {reports.length === 0 ? (
        <div className="border border-dashed border-gray-500 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-600">Nenhum relatorio ainda.</p>
          <Link to="/tasks/new" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
            Adicionar primeira tarefa
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-900 border border-gray-500 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
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
