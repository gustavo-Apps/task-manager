/**
 * Layout base das páginas autenticadas.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard"     },
  { to: "/tickets",  label: "Tickets"       },
  { to: "/reports",  label: "Relatorios"    },
  { to: "/settings", label: "Configuracoes" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success("Sessao encerrada.");
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100">
      {/* Sidebar — tom levemente diferente do body */}
      <aside className="w-56 shrink-0 bg-gray-800 border-r border-gray-600 flex flex-col">
        {/* Logo / título */}
        <div className="px-5 py-5 border-b border-gray-600">
          <span className="text-sm font-bold tracking-wide text-white">Weekly Reports</span>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="text-xs text-gray-200 truncate">{user?.username}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded text-sm font-medium transition-colors border-l-2 ${
                  isActive
                    ? "bg-blue-600/25 text-white border-blue-400"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white border-transparent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sair */}
        <div className="px-2 py-4 border-t border-gray-600">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
