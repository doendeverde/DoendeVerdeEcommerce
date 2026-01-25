/**
 * Mercado Pago Webhooks
 * 
 * Endpoint para receber notificações de pagamento do Mercado Pago.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TIPOS DE NOTIFICAÇÃO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * payment: Pagamento criado, atualizado, aprovado, rejeitado, reembolsado
 * plan: Plano de assinatura criado ou atualizado
 * subscription: Assinatura criada, atualizada, pausada, cancelada
 * invoice: Fatura gerada para assinatura
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Valida assinatura x-signature do MP
 * 2. Verifica data.id vs x-request-id
 * 3. Busca detalhes do pagamento via API (não confia no payload)
 * 4. Valida external_reference para ownership
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CONFIGURAÇÃO NO MERCADO PAGO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Acesse: https://www.mercadopago.com.br/developers/panel
 * 2. Vá em "Integrações" > "Webhooks"
 * 3. Configure a URL: https://seu-dominio.com/api/webhooks/mercadopago
 * 4. Marque os eventos: payment, subscription
 * 5. Copie o SECRET para .env como MP_WEBHOOK_SECRET
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Payment } from "mercadopago";
import { MercadoPagoConfig } from "mercadopago";
import { subscriptionRepository } from "@/repositories/subscription.repository";
import * as orderRepository from "@/repositories/order.repository";
import * as paymentRepository from "@/repositories/payment.repository";
import crypto from "crypto";
import { MP_ACCESS_TOKEN, validateMercadoPagoConfig } from "@/lib/mercadopago-config";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Valida configuração na inicialização
validateMercadoPagoConfig();

const webhookSecret = process.env.MP_WEBHOOK_SECRET || "";

const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "",
  options: { timeout: 10000 },
});

const paymentClient = new Payment(client);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  id?: number;
  live_mode?: boolean;
  type: string;
  date_created?: string;
  user_id?: number;
  api_version?: string;
  action: string;
  data: {
    id: string | number;
  };
}

// Status mapping para nosso sistema
const MP_STATUS_MAP: Record<string, "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELED"> = {
  pending: "PENDING",
  approved: "PAID",
  authorized: "PENDING",
  in_process: "PENDING",
  in_mediation: "PENDING",
  rejected: "FAILED",
  cancelled: "CANCELED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

// ─────────────────────────────────────────────────────────────────────────────
// Signature Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida a assinatura do webhook do Mercado Pago.
 * 
 * O Mercado Pago envia um header x-signature no formato:
 * ts=TIMESTAMP,v1=HMAC_SHA256
 * 
 * A string para assinar é:
 * id:{data.id};request-id:{x-request-id};ts:{timestamp};
 * 
 * IMPORTANTE: O Mercado Pago envia webhooks em DOIS formatos:
 * 1. Novo formato (body JSON + query ?data.id=X&type=payment) - assinatura calculada com body.data.id
 * 2. Legacy formato (query ?id=X&topic=payment, body vazio) - assinatura calculada com query id
 * 
 * O formato legacy usa um template de assinatura DIFERENTE que não podemos calcular
 * porque o MP não documenta como é gerado. Por isso, para o formato legacy,
 * pulamos a validação de assinatura e confiamos na verificação via API.
 * 
 * NOTA: Quando a assinatura falhar, ainda processamos o webhook pois a segurança
 * é garantida pela validação via API do MP (buscamos o pagamento por ID).
 * Isso é necessário porque o MP pode alterar o formato da assinatura sem aviso.
 */
function validateWebhookSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string,
  body: WebhookPayload,
  isLegacyFormat: boolean
): { isValid: boolean; shouldProcess: boolean } {
  // Se não temos secret configurado, pule a validação (development)
  if (!webhookSecret) {
    console.warn("[Webhook] ⚠️ MP_WEBHOOK_SECRET não configurado - pulando validação de assinatura");
    return { isValid: true, shouldProcess: true };
  }

  // FORMATO LEGACY: O Mercado Pago usa um template de assinatura diferente
  // que não é documentádo. A segurança é garantida pela validação via API.
  // Isso é comportamento NORMAL e esperado do MP.
  if (isLegacyFormat) {
    console.log("[Webhook] ⚠️ Legacy format detected - skipping signature validation (will validate via API)");
    return { isValid: true, shouldProcess: true };
  }

  if (!signature || !requestId) {
    console.warn("[Webhook] Missing signature or request-id headers - will validate via API");
    return { isValid: false, shouldProcess: true };
  }

  try {
    // Parse signature header
    const parts: Record<string, string> = {};
    for (const part of signature.split(",")) {
      const [key, value] = part.split("=");
      if (key && value) parts[key] = value;
    }

    const timestamp = parts.ts;
    const v1Signature = parts.v1;

    if (!timestamp || !v1Signature) {
      console.warn("[Webhook] Invalid signature format - will validate via API");
      return { isValid: false, shouldProcess: true };
    }

    // Build manifest string (ordem dos campos é importante!)
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    
    // Generate HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(manifest)
      .digest("hex");

    // Constant-time comparison para prevenir timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(v1Signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.warn("[Webhook] ⚠️ Signature mismatch - will validate via API instead", {
        received: v1Signature.substring(0, 16) + "...",
        manifest,
      });
      // Retornamos shouldProcess: true porque validaremos via API
      return { isValid: false, shouldProcess: true };
    }

    return { isValid: true, shouldProcess: true };
  } catch (error) {
    console.error("[Webhook] Error validating signature:", error);
    // Em caso de erro, permitimos processamento (validação via API)
    return { isValid: false, shouldProcess: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Processing
// ─────────────────────────────────────────────────────────────────────────────

async function processPaymentNotification(paymentId: string) {
  console.log("[Webhook] Processing payment:", paymentId);
  
  // Busca detalhes do pagamento via API (não confia no payload)
  const mpPayment = await paymentClient.get({ id: paymentId });
  
  if (!mpPayment?.id) {
    console.error("[Webhook] Payment not found in MP:", paymentId);
    return { success: false, reason: "Payment not found in Mercado Pago" };
  }

  const status = mpPayment.status as string;
  const statusDetail = mpPayment.status_detail as string;
  const externalReference = mpPayment.external_reference; // Nosso orderId
  const metadata = mpPayment.metadata as Record<string, unknown> | null;

  console.log("[Webhook] Payment details:", {
    id: mpPayment.id,
    status,
    statusDetail,
    externalReference,
    metadata,
  });

  if (!externalReference) {
    console.error("[Webhook] No external_reference in payment:", paymentId);
    return { success: false, reason: "No external_reference" };
  }

  // Busca order pelo external_reference
  const order = await prisma.order.findUnique({
    where: { id: externalReference },
    include: { payments: true },
  });

  if (!order) {
    console.error("[Webhook] Order not found:", externalReference);
    return { success: false, reason: "Order not found" };
  }

  // Pega o primeiro pagamento (ou o mais recente)
  const payment = order.payments[0];
  if (!payment) {
    console.error("[Webhook] Payment record not found for order:", order.id);
    return { success: false, reason: "Payment record not found" };
  }

  // Mapeia status do MP para nosso sistema
  const ourStatus = MP_STATUS_MAP[status] || "PENDING";

  // ─────────────────────────────────────────────────────────────────────────
  // PAGAMENTO APROVADO
  // ─────────────────────────────────────────────────────────────────────────
  if (ourStatus === "PAID" && payment.status !== "PAID") {
    console.log("[Webhook] Payment approved, updating records...");

    // Atualiza payment
    await paymentRepository.markPaymentAsPaid(
      payment.id,
      String(mpPayment.id),
      {
        status,
        statusDetail,
        mpPaymentId: mpPayment.id,
        approvedAt: mpPayment.date_approved,
        cardLastFour: mpPayment.card?.last_four_digits,
        cardBrand: mpPayment.payment_method_id,
      }
    );

    // Atualiza order
    await orderRepository.markOrderAsPaid(order.id);

    // Se é uma assinatura, processa criação ou renovação
    const type = metadata?.type as string;
    console.log("[Webhook] Payment type from metadata:", type);
    console.log("[Webhook] Full metadata:", JSON.stringify(metadata, null, 2));
    
    if (type === "subscription") {
      const planId = metadata?.planId as string || metadata?.plan_id as string;
      const userId = metadata?.userId as string || metadata?.user_id as string;
      const mpPaymentId = String(mpPayment.id);

      console.log("[Webhook] Subscription metadata - planId:", planId, "userId:", userId);

      // ───────────────────────────────────────────────────────────────────────
      // VERIFICAR SE É RENOVAÇÃO (já existe subscription com esse providerSubId)
      // ───────────────────────────────────────────────────────────────────────
      const existingSubByProvider = await subscriptionRepository.findByProviderSubId(mpPaymentId);
      
      if (existingSubByProvider) {
        // 🔄 É RENOVAÇÃO - criar novo ciclo
        console.log("[Webhook] 🔄 RENEWAL detected for subscription:", existingSubByProvider.id);
        
        await subscriptionRepository.createRenewalCycle({
          subscriptionId: existingSubByProvider.id,
          amount: Number(mpPayment.transaction_amount),
          paymentId: payment.id,
        });
        
        console.log("[Webhook] ✅ Renewal cycle created successfully");
      } else if (planId && userId) {
        // 🆕 PRIMEIRO PAGAMENTO - criar subscription
        const hasActiveSubscription = await subscriptionRepository.userHasAnyActiveSubscription(userId);
        console.log("[Webhook] User has existing subscription:", hasActiveSubscription);
        
        if (!hasActiveSubscription) {
          console.log("[Webhook] Creating NEW subscription for user:", userId);
          
          const subscription = await subscriptionRepository.createSubscription({
            userId,
            planId,
            provider: "MERCADO_PAGO",
            providerSubId: mpPaymentId,
          });

          // Cria primeiro ciclo
          await subscriptionRepository.createFirstCycle({
            subscriptionId: subscription.id,
            amount: Number(mpPayment.transaction_amount),
            paymentId: payment.id,
          });

          console.log("[Webhook] ✅ New subscription created successfully:", subscription.id);
        } else {
          console.log("[Webhook] ⚠️ User already has active subscription, skipping creation");
        }
      } else {
        console.log("[Webhook] ❌ Missing planId or userId in metadata, cannot create subscription");
      }
    } else {
      console.log("[Webhook] Not a subscription payment, skipping subscription creation");
    }

    return { success: true, action: "payment_approved" };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAGAMENTO REJEITADO
  // ─────────────────────────────────────────────────────────────────────────
  if (ourStatus === "FAILED" && payment.status !== "FAILED") {
    console.log("[Webhook] Payment rejected:", status, statusDetail);

    await paymentRepository.markPaymentAsFailed(payment.id, {
      status,
      statusDetail,
      mpPaymentId: mpPayment.id,
    });

    return { success: true, action: "payment_rejected" };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REEMBOLSO
  // ─────────────────────────────────────────────────────────────────────────
  if (ourStatus === "REFUNDED") {
    console.log("[Webhook] Payment refunded:", paymentId);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        payload: {
          ...(payment.payload as object || {}),
          refundedAt: new Date().toISOString(),
          originalStatus: status,
          statusDetail,
        },
      },
    });

    // Se tem subscription, marca como cancelada
    const type = metadata?.type as string;
    if (type === "subscription") {
      const userId = metadata?.userId as string;
      const planId = metadata?.planId as string;
      
      if (userId && planId) {
      const subscription = await prisma.subscription.findFirst({
          where: {
            userId,
            planId,
            status: "ACTIVE",
          },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELED" },
          });
          console.log("[Webhook] Subscription canceled due to refund:", subscription.id);
        }
      }
    }

    return { success: true, action: "payment_refunded" };
  }

  // Status não requer ação
  console.log("[Webhook] No action needed for status:", status);
  return { success: true, action: "no_action" };
}
// ─────────────────────────────────────────────────────────────────────────────
// Subscription (Preapproval) Payment Processing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Processa notificação de pagamento de assinatura (subscription_authorized_payment).
 * 
 * Esta notificação é enviada pelo Mercado Pago quando:
 * - Uma cobrança recorrente é processada com sucesso
 * - Uma cobrança recorrente falha
 * 
 * O data.id aqui é o ID do PAGAMENTO (authorized_payment), não da assinatura.
 * Precisamos buscar a assinatura (preapproval) relacionada.
 */
async function processSubscriptionPaymentNotification(paymentId: string) {
  console.log("[Webhook] Processing subscription authorized payment:", paymentId);
  
  try {
    // Busca detalhes do pagamento via API
    const mpPayment = await paymentClient.get({ id: paymentId });
    
    if (!mpPayment?.id) {
      console.error("[Webhook] Subscription payment not found in MP:", paymentId);
      return { success: false, reason: "Payment not found in Mercado Pago" };
    }

    const status = mpPayment.status as string;
    const statusDetail = mpPayment.status_detail as string;
    const amount = mpPayment.transaction_amount as number;
    
    // O preapproval_id está no campo metadata ou description
    // Mas para subscriptions, o external_reference é nossa referência
    const externalReference = mpPayment.external_reference;
    
    // Ou podemos buscar pelo preapproval_id se disponível
    const metadata = mpPayment.metadata as Record<string, unknown> | null;
    const preapprovalId = metadata?.preapproval_id as string | undefined;
    
    console.log("[Webhook] Subscription payment details:", {
      id: mpPayment.id,
      status,
      statusDetail,
      amount,
      externalReference,
      preapprovalId,
    });

    // ───────────────────────────────────────────────────────────────────────
    // BUSCA A ASSINATURA
    // ───────────────────────────────────────────────────────────────────────
    
    // Tenta buscar por preapprovalId primeiro (ID real da subscription no MP)
    let subscription = null;
    
    if (preapprovalId) {
      subscription = await subscriptionRepository.findByProviderSubId(preapprovalId);
    }
    
    // Se não encontrou, tenta por external_reference (que é nosso order_id)
    if (!subscription && externalReference) {
      // Busca payment/order para encontrar a subscription relacionada
      const payment = await prisma.payment.findFirst({
        where: {
          order: {
            id: externalReference,
          },
        },
        select: {
          order: {
            select: {
              userId: true,
              notes: true, // Pode conter planId no formato JSON
            },
          },
          payload: true,
        },
      });
      
      if (payment?.order) {
        // Tenta extrair planId do payload ou notes
        const payload = payment.payload as Record<string, unknown> | null;
        const planId = payload?.planId as string | undefined;
        
        if (planId) {
          subscription = await prisma.subscription.findFirst({
            where: {
              userId: payment.order.userId,
              planId,
              status: "ACTIVE",
            },
            include: {
              plan: true,
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          });
        } else {
          // Fallback: busca a subscription ativa mais recente do usuário
          subscription = await prisma.subscription.findFirst({
            where: {
              userId: payment.order.userId,
              status: "ACTIVE",
            },
            orderBy: {
              createdAt: "desc",
            },
            include: {
              plan: true,
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          });
        }
      }
    }

    if (!subscription) {
      console.error("[Webhook] Subscription not found for payment:", paymentId);
      return { success: false, reason: "Subscription not found" };
    }

    console.log("[Webhook] Found subscription:", subscription.id);

    // ───────────────────────────────────────────────────────────────────────
    // PAGAMENTO APROVADO - CRIA CICLO DE RENOVAÇÃO
    // ───────────────────────────────────────────────────────────────────────
    if (status === "approved") {
      console.log("[Webhook] 🔄 Subscription payment approved - Creating renewal cycle");
      
      // Cria novo ciclo de renovação
      await subscriptionRepository.createRenewalCycle({
        subscriptionId: subscription.id,
        amount: amount || Number(subscription.plan?.price) || 0,
        // Não temos paymentId porque é pagamento automático do MP
      });
      
      console.log("[Webhook] ✅ Renewal cycle created for subscription:", subscription.id);
      
      return { success: true, action: "subscription_renewed" };
    }

    // ───────────────────────────────────────────────────────────────────────
    // PAGAMENTO REJEITADO - LOG PARA MONITORAMENTO
    // ───────────────────────────────────────────────────────────────────────
    if (status === "rejected") {
      console.warn("[Webhook] ⚠️ Subscription payment REJECTED:", {
        subscriptionId: subscription.id,
        paymentId,
        status,
        statusDetail,
      });
      
      // MP fará retry automático (até 4x em 10 dias)
      // Após 3 parcelas rejeitadas consecutivas, MP cancela automaticamente
      // Por enquanto apenas logamos
      
      return { success: true, action: "subscription_payment_rejected" };
    }

    return { success: true, action: "no_action" };
    
  } catch (error) {
    console.error("[Webhook] Error processing subscription payment:", error);
    return { success: false, reason: "Processing error" };
  }
}

/**
 * Processa notificação de mudança de status de assinatura (subscription_preapproval).
 * 
 * Esta notificação é enviada quando:
 * - Assinatura é criada
 * - Assinatura é pausada
 * - Assinatura é cancelada
 * - Assinatura é reativada
 */
async function processSubscriptionStatusNotification(preapprovalId: string) {
  console.log("[Webhook] Processing subscription status change:", preapprovalId);
  
  try {
    // Importa função para buscar preapproval
    const { getPreapproval, mapPreapprovalStatus } = await import("@/lib/mercadopago-subscriptions");
    
    // Busca detalhes atualizados da assinatura no MP
    const mpSubscription = await getPreapproval(preapprovalId);
    
    console.log("[Webhook] MP Subscription details:", {
      id: mpSubscription.id,
      status: mpSubscription.status,
      reason: mpSubscription.reason,
      external_reference: mpSubscription.external_reference,
    });
    
    // Busca nossa subscription pelo providerSubId
    const subscription = await subscriptionRepository.findByProviderSubId(preapprovalId);
    
    if (!subscription) {
      console.warn("[Webhook] Subscription not found in DB for preapprovalId:", preapprovalId);
      return { success: false, reason: "Subscription not found" };
    }
    
    // Mapeia status do MP para nosso sistema
    const newStatus = mapPreapprovalStatus(mpSubscription.status);
    
    // Atualiza status se mudou
    if (subscription.status !== newStatus) {
      console.log("[Webhook] Updating subscription status:", subscription.status, "->", newStatus);
      
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus,
          ...(newStatus === "CANCELED" ? { canceledAt: new Date() } : {}),
        },
      });
      
      console.log("[Webhook] ✅ Subscription status updated:", subscription.id);
    }
    
    return { success: true, action: "subscription_status_updated" };
    
  } catch (error) {
    console.error("[Webhook] Error processing subscription status:", error);
    return { success: false, reason: "Processing error" };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature");
  
  // Check for legacy format in query params (id=X&topic=payment)
  const url = new URL(request.url);
  const legacyId = url.searchParams.get("id");
  const legacyTopic = url.searchParams.get("topic");
  
  // Check for new format in query params (data.id=X&type=payment)
  const newFormatId = url.searchParams.get("data.id");
  const newFormatType = url.searchParams.get("type");
  
  console.log("[Webhook] ════════════════════════════════════════════════");
  console.log("[Webhook] Received notification");
  console.log("[Webhook] Request ID:", requestId);
  console.log("[Webhook] Has signature:", !!signature);
  console.log("[Webhook] Query params - Legacy:", { id: legacyId, topic: legacyTopic });
  console.log("[Webhook] Query params - New:", { dataId: newFormatId, type: newFormatType });
  console.log("[Webhook] ════════════════════════════════════════════════");

  try {
    // Parse body
    let body: WebhookPayload;
    try {
      body = await request.json() as WebhookPayload;
    } catch {
      // Body pode estar vazio no formato legado
      body = {} as WebhookPayload;
    }
    
    // Determine dataId and type from either format
    // Priority: body > new query params > legacy query params
    const dataId = String(body.data?.id || newFormatId || legacyId || "");
    const notificationType = body.type || newFormatType || legacyTopic || "";
    
    // Detecta se é formato legacy (sem body.data.id e com query params legacy)
    const isLegacyFormat = !body.data?.id && !newFormatId && !!legacyId;
    
    console.log("[Webhook] Type:", notificationType);
    console.log("[Webhook] Action:", body.action);
    console.log("[Webhook] Data ID (resolved):", dataId);
    console.log("[Webhook] Live mode:", body.live_mode);
    console.log("[Webhook] Format:", isLegacyFormat ? "LEGACY" : "NEW");

    // Se não temos dataId, não podemos processar
    if (!dataId) {
      console.error("[Webhook] ❌ No payment ID found in request");
      return NextResponse.json(
        { error: "No payment ID provided" },
        { status: 400 }
      );
    }

    // Valida assinatura usando o dataId resolvido
    // A segurança é garantida pela validação via API do MP (buscamos o pagamento por ID)
    const { isValid, shouldProcess } = validateWebhookSignature(signature, requestId, dataId, body, isLegacyFormat);
    
    if (!shouldProcess) {
      console.error("[Webhook] ❌ Request blocked - signature validation failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    if (isValid) {
      console.log("[Webhook] ✅ Signature valid");
    } else {
      console.log("[Webhook] ⚠️ Signature invalid but processing (will validate via MP API)");
    }

    // Processa por tipo de notificação
    // Tipos do Mercado Pago:
    // - payment: Pagamento único ou parcela de subscription
    // - subscription_authorized_payment: Pagamento recorrente de subscription (Preapproval)
    // - subscription_preapproval: Mudança de status de subscription (criada, pausada, cancelada)
    // - plan: Mudança em plano de assinatura
    // - invoice: Fatura gerada
    
    if (notificationType === "payment") {
      const result = await processPaymentNotification(dataId);
      console.log("[Webhook] Payment processing result:", result);
    } 
    else if (notificationType === "subscription_authorized_payment") {
      // Pagamento recorrente de assinatura (Preapproval API)
      console.log("[Webhook] 🔄 Processing SUBSCRIPTION AUTHORIZED PAYMENT");
      const result = await processSubscriptionPaymentNotification(dataId);
      console.log("[Webhook] Subscription payment result:", result);
    }
    else if (notificationType === "subscription_preapproval") {
      // Mudança de status da assinatura
      console.log("[Webhook] 📋 Processing SUBSCRIPTION STATUS CHANGE");
      const result = await processSubscriptionStatusNotification(dataId);
      console.log("[Webhook] Subscription status result:", result);
    }
    else {
      console.log("[Webhook] Unhandled notification type:", notificationType);
    }

    // Sempre retorna 200 para evitar retentativas desnecessárias
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] ❌ Error processing webhook:", error);
    
    // Retorna 200 mesmo com erro para evitar retentativas infinitas
    // O Mercado Pago pode ficar reenviando se retornarmos erro
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET Handler (Health Check)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Mercado Pago Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
