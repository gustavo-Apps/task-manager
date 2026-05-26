/**
 * Formulário de tarefa (criar e editar).
 *
 * Reutilizado nas páginas NewTaskPage e EditTaskPage.
 * Quando azure_ticket_id é preenchido, o título é desabilitado
 * e preenchido automaticamente com "Testado Hoje".
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { useLookups } from "../hooks/useLookups";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  activity_type_id: "",
  task_status_id:   "",
  title:            "",
  description:      "",
  task_date:        new Date().toISOString().slice(0, 10),
  task_end_date:    "",
  azure_ticket_id:  "",
  discord_link:     "",
  notes:            "",
};

export default function TaskFormPage() {
  const { id } = useParams(); // definido = edição
  const isEdit  = Boolean(id);
  const navigate = useNavigate();

  const { activityTypes, taskStatuses, loading: loadingLookups } = useLookups();
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  // Em modo edição, carrega os dados da tarefa existente
  useEffect(() => {
    if (!isEdit) return;

    api.get(`/tasks/${id}`)
      .then((res) => {
        const t = res.data.data.task;
        setForm({
          activity_type_id: t.activity_type_id ?? "",
          task_status_id:   t.task_status_id   ?? "",
          title:            t.title             ?? "",
          description:      t.description       ?? "",
          task_date:        t.task_date         ?? "",
          task_end_date:    t.task_end_date     ?? "",
          azure_ticket_id:  t.azure_ticket_id   ?? "",
          discord_link:     t.discord_link      ?? "",
          notes:            t.notes             ?? "",
        });
      })
      .catch(() => toast.error("Erro ao carregar tarefa."));
  }, [id, isEdit]);

  // Preenche título automaticamente quando ticket Azure é informado
  useEffect(() => {
    if (form.azure_ticket_id.trim()) {
      setForm((prev) => ({ ...prev, title: "Testado Hoje" }));
    }
  }, [form.azure_ticket_id]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Limpa campos vazios para não enviar strings vazias desnecessariamente
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    );

    try {
      if (isEdit) {
        await api.patch(`/tasks/${id}`, payload);
        toast.success("Tarefa atualizada.");
      } else {
        await api.post("/tasks", payload);
        toast.success("Tarefa criada.");
      }
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao salvar tarefa.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remover esta tarefa?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Tarefa removida.");
      navigate("/");
    } catch {
      toast.error("Erro ao remover tarefa.");
    }
  }

  if (loadingLookups) return <p className="text-sm text-gray-500">Carregando...</p>;

  const ticketPreenchido = form.azure_ticket_id.trim() !== "";

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold text-gray-100 mb-6">
        {isEdit ? "Editar tarefa" : "Nova tarefa"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Ticket Azure */}
        <Field label="ID do Ticket Azure (opcional)">
          <input
            name="azure_ticket_id"
            value={form.azure_ticket_id}
            onChange={handleChange}
            placeholder="ex: 2819"
            className={inputCls}
          />
          {ticketPreenchido && (
            <p className="text-xs text-blue-400 mt-1">Titulo preenchido automaticamente: "Testado Hoje"</p>
          )}
        </Field>

        {/* Título */}
        <Field label="Titulo">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required={!ticketPreenchido}
            disabled={ticketPreenchido}
            placeholder={ticketPreenchido ? "Testado Hoje" : "Descricao resumida da atividade"}
            className={inputCls + (ticketPreenchido ? " opacity-50 cursor-not-allowed" : "")}
          />
        </Field>

        {/* Tipo de atividade */}
        <Field label="Tipo de atividade">
          <select
            name="activity_type_id"
            value={form.activity_type_id}
            onChange={handleChange}
            required
            className={inputCls}
          >
            <option value="">Selecione...</option>
            {activityTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>

        {/* Status */}
        <Field label="Status">
          <select
            name="task_status_id"
            value={form.task_status_id}
            onChange={handleChange}
            required
            className={inputCls}
          >
            <option value="">Selecione...</option>
            {taskStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        {/* Data */}
        <Field label="Data de inicio">
          <input
            type="date"
            name="task_date"
            value={form.task_date}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </Field>

        {/* Data fim */}
        <Field label="Data de termino (opcional — preencha se a tarefa durou mais de um dia)">
          <input
            type="date"
            name="task_end_date"
            value={form.task_end_date}
            onChange={handleChange}
            min={form.task_date || undefined}
            className={inputCls}
          />
          {form.task_end_date && form.task_end_date !== form.task_date && (
            <p className="text-xs text-blue-400 mt-1">
              No .md, os dias intermediarios aparecerao como "Continuando {form.activity_type_id || "atividade"} do: {form.title || "..."}"
            </p>
          )}
        </Field>

        {/* Descrição */}
        <Field label="Descricao detalhada (opcional)">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="O que foi feito, como e por que..."
            className={inputCls + " resize-none"}
          />
        </Field>

        {/* Link Discord */}
        <Field label="Link do topico no Discord (opcional)">
          <input
            name="discord_link"
            value={form.discord_link}
            onChange={handleChange}
            placeholder="https://discord.com/channels/..."
            className={inputCls}
          />
        </Field>

        {/* Observações */}
        <Field label="Observacoes (opcional)">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className={inputCls + " resize-none"}
          />
        </Field>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-400 transition-colors px-3 py-2"
              >
                Remover
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded px-4 py-2 transition-colors"
            >
              {loading ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar tarefa"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Componente auxiliar para label + input
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500 placeholder-gray-600";
