/**
 * Guarda de rota autenticada.
 * Redireciona para /login se nao houver sessao ativa.
 * Se `requiredRole` for informado (string ou array), redireciona para / se o usuario nao tiver o role.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <span className="text-gray-400 text-sm">Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user?.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
