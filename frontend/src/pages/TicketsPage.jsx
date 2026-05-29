/**
 * Página: Tickets Testados
 *
 * Lista todas as tasks com azure_ticket_id num intervalo de datas.
 * Permite selecionar semana atual, anterior, retrasada ou range personalizado.
 */

import { useState, useEffect } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import Badge from "../components/Badge";

// ─── Helpers de data ──────────────────────────────────────────────────────────

/** Retorna a segunda-feira e domingo de uma semana ISO relativa (0 = atual, -1 = anterior, ...) */
function getWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=seg, 7=dom
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

// ─── Preset de períodos ───────────────────────────────────────────────────────

const PRESETS = [
  { label: "Semana atual",    value: "current"  },
  { label: "Semana passada",  value: "last"     },
  { label: "Retrasada",       value: "before"   },
  { label: "Personalizado",   value: "custom"   },
];

const OFFSET_MAP = { current: 0, last: -1, before: -2 };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [preset, setPreset]   = useState("current");
  const [range, setRange]     = useState(getWeekRange(0));
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Quando o preset muda (exceto "custom"), atualiza o range automaticamente
  useEffect(() => {
    if (preset !== "custom") {
      setRange(getWeekRange(OFFSET_MAP[preset]));
    }
  }, [preset]);

  async function fetchTickets() {
    if (!range.from || !range.to) {
      toast.error("Informe as duas datas.");
      return;
    }
    if (range.from > range.to) {
      toast.error("A data inicial nao pode ser maior que a final.");
      return;
    }
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

  // Busca automatica quando o range muda por preset
  useEffect(() => {
    if (preset !== "custom") {
      fetchTickets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="max-w-4xl">

      {/* Titulo */}
      <h1 className="text-lg font-semibold text-gray-100 mb-6">Tickets Testados</h1>

      {/* Filtros */}
      <div className="bg-gray-900 border border-gray-500 rounded-lg px-4 py-4 mb-6 flex flex-wrap items-end gap-4">

        {/* Presets */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Periodo</label>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
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

        {/* Range de datas — sempre visivel, editavel so no modo custom */}
        <div className="flex items-end gap-2">
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

          {/* Botao so aparece no modo custom */}
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

        {/* Contador */}
        {searched && !loading && (
          <span className="text-xs text-gray-300 ml-auto self-end">
            {tickets.length} ticket(s) encontrado(s)
          </span>
        )}
      </div>

      {/* Tabela de resultados */}
      {loading && (
        <p className="text-sm text-gray-500">Carregando...</p>
      )}

      {!loading && searched && tickets.length === 0 && (
        <div className="border border-dashed border-gray-800 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-600">Nenhum ticket encontrado neste periodo.</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="bg-gray-900 border border-gray-500 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-500 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Titulo</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Semana</th>
                <th className="px-4 py-3 font-medium">Discord</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-gray-700 last:border-0 transition-colors hover:bg-gray-800/50 ${
                    idx % 2 === 0 ? "" : "bg-gray-900/50"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-blue-400">
                    #{ticket.azure_ticket_id}
                  </td>
                  <td className="px-4 py-3 text-gray-200 max-w-xs">
                    {ticket.azure_ticket_id ? (
                      <a
                        href={`https://dev.azure.com/appelsoft/Time%20Desktop%20-%20Desenvolvimento/_workitems/edit/${ticket.azure_ticket_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-1 text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                      >
                        {ticket.title}
                      </a>
                    ) : (
                      <span className="line-clamp-1">{ticket.title}</span>
                    )}
                    {ticket.description && (
                      <span className="block text-gray-500 line-clamp-1 mt-0.5">{ticket.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatDateBR(ticket.task_date)}
                    {ticket.task_end_date && ticket.task_end_date !== ticket.task_date && (
                      <span className="block text-gray-600">ate {formatDateBR(ticket.task_end_date)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.activityType
                      ? <Badge label={ticket.activityType.name} color={ticket.activityType.color} />
                      : <span className="text-gray-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {ticket.taskStatus
                      ? <Badge label={ticket.taskStatus.name} color={ticket.taskStatus.color} />
                      : <span className="text-gray-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    S{ticket.weeklyReport?.week_number}/{ticket.weeklyReport?.year}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.discord_link
                      ? (
                        <a
                          href={ticket.discord_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          Ver
                        </a>
                      )
                      : <span className="text-gray-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/tasks/${ticket.id}/edit`}
                      className="text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Detalhes
                    </a>
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
