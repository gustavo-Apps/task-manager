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

// Injeta o token em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o backend retornar 401 em rotas protegidas, limpa a sessão e redireciona.
// Rotas de /auth/* (login, register) NÃO disparam o redirect — o erro
// deve chegar ao catch do componente para exibir feedback ao usuário.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Usa replace para não empilhar /login no histórico
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
