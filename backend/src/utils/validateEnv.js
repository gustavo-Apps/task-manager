// DB_PASSWORD e opcional — bancos locais de desenvolvimento podem nao ter senha
const required = ["JWT_SECRET", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"];

function validateEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[startup] Variaveis de ambiente obrigatorias nao definidas: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("[startup] Variaveis de ambiente OK.");
}

module.exports = { validateEnv };
