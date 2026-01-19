/**
 * Script para tornar um usuário ADMIN
 * 
 * Uso:
 *   npx tsx scripts/make-admin.ts <USER_ID>
 * 
 * Exemplo:
 *   npx tsx scripts/make-admin.ts 123e4567-e89b-12d3-a456-426614174000
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

async function makeAdmin(userId: string) {
  if (!userId) {
    console.error("❌ Erro: Você precisa passar o ID do usuário como argumento");
    console.log("\nUso: npx tsx scripts/make-admin.ts <USER_ID>");
    process.exit(1);
  }

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) {
      console.error(`❌ Erro: Usuário com ID "${userId}" não encontrado`);
      process.exit(1);
    }

    if (user.role === "ADMIN") {
      console.log(`⚠️  O usuário "${user.email}" já é ADMIN`);
      process.exit(0);
    }

    // Atualizar para ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
      select: { id: true, email: true, fullName: true, role: true },
    });

    console.log("\n✅ Usuário atualizado para ADMIN com sucesso!\n");
    console.log("   ID:", updatedUser.id);
    console.log("   Nome:", updatedUser.fullName || "(não definido)");
    console.log("   Email:", updatedUser.email);
    console.log("   Role:", updatedUser.role);
    console.log("\n🔗 Acesse: http://localhost:3000/admin\n");

  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Pegar o ID do argumento da linha de comando
const userId = process.argv[2];
makeAdmin(userId);
