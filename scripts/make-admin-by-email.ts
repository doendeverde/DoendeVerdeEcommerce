/**
 * Script para tornar um usuário ADMIN pelo EMAIL
 * 
 * Uso:
 *   npx tsx scripts/make-admin-by-email.ts <EMAIL>
 * 
 * Exemplo:
 *   npx tsx scripts/make-admin-by-email.ts usuario@email.com
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config();

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL não está configurada no .env");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function makeAdminByEmail(email: string) {
  if (!email) {
    console.error("❌ Erro: Você precisa passar o EMAIL do usuário como argumento");
    console.log("\nUso: npx tsx scripts/make-admin-by-email.ts <EMAIL>");
    console.log("Exemplo: npx tsx scripts/make-admin-by-email.ts usuario@email.com");
    process.exit(1);
  }

  // Normalizar email para lowercase
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) {
      console.error(`❌ Erro: Usuário com email "${normalizedEmail}" não encontrado`);
      process.exit(1);
    }

    if (user.role === "ADMIN") {
      console.log(`⚠️  O usuário "${user.email}" já é ADMIN`);
      process.exit(0);
    }

    // Atualizar role para ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
      select: { id: true, email: true, fullName: true, role: true },
    });

    console.log("\n✅ Usuário promovido a ADMIN com sucesso!\n");
    console.log("Detalhes:");
    console.log(`  ID:    ${updatedUser.id}`);
    console.log(`  Nome:  ${updatedUser.fullName || "(não informado)"}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role:  ${updatedUser.role}`);
    console.log("\n🎉 O usuário agora tem acesso ao painel administrativo em /admin");

  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const email = process.argv[2];
makeAdminByEmail(email);
