import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboard } from "../lib/managerApi";
import toast from "react-hot-toast";

const STATUS_LABELS = {
  working: { label: "Trabalhando", color: "bg-green-600" },
  no_update_today: { label: "Sem update hoje", color: "bg-yellow-600" },
  no_activity_week: { label: "Sem atividade", color: "bg-red-600" },
};

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 flex flex-col gap-1">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => toast.error("Erro ao carregar dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Carregando...</p>;
  if (!data) return <p className="text-red-400 text-sm">Erro ao carregar dados.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-white">Dashboard Gestor</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Colaboradores" value={data.totalEmployees} />
        <StatCard label="Atividades hoje" value={data.activitiesToday} color="text-green-400" />
        <StatCard label="Atividades semana" value={data.activitiesWeek} color="text-blue-400" />
        <StatCard label="Tickets semana" value={data.ticketsWeek} color="text-purple-400" />
        <StatCard label="Sem update hoje" value={data.withoutUpdateToday} color="text-yellow-400" />
        <StatCard label="Sem atividade" value={data.withPendencies} color="text-red-400" />
      </div>

      {/* Tabela de colaboradores */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Colaboradores</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Ultima atividade</th>
                <th className="px-4 py-3 text-right">Atividades semana</th>
                <th className="px-4 py-3 text-right">Tickets</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.employees.map((emp) => {
                const st = STATUS_LABELS[emp.status] || { label: emp.status, color: "bg-gray-600" };
                return (
                  <tr
                    key={emp.id}
                    className="bg-gray-900 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/manager/employees/${emp.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-white">{emp.username}</td>
                    <td className="px-4 py-3 text-gray-300">{emp.cargo || "-"}</td>
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
              {data.employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhum colaborador vinculado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
