/**
 * Layout base das páginas autenticadas.
 */

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard"     },
  { to: "/tickets",  label: "Tickets"       },
  { to: "/reports",  label: "Relatorios"    },
  { to: "/settings", label: "Configuracoes" },
  { to: "/profile",  label: "Perfil"        },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    toast.success("Sessao encerrada.");
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100">

      {/* Overlay para fechar sidebar no mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 shrink-0 bg-gray-800 border-r border-gray-600 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo / titulo */}
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
              onClick={() => setSidebarOpen(false)}
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

      {/* Conteudo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile com botao hamburguer */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-600 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white p-1 rounded"
            aria-label="Abrir menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white">Weekly Reports</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}