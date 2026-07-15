import { useEffect, useState } from "react";
import { fetchActivities } from "../lib/managerApi";
import { fetchEmployees } from "../lib/managerApi";
import toast from "react-hot-toast";
import api from "../lib/api";

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
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Descricao</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {activities.map((a) => (
                <tr key={a.id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{a.task_date}</td>
                  <td className="px-4 py-3 text-white font-medium">{a.user?.username}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{a.description || a.title || "-"}</td>
                  <td className="px-4 py-3 text-gray-400">{a.activityType?.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-400">{a.taskStatus?.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-400">{a.azure_ticket_id || "-"}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma atividade encontrada.
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
