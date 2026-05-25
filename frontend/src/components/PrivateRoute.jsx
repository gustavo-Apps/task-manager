/**
 * Guarda de rota autenticada.
 * Redireciona para /login se não houver sessão ativa.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <span className="text-gray-400 text-sm">Carregando...</span>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
