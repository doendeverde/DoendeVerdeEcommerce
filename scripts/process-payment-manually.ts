/**
 * Script para processar pagamento manualmente quando webhook falha
 * Atualiza o status do pagamento e da order quando PIX é aprovado
 * 
 * USO: npx tsx scripts/process-payment-manually.ts <MP_PAYMENT_ID>
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

const paymentId = process.argv[2];

if (!paymentId) {
  console.error("❌ Uso: npx tsx scripts/process-payment-manually.ts <MP_PAYMENT_ID>");
  process.exit(1);
}

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
  console.log("   Status Detail:", mpPayment.status_detail);
  console.log("   External Reference:", mpPayment.external_reference);
  console.log("   Amount:", mpPayment.transaction_amount);
  
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
      items: {
        include: {
          product: {
            select: { name: true }
          }
        }
      },
      user: {
        select: { email: true, fullName: true }
      }
    }
  });

  if (!order) {
    console.log("\n❌ Order não encontrada:", orderId);
    return;
  }

  console.log("   Order ID:", order.id);
  console.log("   Order Status:", order.status);
  console.log("   User:", order.user.email);
  console.log("   Items:", order.items.length);
  for (const item of order.items) {
    console.log(`      - ${item.product.name} (qty: ${item.quantity})`);
  }

  // 3. Update payment status
  const payment = order.payments.find(p => p.transactionId === paymentId);
  if (payment) {
    if (payment.status === "PAID") {
      console.log("\n✅ Payment já está PAID");
    } else {
      console.log("\n💳 Atualizando status do pagamento...");
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          payload: {
            ...(payment.payload as object || {}),
            manuallyProcessed: true,
            processedAt: new Date().toISOString(),
            mpStatus: mpPayment.status,
            mpStatusDetail: mpPayment.status_detail,
          }
        }
      });
      console.log("   ✅ Payment atualizado para PAID");
    }
  } else {
    console.log("\n⚠️ Payment com transactionId", paymentId, "não encontrado na order");
    console.log("   Payments existentes:", order.payments.map(p => p.transactionId));
  }

  // 4. Update order status
  if (order.status === "PAID") {
    console.log("\n✅ Order já está PAID");
  } else {
    console.log("\n📦 Atualizando status da order...");
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" }
    });
    console.log("   ✅ Order atualizada para PAID");
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ PROCESSAMENTO CONCLUÍDO");
  console.log("=".repeat(70));
}

processPayment()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
