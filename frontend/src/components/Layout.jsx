/**
 * Layout base das páginas autenticadas.
 * Sidebar de navegação + área de conteúdo.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard"    },
  { to: "/tickets",  label: "Tickets"      },
  { to: "/reports",  label: "Relatorios"   },
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
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-6 border-b border-gray-800">
          <span className="text-sm font-semibold tracking-wide text-gray-200">Weekly Reports</span>
          <p className="text-xs text-gray-500 mt-1">{user?.username}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-gray-700 text-white font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
