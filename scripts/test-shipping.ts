/**
 * Script de teste para diagnóstico do serviço de frete
 * 
 * Uso: npx tsx scripts/test-shipping.ts [CEP]
 * Exemplo: npx tsx scripts/test-shipping.ts 01310100
 */

import "dotenv/config";

const CONFIG = {
  ORIGIN_CEP: process.env.SHIPPING_ORIGIN_CEP || "01310100",
  API_TIMEOUT: 10000,
  MELHOR_ENVIO_URL:
    process.env.NODE_ENV === "production" || process.env.MELHOR_ENVIO_PRODUCTION === "true"
      ? "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate"
      : "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
  USE_EXTERNAL_API: process.env.SHIPPING_USE_EXTERNAL_API === "true",
};

async function testShippingAPI(destinationCep: string) {
  console.log("\n" + "=".repeat(60));
  console.log("🚚 TESTE DE FRETE - DIAGNÓSTICO");
  console.log("=".repeat(60));

  // 1. Verificar variáveis de ambiente
  console.log("\n📋 VARIÁVEIS DE AMBIENTE:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "não definido"}`);
  console.log(`   MELHOR_ENVIO_PRODUCTION: ${process.env.MELHOR_ENVIO_PRODUCTION || "não definido"}`);
  console.log(`   SHIPPING_USE_EXTERNAL_API: ${process.env.SHIPPING_USE_EXTERNAL_API}`);
  console.log(`   SHIPPING_ORIGIN_CEP: ${process.env.SHIPPING_ORIGIN_CEP || "não definido (usando 01310100)"}`);
  console.log(`   MELHOR_ENVIO_TOKEN definido: ${!!process.env.MELHOR_ENVIO_TOKEN}`);
  console.log(`   Token começa com: ${process.env.MELHOR_ENVIO_TOKEN?.substring(0, 30)}...`);

  // 2. Verificar configuração final
  console.log("\n⚙️ CONFIGURAÇÃO CALCULADA:");
  console.log(`   USE_EXTERNAL_API: ${CONFIG.USE_EXTERNAL_API}`);
  console.log(`   API URL: ${CONFIG.MELHOR_ENVIO_URL}`);
  console.log(`   ORIGIN_CEP: ${CONFIG.ORIGIN_CEP}`);
  console.log(`   Destination CEP: ${destinationCep}`);

  // 3. Verificar se vai usar API ou fallback
  console.log("\n🔀 DECISÃO DE ROTEAMENTO:");
  if (CONFIG.USE_EXTERNAL_API && process.env.MELHOR_ENVIO_TOKEN) {
    console.log("   ✅ VAI USAR API EXTERNA (Melhor Envio)");
  } else {
    console.log("   ⚠️ VAI USAR FALLBACK (taxas fixas regionais)");
    if (!CONFIG.USE_EXTERNAL_API) {
      console.log("   → Razão: SHIPPING_USE_EXTERNAL_API não é 'true'");
    }
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      console.log("   → Razão: MELHOR_ENVIO_TOKEN não está definido");
    }
    return;
  }

  // 4. Fazer requisição de teste
  console.log("\n🌐 TESTANDO API MELHOR ENVIO:");
  
  const requestBody = {
    from: { postal_code: CONFIG.ORIGIN_CEP },
    to: { postal_code: destinationCep },
    package: {
      weight: 0.5, // 500g
      width: 20,
      height: 10,
      length: 30,
    },
  };

  console.log("   Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    const response = await fetch(CONFIG.MELHOR_ENVIO_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log(`\n   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get("content-type")}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("\n❌ ERRO NA RESPOSTA:");
      console.log(`   Status: ${response.status}`);
      console.log(`   Resposta: ${errorText}`);
      return;
    }

    const data = await response.json();

    console.log(`\n✅ RESPOSTA RECEBIDA (${Array.isArray(data) ? data.length : 1} serviços):`);
    
    if (Array.isArray(data)) {
      const valid = data.filter((item: any) => !item.error && parseFloat(item.price) > 0);
      const invalid = data.filter((item: any) => item.error || parseFloat(item.price) <= 0);

      console.log(`\n   📦 OPÇÕES VÁLIDAS (${valid.length}):`);
      valid.forEach((item: any) => {
        console.log(`      - ${item.company?.name || "?"} ${item.name}`);
        console.log(`        Preço: R$ ${parseFloat(item.price).toFixed(2)}`);
        console.log(`        Prazo: ${item.delivery_range?.min}-${item.delivery_range?.max} dias`);
      });

      if (invalid.length > 0) {
        console.log(`\n   ⚠️ OPÇÕES COM ERRO (${invalid.length}):`);
        invalid.forEach((item: any) => {
          console.log(`      - ${item.company?.name || "?"} ${item.name}`);
          console.log(`        Erro: ${item.error || "Preço zerado"}`);
        });
      }
    } else {
      console.log("   Resposta (não é array):", JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.log("\n❌ EXCEÇÃO NA REQUISIÇÃO:");
    if (error instanceof Error) {
      console.log(`   Nome: ${error.name}`);
      console.log(`   Mensagem: ${error.message}`);
    } else {
      console.log("   Erro:", error);
    }
  }

  console.log("\n" + "=".repeat(60));
}

// Pegar CEP do argumento ou usar padrão
const testCep = process.argv[2] || "22041080"; // RJ - Copacabana
const useAlternateToken = process.argv[3] === "--alt";

if (useAlternateToken) {
  process.env.MELHOR_ENVIO_TOKEN = process.env.POLITI_MELHOR_ENVIO_TOKEN;
  console.log("\n⚠️ USANDO TOKEN ALTERNATIVO (POLITI_MELHOR_ENVIO_TOKEN)");
}

testShippingAPI(testCep);
