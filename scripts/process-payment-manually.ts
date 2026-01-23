/**
 * Script para processar pagamento manualmente quando webhook falha
 * Atualiza o status do pagamento e cria a subscription se for PIX aprovado
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Payment, MercadoPagoConfig } from "mercadopago";
import * as dotenv from "dotenv";

dotenv.config();

// Setup Prisma
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Setup MercadoPago
const isProduction = process.env.MP_USE_PRODUCTION === "true";
const accessToken = isProduction 
  ? process.env.MP_PROD_ACCESS_TOKEN 
  : process.env.MP_TEST_ACCESS_TOKEN;
if (!accessToken) throw new Error("MP Access Token not found");
const mpConfig = new MercadoPagoConfig({ accessToken });
const paymentClient = new Payment(mpConfig);

const paymentId = process.argv[2] || "142602039851";

async function processPayment() {
  console.log("=".repeat(70));
  console.log("🔧 PROCESSANDO PAGAMENTO MANUALMENTE");
  console.log("=".repeat(70));
  console.log("   Payment ID:", paymentId);
  console.log("   Mode:", isProduction ? "PRODUCTION" : "TEST");
  console.log("=".repeat(70));

  // 1. Get payment from Mercado Pago
  console.log("\n📡 Buscando pagamento no Mercado Pago...");
  const mpPayment = await paymentClient.get({ id: paymentId });
  
  console.log("   Status:", mpPayment.status);
  console.log("   External Reference:", mpPayment.external_reference);
  
  if (mpPayment.status !== "approved") {
    console.log("\n❌ Pagamento não está aprovado. Status:", mpPayment.status);
    return;
  }

  const orderId = mpPayment.external_reference;
  if (!orderId) {
    console.log("\n❌ External reference (orderId) não encontrado");
    return;
  }

  // 2. Find order and payment in database
  console.log("\n📦 Buscando order no banco...");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      payments: true,
      items: true,
      user: true
    }
  });

  if (!order) {
    console.log("\n❌ Order não encontrada:", orderId);
    return;
  }

  console.log("   Order ID:", order.id);
  console.log("   Order Type:", order.type);
  console.log("   Order Status:", order.status);
  console.log("   User:", order.user.email);
  console.log("   Items:", order.items.length);

  // 3. Update payment status
  const payment = order.payments.find(p => p.transactionId === paymentId);
  if (payment) {
    console.log("\n💳 Atualizando status do pagamento...");
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : new Date()
      }
    });
    console.log("   ✅ Payment atualizado para PAID");
  }

  // 4. Update order status
  console.log("\n📦 Atualizando status da order...");
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID" }
  });
  console.log("   ✅ Order atualizada para PAID");

  // 5. If subscription order, create subscription
  if (order.type === "SUBSCRIPTION") {
    console.log("\n🔔 Order de subscription detectada!");
    
    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findFirst({
      where: { 
        userId: order.userId,
        status: "ACTIVE"
      }
    });

    if (existingSubscription) {
      console.log("   ⚠️ Usuário já tem subscription ativa:", existingSubscription.id);
    } else {
      // Get plan ID from order items or metadata
      // Try to find the subscription plan in order items
      const subscriptionItem = order.items.find(item => item.subscriptionPlanId);
      
      if (subscriptionItem?.subscriptionPlanId) {
        console.log("   Plan ID encontrado:", subscriptionItem.subscriptionPlanId);
        
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: subscriptionItem.subscriptionPlanId }
        });

        if (plan) {
          // Calculate next billing date
          const nextBillingDate = new Date();
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          // Create subscription
          const subscription = await prisma.subscription.create({
            data: {
              userId: order.userId,
              planId: plan.id,
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: nextBillingDate,
              nextBillingDate: nextBillingDate
            }
          });
          console.log("   ✅ Subscription criada:", subscription.id);
          console.log("   ✅ Plan:", plan.name);
          console.log("   ✅ Next billing:", nextBillingDate);
        }
      } else {
        console.log("   ⚠️ Não foi possível encontrar planId nos items da order");
        console.log("   Items:", JSON.stringify(order.items, null, 2));
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ PROCESSAMENTO CONCLUÍDO");
  console.log("=".repeat(70));
}

processPayment()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
