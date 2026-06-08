/**
 * Página: Histórico de relatórios semanais
 */

import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { generatePdf } from "../lib/generatePdf";

const PRESETS = [
  { label: "Semana atual",   value: "current" },
  { label: "Semana passada", value: "last"    },
  { label: "Retrasada",      value: "before"  },
  { label: "Personalizado",  value: "custom"  },
];

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const preset = searchParams.get("preset") || "current";
  const range  = {
    from: searchParams.get("from") || "",
    to:   searchParams.get("to")   || "",
  };

  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [downloading, setDownloading]       = useState(false);
  const [exportingPdf, setExportingPdf]     = useState(null);
  const [sendingClickUp, setSendingClickUp] = useState(null);
  const [notifying, setNotifying]           = useState(null); // report.id em progresso
  const [page, setPage]                     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [total, setTotal]                 = useState(0);

  const isFirstRender = useRef(true);

  function applyPreset(value) {
    setSearchParams((p) => { p.set("preset", value); return p; }, { replace: true });
  }

  function updateRange(partial) {
    setSearchParams((p) => {
      if (partial.from !== undefined) p.set("from", partial.from);
      if (partial.to   !== undefined) p.set("to",   partial.to);
      p.set("preset", "custom");
      return p;
    }, { replace: true });
  }
  useEffect(() => {
    setLoading(true);
    api.get(`/reports?page=${page}&limit=20`)
      .then((res) => {
        const d = res.data.data;
        setReports(d.reports);
        setTotal(d.total ?? d.reports.length);
        setTotalPages(d.totalPages ?? 1);
      })
      .catch(() => toast.error("Erro ao carregar relatorios."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (preset === "custom") return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (range.from && range.to) return;
    }

    const today        = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    function toISO(d)  { return d.toISOString().slice(0, 10); }
    function getWeekRange(weeksBack) {
      const monday = new Date(today);
      monday.setDate(today.getDate() - mondayOffset - weeksBack * 7);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: toISO(monday), to: toISO(sunday) };
    }

    const computed =
      preset === "current" ? getWeekRange(0) :
      preset === "last"    ? getWeekRange(1) :
      preset === "before"  ? getWeekRange(2) : null;
    if (!computed) return;

    setSearchParams((p) => {
      p.set("from",   computed.from);
      p.set("to",     computed.to);
      p.set("preset", preset);
      return p;
    }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  async function handleExportPdf(report) {
    try {
      setExportingPdf(report.id);
      // Busca dados completos (com tasks) caso a listagem nao os inclua
      const res  = await api.get(`/reports/${report.id}`);
      const full = res.data.data.report;
      await generatePdf(full);
      toast.success("PDF exportado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setExportingPdf(null);
    }
  }

  async function handleNotify(report) {
    if (!window.confirm(
      `Enviar webhook para "Semana ${report.week_number}/${report.year}"?\n\nIsso disparara uma notificacao para todos os seus webhooks ativos.`
    )) return;
    try {
      setNotifying(report.id);
      const res = await api.post(`/reports/${report.id}/notify`);
      const { sent, failed, message } = res.data.data;
      if (failed > 0) {
        toast.error(message);
      } else {
        toast.success(message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao enviar webhook.");
    } finally {
      setNotifying(null);
    }
  }

  async function handleSendClickUp(report) {
    try {
      setSendingClickUp(report.id);
      const statusRes = await api.get(`/clickup/reports/${report.id}`);
      const { exists } = statusRes.data.data;

      let overwrite = false;
      if (exists) {
        const confirmed = window.confirm(
          `Este relatorio ja foi enviado ao ClickUp.\n\nDeseja sobrescrever o Doc existente?`
        );
        if (!confirmed) { setSendingClickUp(null); return; }
        overwrite = true;
      }

      const res = await api.post(`/clickup/reports/${report.id}`, { overwrite });
      const { doc, message } = res.data.data;
      toast.success(message);
      if (doc.docUrl) window.open(doc.docUrl, "_blank", "noopener");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao enviar para o ClickUp.");
    } finally {
      setSendingClickUp(null);
    }
  }

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
    if (!range.from || !range.to) { toast.error("Selecione as datas de inicio e fim."); return; }
    if (range.from > range.to)    { toast.error("Data de inicio nao pode ser posterior ao fim."); return; }
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

  if (loading) return (
    <div className="max-w-3xl">
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map((i) => (
          <div key={i} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-600 rounded w-40" />
                <div className="h-3 bg-gray-600 rounded w-56" />
              </div>
              <div className="flex gap-2">
                <div className="h-7 bg-gray-600 rounded w-24" />
                <div className="h-7 bg-gray-600 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Historico de Relatorios</h1>
        <p className="text-sm text-gray-300 mt-1">{total} semana(s) registrada(s)</p>
      </div>

      {/* Filtro por período */}
      <div className="bg-gray-700 border border-gray-500 rounded-lg px-4 py-3 mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Relatorio por Semana / Periodo</label>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
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

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">De</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => updateRange({ from: e.target.value })}
            className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Ate</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => updateRange({ to: e.target.value })}
            className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleDownloadForPeriod}
          disabled={downloading}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded px-3 py-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
          </svg>
          {downloading ? "Gerando..." : "Baixar periodo .md"}
        </button>
      </div>

      {/* Lista de relatórios */}
      {reports.length === 0 ? (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-300">Nenhum relatorio ainda.</p>
          <Link to="/tasks/new" className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-3 inline-block">
            Adicionar primeira tarefa
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-700 border border-gray-500 hover:border-gray-600 rounded-lg px-4 py-3.5 flex items-center justify-between gap-4 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-semibold">
                    Semana {report.week_number}/{report.year}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      report.status === "open"
                        ? "bg-green-800/50 text-green-300"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {report.status === "open" ? "Aberto" : "Fechado"}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  {report.start_date} ate {report.end_date}
                  <span className="ml-2 text-gray-400">{report.tasks?.length ?? 0} atividade(s)</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/reports/${report.id}`}
                  className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  Ver
                </Link>
                <button
                  onClick={() => handleDownload(report)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
                  </svg>
                  .md
                </button>
                <button
                  onClick={() => handleExportPdf(report)}
                  disabled={exportingPdf === report.id}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {exportingPdf === report.id ? "..." : "PDF"}
                </button>
                <button
                  onClick={() => handleNotify(report)}
                  disabled={notifying === report.id}
                  title="Enviar webhook manualmente para este relatorio"
                  className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-50 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifying === report.id ? "..." : "Webhook"}
                </button>
                <button
                  onClick={() => handleSendClickUp(report)}
                  disabled={sendingClickUp === report.id}
                  className="text-xs bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white font-medium rounded px-2.5 py-1 transition-colors"
                >
                  {sendingClickUp === report.id ? "Enviando..." : "ClickUp"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginacao */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded bg-gray-700 border border-gray-500 text-gray-300 hover:bg-gray-600 disabled:opacity-40 transition-colors">
            Anterior
          </button>
          <span className="text-xs text-gray-400">
            Pagina {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded bg-gray-700 border border-gray-500 text-gray-300 hover:bg-gray-600 disabled:opacity-40 transition-colors">
            Proxima
          </button>
        </div>
      )}
    </div>
  );
}
