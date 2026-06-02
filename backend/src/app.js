/**
 * Configuração central do Express.
 *
 * Registra middlewares globais (segurança, cors, json)
 * e monta as rotas da aplicação.
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Helmet adiciona headers HTTP de segurança (CSP, HSTS, etc.)
app.use(helmet());

// CORS - em produção, substitua "*" pela URL do seu frontend
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Parseia o corpo das requisições como JSON
app.use(express.json());

// Rate limiting nas rotas de autenticação (evita força bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { ok: false, message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// Rotas
app.use("/api", routes);

// Rota de health check - útil para monitoramento
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Em produção, serve o build do frontend (React)
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  // SPA fallback: qualquer rota desconhecida retorna o index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Middleware de erro - deve ser o último a ser registrado
app.use(errorHandler);

module.exports = app;
