import { useEffect, useState } from "react";
import { fetchActivities } from "../lib/managerApi";
import { fetchEmployees } from "../lib/managerApi";
import toast from "react-hot-toast";
import api from "../lib/api";
import Badge from "../components/Badge";

function formatDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Badge de status com cor semântica quando não tiver cor no banco
function StatusBadge({ status }) {
  if (!status) return <span className="text-gray-500">—</span>;
  const color = status.color || (
    /conclu/i.test(status.name)  ? "#22c55e" :
    /bloq/i.test(status.name)    ? "#ef4444" :
    /andamento/i.test(status.name) ? "#3b82f6" :
    /pendente/i.test(status.name)  ? "#f59e0b" :
    "#6b7280"
  );
  return <Badge label={status.name} color={color} />;
}

export default function ManagerActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    employee_id: "",
    activity_type_id: "",
    task_status_id: "",
  });
  const [activityTypes, setActivityTypes] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchEmployees(),
      api.get("/lookups/activity-types").then((r) => r.data.data?.activityTypes || []),
      api.get("/lookups/task-statuses").then((r) => r.data.data?.taskStatuses || []),
    ])
      .then(([emps, types, statuses]) => {
        setEmployees(emps);
        setActivityTypes(types);
        setTaskStatuses(statuses);
      })
      .catch(() => toast.error("Erro ao carregar opcoes."));
  }, []);

  function loadActivities() {
    setLoading(true);
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
    fetchActivities(clean)
      .then(setActivities)
      .catch(() => toast.error("Erro ao carregar atividades."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadActivities(); }, []);

  function handleFilter(e) {
    e.preventDefault();
    loadActivities();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Atividades da Equipe</h1>

      {/* Filtros */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">De</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Ate</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Colaborador</label>
          <select
            value={filters.employee_id}
            onChange={(e) => setFilters((f) => ({ ...f, employee_id: e.target.value }))}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.username}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Tipo</label>
          <select
            value={filters.activity_type_id}
            onChange={(e) => setFilters((f) => ({ ...f, activity_type_id: e.target.value }))}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {activityTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Status</label>
          <select
            value={filters.task_status_id}
            onChange={(e) => setFilters((f) => ({ ...f, task_status_id: e.target.value }))}
            className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {taskStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Tabela */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 h-14" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: "90px" }} />
              <col style={{ width: "130px" }} />
              <col />{/* descricao: ocupa o restante */}
              <col style={{ width: "120px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "90px" }} />
            </colgroup>
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide whitespace-nowrap">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Colaborador</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Titulo / Descricao</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide whitespace-nowrap">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide whitespace-nowrap">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {activities.map((a, idx) => (
                <tr key={a.id} className={`hover:bg-gray-800 transition-colors ${idx % 2 === 0 ? "bg-gray-900" : "bg-gray-850"}`}>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs">{formatDateBR(a.task_date)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium text-xs truncate block">{a.user?.username ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-xs leading-snug truncate">{a.title || "—"}</p>
                    {a.description && a.description !== a.title && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{a.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.activityType
                      ? <Badge label={a.activityType.name} color={a.activityType.color || "#6b7280"} />
                      : <span className="text-gray-500 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.taskStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {a.azure_ticket_id ? (
                      <a
                        href={`https://dev.azure.com/appelsoft/Time%20Desktop%20-%20Desenvolvimento/_workitems/edit/${a.azure_ticket_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded text-xs hover:text-blue-300 transition-colors whitespace-nowrap"
                      >
                        #{a.azure_ticket_id}
                      </a>
                    ) : <span className="text-gray-500 text-xs">—</span>}
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-sm text-gray-400">Nenhuma atividade encontrada.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
