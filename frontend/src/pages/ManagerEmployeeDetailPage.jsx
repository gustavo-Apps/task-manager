import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchEmployee } from "../lib/managerApi";
import toast from "react-hot-toast";
import Badge from "../components/Badge";

const STATUS_LABELS = {
  working:           { label: "Trabalhando",     color: "#16a34a" },
  no_update_today:   { label: "Sem update hoje", color: "#ca8a04" },
  no_activity_week:  { label: "Sem atividade",   color: "#dc2626" },
};

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function statusColor(name) {
  if (!name) return "#6b7280";
  if (/conclu/i.test(name))    return "#16a34a";
  if (/bloq/i.test(name))      return "#dc2626";
  if (/andamento/i.test(name)) return "#2563eb";
  if (/pendente/i.test(name))  return "#ca8a04";
  return "#6b7280";
}

function formatDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function WeekAccordion({ week }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 flex justify-between items-center"
      >
        <span className="text-sm font-medium text-white">
          {week.week} &mdash; {formatDateBR(week.startDate)} a {formatDateBR(week.endDate)}
        </span>
        <span className="text-xs text-gray-400">{week.tasks.length} atividade(s) {open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col style={{ width: "90px" }} />
              <col />{/* titulo ocupa o restante */}
              <col style={{ width: "110px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "80px" }} />
            </colgroup>
            <thead className="bg-gray-750 border-b border-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold uppercase tracking-wide">Data</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold uppercase tracking-wide">Titulo</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold uppercase tracking-wide">Status</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold uppercase tracking-wide">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {week.tasks.map((t, idx) => (
                <tr key={t.id} className={`hover:bg-gray-800 transition-colors ${idx % 2 === 0 ? "bg-gray-900" : "bg-gray-850"}`}>
                  <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{formatDateBR(t.task_date)}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-white font-medium truncate">{t.title || "—"}</p>
                    {t.description && t.description !== t.title && (
                      <p className="text-gray-400 mt-0.5 truncate">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.activityType
                      ? <Badge label={t.activityType.name} color={t.activityType.color || "#6b7280"} />
                      : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.taskStatus
                      ? <Badge label={t.taskStatus.name} color={t.taskStatus.color || statusColor(t.taskStatus.name)} />
                      : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.azure_ticket_id ? (
                      <a
                        href={`https://dev.azure.com/appelsoft/Time%20Desktop%20-%20Desenvolvimento/_workitems/edit/${t.azure_ticket_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded hover:text-blue-300 transition-colors whitespace-nowrap"
                      >
                        #{t.azure_ticket_id}
                      </a>
                    ) : <span className="text-gray-500">—</span>}
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

export default function ManagerEmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee(id)
      .then(setData)
      .catch(() => {
        toast.error("Colaborador nao encontrado.");
        navigate("/manager/employees");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-400 text-sm">Carregando...</p>;
  if (!data) return null;

  const { employee, summary, history } = data;
  const st = STATUS_LABELS[summary.status] || { label: summary.status, color: "#6b7280" };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/manager/employees")}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Voltar
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{employee.username}</h1>
          <p className="text-sm text-gray-400">{employee.cargo} &bull; {employee.email}</p>
        </div>
        <span
          className="ml-auto inline-block px-3 py-1 rounded text-xs text-white font-semibold"
          style={{ backgroundColor: st.color + "cc" }}
        >
          {st.label}
        </span>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Atividades hoje" value={summary.activitiesToday} color="text-green-400" />
        <StatCard label="Atividades semana" value={summary.activitiesWeek} color="text-blue-400" />
        <StatCard label="Tickets semana" value={summary.ticketsWeek} color="text-purple-400" />
        <StatCard label="Membro desde" value={new Date(employee.createdAt).toLocaleDateString("pt-BR")} color="text-gray-300" />
      </div>

      {/* Historico semanal */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Historico semanal</h2>
        <div className="space-y-2">
          {history.map((week) => (
            <WeekAccordion key={week.week} week={week} />
          ))}
          {history.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhuma atividade registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
