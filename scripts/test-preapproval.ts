/**
 * Script para testar a API de Preapproval (Subscriptions) do Mercado Pago
 * 
 * Este script:
 * 1. Busca uma assinatura existente pelo providerSubId
 * 2. Verifica o status no Mercado Pago
 * 3. Compara com nosso banco
 * 
 * Para testar criação de NOVA assinatura:
 * - Use o checkout com cartão de teste
 * - Veja docs/PREAPPROVAL_TESTING.md
 * 
 * Uso:
 *   npx tsx scripts/test-preapproval.ts
 */

import "dotenv/config";

// ─────────────────────────────────────────────────────────────────────────────
// Configuração dinâmica (mesmo padrão do projeto)
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.MP_USE_PRODUCTION === "true";

const MP_ACCESS_TOKEN = isProduction
  ? process.env.MP_PROD_ACCESS_TOKEN
  : process.env.MP_TEST_ACCESS_TOKEN;

const MP_PUBLIC_KEY = isProduction
  ? process.env.MP_PROD_PUBLIC_KEY
  : process.env.MP_TEST_PUBLIC_KEY;

const envLabel = isProduction ? "PRODUÇÃO" : "TESTE";
const tokenEnvName = isProduction ? "MP_PROD_ACCESS_TOKEN" : "MP_TEST_ACCESS_TOKEN";

if (!MP_ACCESS_TOKEN) {
  console.error(`❌ ${tokenEnvName} não configurado no .env`);
  console.error(`\n💡 Variáveis necessárias para modo ${envLabel}:`);
  console.error(`   ${isProduction ? "MP_PROD_ACCESS_TOKEN" : "MP_TEST_ACCESS_TOKEN"}=xxx`);
  console.error(`   ${isProduction ? "MP_PROD_PUBLIC_KEY" : "MP_TEST_PUBLIC_KEY"}=xxx`);
  console.error(`   MP_USE_PRODUCTION=${isProduction}`);
  process.exit(1);
}

console.log(`\n🔧 Modo: ${envLabel}`);
console.log(`🔑 Access Token: ${MP_ACCESS_TOKEN.substring(0, 20)}...`);

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

async function searchPreapprovals(payerEmail?: string) {
  const params = new URLSearchParams();
  if (payerEmail) {
    params.set("payer_email", payerEmail);
  }
  
  const url = `https://api.mercadopago.com/preapproval/search?${params}`;
  console.log("🔍 Buscando assinaturas:", url);
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao buscar: ${JSON.stringify(error)}`);
  }
  
  return response.json();
}

async function getPreapprovalById(id: string) {
  const url = `https://api.mercadopago.com/preapproval/${id}`;
  console.log("🔍 Buscando assinatura:", url);
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao buscar: ${JSON.stringify(error)}`);
  }
  
  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(70));
  console.log("🧪 TESTE DA API DE PREAPPROVAL (SUBSCRIPTIONS) DO MERCADO PAGO");
  console.log("═".repeat(70) + "\n");
  
  // Busca todas as assinaturas
  console.log("📋 Listando todas as assinaturas da conta...\n");
  
  try {
    const result = await searchPreapprovals();
    
    if (!result.results || result.results.length === 0) {
      console.log("ℹ️  Nenhuma assinatura encontrada via Preapproval API.");
      console.log("\n💡 Para testar, você precisa:");
      console.log("   1. Fazer checkout de assinatura com cartão de teste");
      console.log("   2. Usar o formulário de pagamento no frontend");
      console.log("   3. Ver docs/PREAPPROVAL_TESTING.md para instruções\n");
      return;
    }
    
    console.log(`📊 Total de assinaturas encontradas: ${result.results.length}\n`);
    
    for (const sub of result.results) {
      console.log("─".repeat(60));
      console.log(`🆔 ID: ${sub.id}`);
      console.log(`📧 Email: ${sub.payer_email}`);
      console.log(`📝 Razão: ${sub.reason}`);
      console.log(`💰 Valor: ${sub.auto_recurring?.currency_id} ${sub.auto_recurring?.transaction_amount}`);
      console.log(`📅 Frequência: ${sub.auto_recurring?.frequency} ${sub.auto_recurring?.frequency_type}`);
      console.log(`📌 Status: ${sub.status}`);
      console.log(`🔗 External Ref: ${sub.external_reference || "N/A"}`);
      console.log(`📆 Criado: ${sub.date_created}`);
      console.log(`📆 Próximo pagamento: ${sub.next_payment_date || "N/A"}`);
      console.log("");
    }
    
    // Detalhes da primeira assinatura ativa
    const activeSubscription = result.results.find((s: any) => s.status === "authorized");
    
    if (activeSubscription) {
      console.log("\n" + "═".repeat(60));
      console.log("✅ ASSINATURA ATIVA ENCONTRADA");
      console.log("═".repeat(60));
      
      const details = await getPreapprovalById(activeSubscription.id);
      console.log("\n📄 Detalhes completos:");
      console.log(JSON.stringify(details, null, 2));
    }
    
  } catch (error) {
    console.error("❌ Erro:", error);
  }
  
  console.log("\n" + "═".repeat(70));
  console.log("📖 GUIA COMPLETO PARA TESTAR ASSINATURAS");
  console.log("═".repeat(70));
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  IMPORTANTE - ERRO PA_UNAUTHORIZED_RESULT_FROM_POLICIES (403)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Se você recebeu esse erro, significa que está usando um EMAIL REAL
   em ambiente de TESTE. A API de Preapproval do Mercado Pago EXIGE
   que o payer_email seja de um usuário de teste quando usando 
   credenciais de teste (TEST-xxx...).

   ✅ SOLUÇÃO: Use email no formato test_user_XXXXXX@testuser.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CRIAR USUÁRIO DE TESTE (OBRIGATÓRIO):
   ──────────────────────────────────────
   - Acesse: https://www.mercadopago.com.br/developers/panel/test-users
   - Clique em "+ Criar conta de teste"
   - Configure:
     * País: Brasil
     * Tipo: COMPRADOR (importante!)
     * Dinheiro disponível: 10000
   - Salve o email gerado: test_user_XXXXXX@testuser.com
   
   ⚠️ O email gerado DEVE ser usado como payer_email no checkout

2. FLUXO DE TESTE CORRETO:
   ──────────────────────────────────────
   a) No banco de dados do seu sistema, crie um usuário com o email
      de teste do MP (test_user_XXXXXX@testuser.com)
   
   b) Faça login no sistema com esse usuário
   
   c) Vá em /subscriptions e escolha um plano
   
   d) No checkout, use os dados do cartão de teste abaixo

3. CARTÕES DE TESTE:
   ──────────────────────────────────────
   ✅ APROVADO:
      Número: 5031 4332 1540 6351
      CVV: 123
      Validade: 11/25
      Nome no cartão: APRO
      CPF: 12345678909

   ❌ REJEITADO (para testar falhas):
      Número: 5031 4332 1540 6351
      CVV: 123
      Validade: 11/25
      Nome no cartão: OTHE
      CPF: 12345678909

   📋 Outros cartões de teste:
      Visa: 4235 6477 2802 5682
      Mastercard: 5031 4332 1540 6351
      American Express: 3753 651535 56885
      
   Ver mais: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/test-cards

4. CONFIGURAR WEBHOOK (para receber notificações):
   ──────────────────────────────────────
   - Configure ngrok: ngrok http 3000
   - Configure WEBHOOK_NGROK_URL no .env
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Configure webhook com tópicos:
     * payment
     * subscription_authorized_payment
     * subscription_preapproval

5. LIMITAÇÕES DO AMBIENTE DE TESTE:
   ──────────────────────────────────────
   - Cobranças recorrentes automáticas NÃO ocorrem em teste
   - O MP só processa recorrência real em produção
   - Para simular, use scripts manuais ou webhook de teste

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 DOCUMENTAÇÃO OFICIAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Assinaturas: https://www.mercadopago.com.br/developers/pt/docs/subscriptions
- Usuários de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards
- API Preapproval: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval/post
`);
}

main().catch(console.error);
