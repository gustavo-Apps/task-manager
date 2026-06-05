/**
 * Cliente HTTP centralizado (Axios)
 *
 * - Baseado em /api (redirecionado pelo proxy do Vite para localhost:3000)
 * - Interceptor de request: injeta o Bearer token automaticamente
 * - Interceptor de response: redireciona para /login se 401
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Injeta o token em todas as requisicoes autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wr_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o backend retornar 401 em rotas protegidas, limpa a sessao e redireciona.
// Rotas de /auth/* (login, register) NAO disparam o redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("wr_token");
      localStorage.removeItem("wr_user");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
