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

// Se o backend retornar 401, limpa a sessão e redireciona para login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
