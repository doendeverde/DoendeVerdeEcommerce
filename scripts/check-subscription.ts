/**
 * Script para verificar assinatura de um usuário
 * 
 * Uso: npx tsx scripts/check-subscription.ts [email]
 * Exemplo: npx tsx scripts/check-subscription.ts delmiro.carrilho@gmail.com
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || "delmiro.carrilho@gmail.com";

  console.log("\n🔍 Verificando assinatura para:", email);
  console.log("=".repeat(70));

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  if (!user) {
    console.log("❌ Usuário não encontrado com email:", email);
    return;
  }

  console.log("\n👤 Usuário:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.fullName}`);
  console.log(`   Email: ${user.email}`);

  // Buscar assinaturas (Subscription)
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    include: {
      plan: {
        select: {
          name: true,
          slug: true,
          price: true,
          billingCycle: true,
          discountPercent: true,
        },
      },
      cycles: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (subscriptions.length === 0) {
    console.log("\n❌ Nenhuma assinatura (Subscription) encontrada");
  } else {
    console.log(`\n✅ ASSINATURAS ENCONTRADAS: ${subscriptions.length}`);
    
    for (const sub of subscriptions) {
      console.log("\n" + "-".repeat(60));
      console.log(`   🎫 Plano: ${sub.plan.name} (${sub.plan.slug})`);
      console.log(`   📊 Status: ${sub.status}`);
      console.log(`   💰 Preço: R$ ${Number(sub.plan.price).toFixed(2)}`);
      console.log(`   🏷️  Desconto: ${sub.plan.discountPercent}%`);
      console.log(`   🔄 Ciclo: ${sub.plan.billingCycle}`);
      console.log(`   📅 Iniciou em: ${sub.startedAt?.toLocaleDateString("pt-BR")} ${sub.startedAt?.toLocaleTimeString("pt-BR") || ""}`);
      console.log(`   ⏰ Próxima cobrança: ${sub.nextBillingAt?.toLocaleDateString("pt-BR")} ${sub.nextBillingAt?.toLocaleTimeString("pt-BR") || "N/A"}`);
      console.log(`   📝 Criado em: ${sub.createdAt.toLocaleDateString("pt-BR")} ${sub.createdAt.toLocaleTimeString("pt-BR")}`);
      console.log(`   🆔 Subscription ID: ${sub.id}`);
      console.log(`   🔗 Provider: ${sub.provider || "N/A"}`);
      console.log(`   🔗 Provider Sub ID: ${sub.providerSubId || "N/A"}`);
      
      if (sub.cycles.length > 0) {
        console.log(`\n   📆 Ciclos recentes:`);
        for (const cycle of sub.cycles) {
          console.log(`      - ${cycle.cycleStart.toLocaleDateString("pt-BR")} → ${cycle.cycleEnd.toLocaleDateString("pt-BR")} | ${cycle.status} | R$ ${Number(cycle.amount).toFixed(2)}`);
        }
      }
    }
  }

  // Buscar pedidos recentes (não há mais subscriptionPlanId no Order)
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
    include: {
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          amount: true,
          transactionId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (orders.length > 0) {
    console.log("\n\n📦 PEDIDOS RECENTES:");
    for (const order of orders) {
      console.log("\n" + "-".repeat(60));
      console.log(`   🆔 Order ID: ${order.id}`);
      console.log(`   📊 Status: ${order.status}`);
      console.log(`   💰 Total: R$ ${Number(order.totalAmount).toFixed(2)}`);
      console.log(`   📅 Criado em: ${order.createdAt.toLocaleDateString("pt-BR")} ${order.createdAt.toLocaleTimeString("pt-BR")}`);
      
      if (order.payments.length > 0) {
        console.log(`   💳 Pagamentos:`);
        for (const payment of order.payments) {
          console.log(`      - ${payment.provider}: ${payment.status}`);
          console.log(`        Valor: R$ ${Number(payment.amount).toFixed(2)}`);
          if (payment.transactionId) {
            console.log(`        Transaction ID: ${payment.transactionId}`);
          }
          console.log(`        Criado: ${payment.createdAt.toLocaleDateString("pt-BR")} ${payment.createdAt.toLocaleTimeString("pt-BR")}`);
        }
      }
    }
  } else {
    console.log("\n\n📦 Nenhum pedido encontrado");
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ Verificação concluída\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
