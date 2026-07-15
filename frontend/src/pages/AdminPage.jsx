/**
 * Página: Painel Administrativo
 *
 * Visível apenas para usuários com role="admin".
 * Permite listar, criar, editar, redefinir senha e excluir usuários.
 */

import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

// ─── Modal de criação / edição ────────────────────────────────────────────────

function UserModal({ user, cargos, onClose, onSaved }) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    username:  user?.username  ?? "",
    email:     user?.email     ?? "",
    password:  "",
    role:      user?.role      ?? "user",
    cargo:     user?.cargo     ?? (cargos[0]?.id ?? ""),
    is_active: user?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const payload = {
          username:  form.username,
          email:     form.email,
          role:      form.role,
          cargo:     Number(form.cargo),
          is_active: form.is_active,
        };
        const res = await api.patch(`/admin/users/${user.id}`, payload);
        onSaved(res.data.data.user);
        toast.success("Usuario atualizado.");
      } else {
        if (!form.password) { toast.error("Senha obrigatoria."); setSaving(false); return; }
        const payload = {
          username: form.username,
          email:    form.email,
          password: form.password,
          role:     form.role,
          cargo:    Number(form.cargo),
        };
        const res = await api.post("/admin/users", payload);
        onSaved(res.data.data.user);
        toast.success("Usuario criado.");
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao salvar usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-600 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            {isEdit ? "Editar usuario" : "Novo usuario"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              className="w-full bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Senha inicial</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                minLength={6}
                className="w-full bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-300 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className="w-full bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-2 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="manager">gestor</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-300 mb-1">Cargo</label>
              <select
                value={form.cargo}
                onChange={(e) => set("cargo", e.target.value)}
                className="w-full bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-2 py-2 focus:outline-none focus:border-blue-500"
              >
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-xs text-gray-300 select-none">
                Conta ativa
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors"
            >
              {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de reset de senha ──────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { new_password: password });
      toast.success("Senha redefinida.");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao redefinir senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-4 border-b border-gray-600 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Redefinir senha — {user.username}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Nova senha</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              className="w-full bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded transition-colors">
              {saving ? "Salvando..." : "Redefinir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Aba de vínculos gestor/colaborador ─────────────────────────────────────

function ManagerLinksTab() {
  const [links, setLinks]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ manager_id: "", employee_id: "" });
  const [saving, setSaving]     = useState(false);

  const loadLinks = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/admin/manager-links").then((r) => r.data.data.links ?? []),
      api.get("/admin/users").then((r) => r.data.data.users ?? []),
    ])
      .then(([l, u]) => { setLinks(l); setUsers(u); })
      .catch(() => toast.error("Erro ao carregar vinculos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.manager_id || !form.employee_id) { toast.error("Selecione gestor e colaborador."); return; }
    setSaving(true);
    try {
      await api.post("/admin/manager-links", {
        manager_id: Number(form.manager_id),
        employee_id: Number(form.employee_id),
      });
      toast.success("Vinculo criado.");
      setForm({ manager_id: "", employee_id: "" });
      loadLinks();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao criar vinculo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover vinculo?")) return;
    try {
      await api.delete(`/admin/manager-links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Vinculo removido.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao remover vinculo.");
    }
  }

  const managers   = users.filter((u) => ["manager", "admin"].includes(u.role));
  const employees  = users.filter((u) => u.is_active);

  return (
    <div className="space-y-6">
      {/* Form novo vínculo */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Novo vinculo</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Gestor</label>
            <select
              value={form.manager_id}
              onChange={(e) => setForm((f) => ({ ...f, manager_id: e.target.value }))}
              className="bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 min-w-40"
            >
              <option value="">Selecione...</option>
              {managers.map((u) => (
                <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Colaborador</label>
            <select
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              className="bg-gray-700 border border-gray-500 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 min-w-40"
            >
              <option value="">Selecione...</option>
              {employees.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
          >
            {saving ? "Salvando..." : "Vincular"}
          </button>
        </form>
      </div>

      {/* Lista de vínculos */}
      {loading ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : links.length === 0 ? (
        <div className="border border-dashed border-gray-600 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400">Nenhum vinculo cadastrado.</p>
        </div>
      ) : (
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 border-b border-gray-600">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase">Gestor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase">Colaborador</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {links.map((l) => (
                <tr key={l.id} className="bg-gray-800 hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-white">{l.manager?.username ?? l.manager_id}</td>
                  <td className="px-4 py-3 text-gray-300">{l.employee?.username ?? l.employee_id}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remover
                    </button>
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

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [users,  setUsers]  = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // "users" | "links"

  const [modal, setModal] = useState(null); // null | { type: "create"|"edit"|"reset", user? }

  const loadUsers = useCallback(() => {
    setLoading(true);
    api.get("/admin/users")
      .then((res) => setUsers(res.data.data.users ?? []))
      .catch(() => toast.error("Erro ao carregar usuarios."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
    api.get("/lookups/cargos")
      .then((res) => setCargos(res.data.data.cargos ?? []))
      .catch(() => {});
  }, [loadUsers]);

  function handleSaved(user) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = user;
        return next;
      }
      return [...prev, user];
    });
  }

  async function handleDelete(user) {
    if (!window.confirm(`Excluir o usuario "${user.username}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("Usuario excluido.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao excluir usuario.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">

      {/* Modais */}
      {modal?.type === "create" && (
        <UserModal
          cargos={cargos}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.type === "edit" && (
        <UserModal
          user={modal.user}
          cargos={cargos}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.type === "reset" && (
        <ResetPasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-sm text-gray-400 mt-1">Gerenciamento de usuarios</p>
        </div>
        {activeTab === "users" && (
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg"
          >
            + Novo usuario
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 border-b border-gray-700">
        {[
          { id: "users", label: "Usuarios" },
          { id: "links", label: "Vinculos Gestor" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "links" && <ManagerLinksTab />}

      {/* Tabela de usuários */}
      {activeTab === "users" && loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 h-14" />
          ))}
        </div>
      )}
      {activeTab === "users" && !loading && users.length === 0 && (
        <div className="border border-dashed border-gray-600 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-400">Nenhum usuario cadastrado.</p>
        </div>
      )}
      {activeTab === "users" && !loading && users.length > 0 && (
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 border-b border-gray-600">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Cargo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {users.map((u) => (
                <tr key={u.id} className="bg-gray-800 hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{u.email}</td>
                  <td className="px-4 py-3 text-gray-300">{u.userCargo?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-purple-800/50 text-purple-300"
                        : "bg-gray-700 text-gray-300"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.is_active
                        ? "bg-green-800/50 text-green-300"
                        : "bg-red-900/50 text-red-400"
                    }`}>
                      {u.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setModal({ type: "edit", user: u })}
                        className="text-xs text-gray-300 hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setModal({ type: "reset", user: u })}
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        Senha
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
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

