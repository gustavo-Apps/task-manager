import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEmployees } from "../lib/managerApi";
import toast from "react-hot-toast";

const STATUS_LABELS = {
  working: { label: "Trabalhando", color: "bg-green-600" },
  no_update_today: { label: "Sem update hoje", color: "bg-yellow-600" },
  no_activity_week: { label: "Sem atividade", color: "bg-red-600" },
};

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch(() => toast.error("Erro ao carregar colaboradores."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) => {
    const matchSearch =
      !search ||
      e.username.toLowerCase().includes(search.toLowerCase()) ||
      (e.cargo || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <p className="text-gray-400 text-sm">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Equipe</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="working">Trabalhando</option>
          <option value="no_update_today">Sem update hoje</option>
          <option value="no_activity_week">Sem atividade</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ultima atividade</th>
              <th className="px-4 py-3 text-right">Atividades semana</th>
              <th className="px-4 py-3 text-right">Tickets</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.map((emp) => {
              const st = STATUS_LABELS[emp.status] || { label: emp.status, color: "bg-gray-600" };
              return (
                <tr
                  key={emp.id}
                  className="bg-gray-900 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => navigate(`/manager/employees/${emp.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-white">{emp.username}</td>
                  <td className="px-4 py-3 text-gray-300">{emp.cargo || "-"}</td>
                  <td className="px-4 py-3 text-gray-400">{emp.email}</td>
                  <td className="px-4 py-3 text-gray-300">{emp.lastActivity || "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{emp.activitiesWeek}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{emp.ticketsWeek}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs text-white font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Nenhum colaborador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
