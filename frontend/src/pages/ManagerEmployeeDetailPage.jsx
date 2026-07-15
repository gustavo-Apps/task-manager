import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchEmployee } from "../lib/managerApi";
import toast from "react-hot-toast";

const STATUS_LABELS = {
  working: { label: "Trabalhando", color: "bg-green-600" },
  no_update_today: { label: "Sem update hoje", color: "bg-yellow-600" },
  no_activity_week: { label: "Sem atividade", color: "bg-red-600" },
};

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function WeekAccordion({ week }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 flex justify-between items-center"
      >
        <span className="text-sm font-medium text-gray-200">
          {week.week} &mdash; {week.startDate} a {week.endDate}
        </span>
        <span className="text-xs text-gray-400">{week.tasks.length} atividade(s) {open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="divide-y divide-gray-700">
          {week.tasks.map((t) => (
            <div key={t.id} className="px-4 py-3 bg-gray-900 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-300 font-medium">{t.task_date}</span>
                <span className="text-xs text-gray-500">{t.activityType?.name}</span>
                {t.azure_ticket_id && (
                  <span className="text-xs bg-purple-700 text-white px-1.5 py-0.5 rounded">
                    #{t.azure_ticket_id}
                  </span>
                )}
                <span className="text-xs text-gray-500">{t.taskStatus?.name}</span>
              </div>
              {t.description && (
                <p className="mt-1 text-gray-400 text-xs">{t.description}</p>
              )}
            </div>
          ))}
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
  const st = STATUS_LABELS[summary.status] || { label: summary.status, color: "bg-gray-600" };

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
        <span className={`ml-auto inline-block px-3 py-1 rounded text-xs text-white font-medium ${st.color}`}>
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
