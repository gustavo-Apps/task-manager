/**
 * Ponto de entrada da aplicação.
 *
 * Carrega variáveis de ambiente, inicializa o Express,
 * conecta ao banco de dados e inicia o servidor.
 */

require("dotenv").config();

const app = require("./src/app");
const { sequelize } = require("./src/config/database");
const settingsService = require("./src/services/settingsService");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Testa a conexão com o banco antes de subir o servidor
    await sequelize.authenticate();
    console.log("Banco de dados conectado com sucesso.");

    // Sincroniza o schema do banco (alter: true ajusta sem perder dados)
    await sequelize.sync({ alter: true });
    console.log("Schema sincronizado.");

    // Inicializa configuracoes padrao (ClickUp, etc.) se ainda nao existirem
    await settingsService.initDefaults();
    console.log("Configuracoes inicializadas.");

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error.message);
    process.exit(1);
  }
}

start();
