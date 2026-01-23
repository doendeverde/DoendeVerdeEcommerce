/**
 * Script para aprovar pagamento PIX manualmente (teste)
 * 
 * Uso: npx tsx scripts/approve-pix.ts <PAYMENT_ID>
 * Exemplo: npx tsx scripts/approve-pix.ts 12345678
 * 
 * Este script simula o webhook do Mercado Pago para aprovar um pagamento PIX.
 */

import "dotenv/config";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
  : "http://localhost:3000/api/webhooks/mercadopago";

async function approvePix(paymentId: string) {
  console.log("\n" + "=".repeat(80));
  console.log("🔔 DISPARANDO WEBHOOK DE APROVAÇÃO PIX");
  console.log("=".repeat(80));
  console.log(`   Payment ID: ${paymentId}`);
  console.log(`   Webhook URL: ${WEBHOOK_URL}`);
  console.log("=".repeat(80) + "\n");

  try {
    // Simular webhook do Mercado Pago
    // Formato: POST com query param ?data.id=PAYMENT_ID
    const webhookUrl = `${WEBHOOK_URL}?data.id=${paymentId}`;
    
    console.log("📤 Enviando requisição...");
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MercadoPago/Webhook-Test",
      },
      body: JSON.stringify({
        action: "payment.updated",
        api_version: "v1",
        data: {
          id: paymentId,
        },
        date_created: new Date().toISOString(),
        id: Date.now(),
        live_mode: false,
        type: "payment",
        user_id: "test",
      }),
    });

    console.log(`\n📥 Resposta: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      console.log("   Body:", JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log("   Body:", text);
    }

    if (response.ok) {
      console.log("\n✅ Webhook processado com sucesso!");
      console.log("\n💡 Verifique:");
      console.log("   1. Status do pagamento no banco de dados");
      console.log("   2. Status do pedido (deve estar CONFIRMED)");
      console.log("   3. Criação da assinatura (se aplicável)");
    } else {
      console.log("\n❌ Erro ao processar webhook");
      console.log("   Verifique os logs do servidor para mais detalhes");
    }

  } catch (error) {
    console.log("\n❌ ERRO AO DISPARAR WEBHOOK:");
    if (error instanceof Error) {
      console.log(`   ${error.name}: ${error.message}`);
    } else {
      console.log("   ", error);
    }
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

// Pegar Payment ID do argumento
const paymentId = process.argv[2];

if (!paymentId) {
  console.error("❌ Erro: Payment ID não fornecido");
  console.log("\nUso: npx tsx scripts/approve-pix.ts <PAYMENT_ID>");
  console.log("Exemplo: npx tsx scripts/approve-pix.ts 12345678");
  console.log("\n💡 O Payment ID é exibido nos logs quando você cria um pagamento PIX.");
  process.exit(1);
}

approvePix(paymentId);
