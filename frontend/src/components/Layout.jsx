/**
 * Layout base das páginas autenticadas.
 */

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard"     },
  { to: "/pending",  label: "Pendentes"     },
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

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
    ...(user?.role === "manager" || user?.role === "admin"
      ? [
          { to: "/manager",            label: "Dashboard Gestor", exact: true },
          { to: "/manager/employees",   label: "Equipe",            exact: true },
          { to: "/manager/activities",  label: "Atividades Equipe", exact: false },
          { to: "/manager/statistics",  label: "Relatorios Equipe", exact: true },
        ]
      : []),
  ];

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
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact !== false}
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
        <div className="px-2 py-4 border-t border-gray-600 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Sair
          </button>
          <a
            href="https://github.com/gustavo-Apps/task-manager"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Open Source · GitHub
          </a>
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