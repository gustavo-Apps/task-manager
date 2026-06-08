/**
 * Seed — popula o banco com dados iniciais.
 *
 * Uso:
 *   cd backend
 *   npm run db:seed
 *
 * O que cria:
 *   - 5 status de tarefa (Pendente, Em andamento, Concluido, Bloqueado, Cancelado)
 *   - 8 tipos de atividade (Teste, Validação, Reunião, etc.)
 *   - 5 cargos (Desenvolvedor, Analista de Testes, etc.)
 *   - 1 usuário admin padrão:\n *       Email: admin@weeklyreports.local
 *       Senha: Admin@12345   ← troque no primeiro acesso (Perfil no menu)
 *
 * Seguro para rodar mais de uma vez — usa findOrCreate, não duplica dados.
 */

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const { User, ActivityType, TaskStatus, UserCargos } = require("../models");

// ─── Dados iniciais ───────────────────────────────────────────────────────────

const TASK_STATUSES = [
  { name: "Pendente",     description: "Aguardando início",         color: "#F59E0B", sort_order: 1 },
  { name: "Em andamento", description: "Sendo trabalhado agora",    color: "#3B82F6", sort_order: 2 },
  { name: "Concluido",    description: "Finalizado com sucesso",    color: "#10B981", sort_order: 3 },
  { name: "Bloqueado",    description: "Impedido por dependência",  color: "#EF4444", sort_order: 4 },
  { name: "Cancelado",    description: "Não será mais realizado",   color: "#6B7280", sort_order: 5 },
];

const ACTIVITY_TYPES = [
  { name: "Teste",          description: "Execução de casos de teste",                 color: "#3B82F6" },
  { name: "Validacao",      description: "Validação de funcionalidade ou correção",    color: "#10B981" },
  { name: "Reuniao",        description: "Reunião de equipe ou alinhamento",           color: "#F59E0B" },
  { name: "Documentacao",   description: "Elaboração ou revisão de documentos",        color: "#8B5CF6" },
  { name: "Desenvolvimento",description: "Implementação de funcionalidade",            color: "#EF4444" },
  { name: "Analise",        description: "Análise de requisito, bug ou sistema",       color: "#06B6D4" },
  { name: "Deploy",         description: "Publicação ou configuração de ambiente",     color: "#EC4899" },
  { name: "Suporte",        description: "Suporte a usuários ou equipes",              color: "#6B7280" },
];

const USER_CARGOS = [
  { name: "Desenvolvedor",         description: "Responsável por implementar funcionalidades e corrigir bugs" },
  { name: "Analista de Testes",    description: "Responsável por criar e executar casos de teste" },
  { name: "Gerente de Projeto",    description: "Responsável por planejar, coordenar e acompanhar o progresso" },
  { name: "Analista de Requisitos",description: "Responsável por coletar, analisar e documentar requisitos" },
  { name: "Engenheiro de DevOps",  description: "Responsável por configurar e manter ambientes de infra" },
];

const ADMIN_USER = {
  username:      "admin",
  email:         "admin@weeklyreports.local",
  password:      "Admin@12345",  // troque no primeiro acesso
  role:          "admin",
  cargo:         1,
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log("Conectando ao banco...");
    await sequelize.authenticate();

    console.log("Sincronizando schema (alter)...");
    await sequelize.sync({ alter: true });

    // Status de tarefa
    console.log("\nStatus de tarefa:");
    for (const s of TASK_STATUSES) {
      const [, created] = await TaskStatus.findOrCreate({ where: { name: s.name }, defaults: s });
      console.log(`  ${created ? "✔ criado " : "· existe "} ${s.name}`);
    }

    // Tipos de atividade
    console.log("\nTipos de atividade:");
    for (const t of ACTIVITY_TYPES) {
      const [, created] = await ActivityType.findOrCreate({ where: { name: t.name }, defaults: t });
      console.log(`  ${created ? "✔ criado " : "· existe "} ${t.name}`);
    }

    // Cargos
    console.log("\nCargos:");
    for (const c of USER_CARGOS) {
      const [, created] = await UserCargos.findOrCreate({ where: { name: c.name }, defaults: c });
      console.log(`  ${created ? "✔ criado " : "· existe "} ${c.name}`);
    }

    // Usuário admin
    console.log("\nUsuário admin:");
    const [, created] = await User.unscoped().findOrCreate({
      where: { email: ADMIN_USER.email },
      defaults: {
        username:      ADMIN_USER.username,
        email:         ADMIN_USER.email,
        password_hash: await bcrypt.hash(ADMIN_USER.password, 12),
        role:          ADMIN_USER.role,
        cargo:         ADMIN_USER.cargo,
      },
    });

    if (created) {
      console.log("  ✔ criado");
      console.log("  ┌─────────────────────────────────────────┐");
      console.log(`  │  Email: ${ADMIN_USER.email.padEnd(32)}│`);
      console.log(`  │  Senha: ${ADMIN_USER.password.padEnd(32)}│`);
      console.log("  │  ⚠  Troque a senha no primeiro acesso!  │");
      console.log("  └─────────────────────────────────────────┘");
    } else {
      console.log("  · já existe");
    }

    console.log("\nSeed concluído com sucesso.");
    process.exit(0);
  } catch (err) {
    console.error("\nErro no seed:", err.message);
    process.exit(1);
  }
}

seed();
