module.exports = {
  apps: [
    {
      name: "weekly-reports-api",
      script: "server.js",
      watch: false,          // true = reinicia ao salvar arquivo (como nodemon)
      autorestart: true,     // reinicia automaticamente se crashar
      max_restarts: 10,      // máximo de restarts antes de parar
      restart_delay: 3000,   // aguarda 3s antes de reiniciar
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
