/**
 * Pagina: Perfil do Usuario
 * Permite editar username e senha. Exige senha atual para qualquer alteracao.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const CARGO_LABELS = {
  1: "Dev",
  2: "QA",
  3: "GP",
  4: "Requisitos",
  5: "DevOps",
};

const inputCls =
  "w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500 placeholder-gray-600";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:         user?.username || "",
    email:            user?.email    || "",
    cargo_id:         user?.cargo    ?? "",
    current_password: "",
    new_password:     "",
    confirm_password: "",
  });

  const [saving, setSaving]       = useState(false);
  const [showPass, setShowPass]   = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validacao frontend
    if (form.new_password && form.new_password !== form.confirm_password) {
      toast.error("Nova senha e confirmacao nao coincidem.");
      return;
    }
    if (form.new_password && !form.current_password) {
      toast.error("Informe a senha atual para alterar a senha.");
      return;
    }

    // Monta payload — apenas campos preenchidos; omite confirm_password
    const payload = {};

    // username: inclui se foi alterado
    const trimmedUsername = form.username.trim();
    if (trimmedUsername && trimmedUsername !== user?.username) {
      payload.username = trimmedUsername;
    }

    // senha: inclui apenas se new_password foi preenchido
    if (form.new_password) {
      payload.new_password     = form.new_password;
      payload.current_password = form.current_password;
    } else if (form.current_password && Object.keys(payload).length > 0) {
      // Alterando username mas sem nova senha — backend exige current_password
      payload.current_password = form.current_password;
    }

    if (Object.keys(payload).length === 0 || !payload.current_password) {
      if (!payload.current_password) {
        toast.error("Informe a senha atual para salvar alteracoes.");
      } else {
        toast("Nenhuma alteracao informada.", { icon: "i" });
      }
      return;
    }

    try {
      setSaving(true);
      const res = await api.patch("/auth/profile", payload);
      const updatedUser = res.data.data.user;
      const token = localStorage.getItem("wr_token");
      login(token, updatedUser);
      toast.success("Perfil atualizado com sucesso.");
      // Limpa campos de senha apos salvar
      setForm((prev) => ({
        ...prev,
        username:         updatedUser.username || prev.username,
        current_password: "",
        new_password:     "",
        confirm_password: "",
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  const cargoLabel = CARGO_LABELS[user?.cargo] || "—";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Perfil</h1>
        <p className="text-sm text-gray-300 mt-1">Gerencie suas informacoes de acesso.</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">

        {/* Info readonly: email e cargo */}
        <div className="pb-4 border-b border-gray-700 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Email</p>
            <p className="text-sm text-gray-100 bg-gray-700/50 border border-gray-700 rounded px-3 py-2">
              {user?.email || "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Contato o administrador para alterar o email.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Cargo</p>
            <p className="text-sm text-gray-100 bg-gray-700/50 border border-gray-700 rounded px-3 py-2">
              {cargoLabel}
            </p>
            <p className="text-xs text-gray-500 mt-1">Contato o administrador para alterar o cargo.</p>
          </div>
        </div>

        {/* Formulario editavel */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Seu username"
              className={inputCls}
            />
            <p className="text-xs text-gray-500 mt-1">
              Letras, numeros, ponto e underscore. Min 3 caracteres.
            </p>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Nova senha <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Deixe vazio para nao alterar"
                className={inputCls + " pr-20"}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Confirmar nova senha — condicional */}
          {form.new_password && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Confirmar nova senha <span className="text-red-400">*</span>
              </label>
              <input
                type={showPass ? "text" : "password"}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Repita a nova senha"
                className={
                  inputCls +
                  (form.confirm_password && form.confirm_password !== form.new_password
                    ? " border-red-500"
                    : "")
                }
              />
              {form.confirm_password && form.confirm_password !== form.new_password && (
                <p className="text-xs text-red-400 mt-1">Senhas nao coincidem.</p>
              )}
            </div>
          )}

          {/* Senha atual — sempre obrigatoria para salvar */}
          <div className="pt-3 border-t border-gray-700">
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Senha atual <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              placeholder="Obrigatoria para confirmar alteracoes"
              className={inputCls}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Necessaria para confirmar qualquer alteracao no perfil.
            </p>
          </div>

          {/* Acoes */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded px-5 py-2 transition-colors"
            >
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
