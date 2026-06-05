/**
 * Página: Tickets Testados
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";

function getWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek - 1) + offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to:   sunday.toISOString().slice(0, 10),
  };
}

function formatDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const PRESETS = [
  { label: "Semana atual",   value: "current" },
  { label: "Semana passada", value: "last"    },
  { label: "Retrasada",      value: "before"  },
  { label: "Personalizado",  value: "custom"  },
];

const OFFSET_MAP = { current: 0, last: -1, before: -2 };

export default function TicketsPage() {
  const [preset, setPreset]     = useState("current");
  const [range, setRange]       = useState(getWeekRange(0));
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortCol, setSortCol]   = useState("task_date");
  const [sortDir, setSortDir]   = useState("asc");

  useEffect(() => {
    if (preset !== "custom") {
      setRange(getWeekRange(OFFSET_MAP[preset]));
    }
  }, [preset]);

  async function fetchTickets() {
    if (!range.from || !range.to) { toast.error("Informe as duas datas."); return; }
    if (range.from > range.to)    { toast.error("Data inicial nao pode ser maior que a final."); return; }
    setLoading(true);
    try {
      const res = await api.get(`/tasks/tickets?from=${range.from}&to=${range.to}`);
      setTickets(res.data.data.tickets);
      setSearched(true);
    } catch {
      toast.error("Erro ao buscar tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (preset !== "custom") fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);


  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function getSortedTickets() {
    return [...tickets].sort((a, b) => {
      let aVal, bVal;
      if (sortCol === "task_date") {
        aVal = a.task_date ?? "";
        bVal = b.task_date ?? "";
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
  }

  return (
    <div className="max-w-5xl">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Tickets Testados</h1>
          {searched && !loading && (
            <p className="text-sm text-gray-300 mt-1">{tickets.length} ticket(s) encontrado(s)</p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-700 border border-gray-500 rounded-lg px-4 py-3 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Periodo</label>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
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

        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">De</label>
            <input
              type="date"
              value={range.from}
              onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, from: e.target.value })); }}
              className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Ate</label>
            <input
              type="date"
              value={range.to}
              onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, to: e.target.value })); }}
              className="bg-gray-700 border border-gray-500 text-gray-100 text-xs rounded px-2 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          {preset === "custom" && (
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded transition-colors"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          )}
        </div>
      </div>

      {/* Carregando */}
      {loading && <p className="text-sm text-gray-300">Carregando...</p>}

      {/* Vazio */}
      {!loading && searched && tickets.length === 0 && (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-300">Nenhum ticket encontrado neste periodo.</p>
        </div>
      )}

      {/* Tabela */}
      {!loading && tickets.length > 0 && (
        <div className="bg-gray-700 border border-gray-500 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-600 bg-gray-700/80 text-gray-300 text-left">
                <th
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("azure_ticket_id")}
                >
                  Ticket {sortCol === "azure_ticket_id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="px-4 py-3 font-semibold">Titulo</th>
                <th
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("task_date")}
                >
                  Data {sortCol === "task_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("tipo")}
                >
                  Tipo {sortCol === "tipo" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("status")}
                >
                  Status {sortCol === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="px-4 py-3 font-semibold">Semana</th>
                <th className="px-4 py-3 font-semibold">Discord</th>
                <th className="px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {getSortedTickets().map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-gray-600 last:border-0 hover:bg-gray-600/40 transition-colors ${
                    idx % 2 !== 0 ? "bg-gray-700/30" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded text-xs">
                      #{ticket.azure_ticket_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-100 max-w-xs">
                    {ticket.azure_ticket_id ? (
                      <a
                        href={`https://dev.azure.com/appelsoft/Time%20Desktop%20-%20Desenvolvimento/_workitems/edit/${ticket.azure_ticket_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-1 text-blue-300 hover:text-blue-200 hover:underline transition-colors"
                      >
                        {ticket.title}
                      </a>
                    ) : (
                      <span className="line-clamp-1">{ticket.title}</span>
                    )}
                    {ticket.description && (
                      <span className="block text-gray-400 line-clamp-1 mt-0.5">{ticket.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {formatDateBR(ticket.task_date)}
                    {ticket.task_end_date && ticket.task_end_date !== ticket.task_date && (
                      <span className="block text-gray-400">ate {formatDateBR(ticket.task_end_date)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.activityType
                      ? <Badge label={ticket.activityType.name} color={ticket.activityType.color} />
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {ticket.taskStatus
                      ? <Badge label={ticket.taskStatus.name} color={ticket.taskStatus.color} />
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    S{ticket.weeklyReport?.week_number}/{ticket.weeklyReport?.year}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.discord_link ? (
                      <a href={ticket.discord_link} target="_blank" rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors">
                        Ver
                      </a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${ticket.id}/edit`}
                      className="text-gray-300 hover:text-white transition-colors">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
