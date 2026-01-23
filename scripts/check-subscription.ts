import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const userId = "052de023-184f-43ab-a2df-e36ef1278dd2";

async function main() {
  console.log("=".repeat(60));
  console.log("Checking user:", userId);
  console.log("=".repeat(60));

  // Check subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { plan: true, cycles: true },
  });
  
  console.log("\n📋 SUBSCRIPTIONS:", subscriptions.length);
  subscriptions.forEach(sub => {
    console.log(`  - ${sub.plan.name} | Status: ${sub.status} | Created: ${sub.createdAt}`);
  });

  // Check recent orders
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { payments: true },
  });

  console.log("\n📦 RECENT ORDERS:", orders.length);
  orders.forEach(order => {
    console.log(`  - ${order.id} | Status: ${order.status} | Total: R$ ${order.totalAmount}`);
    order.payments.forEach(p => {
      console.log(`    Payment: ${p.status} | MP ID: ${p.transactionId}`);
    });
  });

  // Check payments
  const payments = await prisma.payment.findMany({
    where: { order: { userId } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { order: true },
  });

  console.log("\n💳 RECENT PAYMENTS:", payments.length);
  payments.forEach(p => {
    console.log(`  - ${p.id} | Status: ${p.status} | Amount: R$ ${p.amount} | MP: ${p.transactionId}`);
  });

  console.log("\n" + "=".repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
