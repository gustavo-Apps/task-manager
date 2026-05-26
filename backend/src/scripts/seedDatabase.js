/**
 * Script: popula o banco com dados iniciais (seed).
 *
 * Uso: node src/scripts/seedDatabase.js
 *
 * - Cria os tipos de atividade padrão
 * - Cria um usuário admin inicial
 * - Seguro para rodar múltiplas vezes (usa findOrCreate)
 */

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const { User, ActivityType, TaskStatus, UserCargos } = require("../models");

const TASK_STATUSES = [
  { name: "Pendente",      description: "Aguardando inicio",          color: "#F59E0B", sort_order: 1 },
  { name: "Em andamento",  description: "Sendo trabalhado agora",     color: "#3B82F6", sort_order: 2 },
  { name: "Concluido",     description: "Finalizado com sucesso",     color: "#10B981", sort_order: 3 },
  { name: "Bloqueado",     description: "Impedido por dependencia",   color: "#EF4444", sort_order: 4 },
  { name: "Cancelado",     description: "Nao sera mais realizado",    color: "#6B7280", sort_order: 5 },
];

const ACTIVITY_TYPES = [
  { name: "Teste", description: "Execucao de casos de teste", color: "#3B82F6" },
  { name: "Validacao", description: "Validacao de funcionalidade ou correcao", color: "#10B981" },
  { name: "Reuniao", description: "Reuniao de equipe ou alinhamento", color: "#F59E0B" },
  { name: "Documentacao", description: "Elaboracao ou revisao de documentos", color: "#8B5CF6" },
  { name: "Desenvolvimento", description: "Implementacao de funcionalidade", color: "#EF4444" },
  { name: "Analise", description: "Analise de requisito, bug ou sistema", color: "#06B6D4" },
  { name: "Deploy", description: "Publicacao ou configuracao de ambiente", color: "#EC4899" },
  { name: "Suporte", description: "Suporte a usuarios ou equipes", color: "#6B7280" },
];
const USER_CARGOS = [
  { name: "Desenvolvedor", description: "Responsavel por implementar funcionalidades e corrigir bugs" },
  { name: "Analista de Testes", description: "Responsavel por criar e executar casos de teste" },
  { name: "Gerente de Projeto", description: "Responsavel por planejar, coordenar e acompanhar o progresso do projeto" },
  { name: "Analista de Requisitos", description: "Responsavel por coletar, analisar e documentar os requisitos do sistema" },
  { name: "Engenheiro de DevOps", description: "Responsavel por configurar e manter os ambientes de desenvolvimento, teste e producao" },
];

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Status de tarefa
    for (const status of TASK_STATUSES) {
      const [, created] = await TaskStatus.findOrCreate({
        where: { name: status.name },
        defaults: status,
      });
      console.log(`TaskStatus "${status.name}": ${created ? "criado" : "ja existe"}`);
    }

    // Tipos de atividade
    for (const type of ACTIVITY_TYPES) {
      const [, created] = await ActivityType.findOrCreate({
        where: { name: type.name },
        defaults: type,
      });
      console.log(`ActivityType "${type.name}": ${created ? "criado" : "ja existe"}`);
    }
    for (const cargo of USER_CARGOS) {
      const [, created] = await UserCargos.findOrCreate({
        where: {
          name: cargo.name,
          description: cargo.description
        },
        defaults: cargo,
      });
      console.log(`UserCargo "${cargo.name}": ${created ? "criado" : "ja existe"}`);
    }

    // Usuário admin padrão (troque a senha antes de ir para produção!)
    const [adminUser, created] = await User.unscoped().findOrCreate({
      where: { email: "admin@weeklyreports.local" },
      defaults: {
        username: "admin",
        email: "admin@weeklyreports.local",
        password_hash: await bcrypt.hash("Admin@12345", 12),
        role: "admin",
      },
    });

    console.log(`Usuario admin: ${created ? "criado" : "ja existe"}`);
    if (created) {
      console.log("  Email: admin@weeklyreports.local");
      console.log("  Senha: Admin@12345  ← troque em producao!");
    }
    console.log("\nSeed concluido com sucesso.");
    process.exit(0);
  } catch (err) {
    console.error("Erro no seed:", err.message);
    process.exit(1);
  }
}

seed();
