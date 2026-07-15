import { useEffect, useState } from "react";
import { fetchStatistics } from "../lib/managerApi";
import { getExportMdUrl } from "../lib/managerApi";
import toast from "react-hot-toast";

function DataTable({ title, headers, rows }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-750">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-4 py-4 text-center text-gray-500">
                Sem dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerStatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function load() {
    setLoading(true);
    const filters = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    fetchStatistics(filters)
      .then(setStats)
      .catch(() => toast.error("Erro ao carregar estatisticas."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleFilter(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Relatorios da Equipe</h1>
        <a
          href={getExportMdUrl({ date_from: dateFrom, date_to: dateTo })}
          download
          className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors"
        >
          Exportar Markdown
        </a>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Ate</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Aplicar
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : !stats ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataTable
            title="Atividades por colaborador"
            headers={["Colaborador", "Quantidade"]}
            rows={stats.byEmployee.map((r) => [r.username, r.count])}
          />
          <DataTable
            title="Tickets por semana"
            headers={["Semana", "Tickets"]}
            rows={stats.byWeek.map((r) => [r.week, r.count])}
          />
          <DataTable
            title="Atividades por dia (ultimos registros)"
            headers={["Data", "Quantidade"]}
            rows={stats.byDay.slice(-30).map((r) => [r.date, r.count])}
          />
          <DataTable
            title="Distribuicao por tipo de atividade"
            headers={["Tipo", "Quantidade"]}
            rows={stats.byActivityType.map((r) => [r.name, r.count])}
          />
        </div>
      )}
    </div>
  );
}
