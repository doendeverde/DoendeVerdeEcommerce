/**
 * Subscription Service - Mercado Pago Preapproval
 * 
 * Serviço para gerenciamento de assinaturas recorrentes usando
 * a API de Preapproval do Mercado Pago.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLUXO DE ASSINATURA COM PREAPPROVAL:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Frontend tokeniza cartão via MercadoPago.js
 * 2. Backend cria assinatura via POST /preapproval
 * 3. MP faz primeira cobrança automaticamente
 * 4. MP envia webhook subscription_authorized_payment
 * 5. MP cobra automaticamente todo mês
 * 6. Cada cobrança gera novo webhook subscription_authorized_payment
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RETRY AUTOMÁTICO DO MP:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * - Se pagamento falhar: 4 tentativas em janela de 10 dias
 * - Após 3 parcelas consecutivas rejeitadas: cancelamento automático
 * - Vendedor é notificado por email de cada evento
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/subscriptions
 */

import {
  createPreapproval,
  getPreapproval,
  pausePreapproval,
  resumePreapproval,
  cancelPreapproval,
  type PreapprovalResponse,
} from "@/lib/mercadopago-subscriptions";
import { 
  getMercadoPagoWebhookUrl, 
  getMercadoPagoBackUrl 
} from "@/lib/environment";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRecurringSubscriptionRequest {
  /** Token do cartão gerado pelo frontend */
  cardToken: string;
  /** Email do pagador */
  payerEmail: string;
  /** Nome do plano (para descrição) */
  planName: string;
  /** Valor mensal */
  amount: number;
  /** ID de referência interna (order_id ou subscription_id) */
  externalReference: string;
  /** Frequência em meses (1 = mensal, 3 = trimestral, etc) */
  frequencyMonths?: number;
  /** Meses de duração (null = ilimitado) */
  durationMonths?: number;
  /** Dias de teste grátis */
  freeTrialDays?: number;
}

export interface RecurringSubscriptionResult {
  success: boolean;
  /** ID da assinatura no Mercado Pago */
  mpSubscriptionId?: string;
  /** Status da assinatura */
  status?: "authorized" | "pending" | "paused" | "cancelled";
  /** Próxima data de cobrança */
  nextPaymentDate?: string;
  /** Erro (se houver) */
  error?: string;
  errorCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook URL Helper (using centralized environment module)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtém a URL correta para webhooks usando o módulo centralizado.
 * @see lib/environment.ts
 */
function getWebhookUrl(): string {
  return getMercadoPagoWebhookUrl();
}

/**
 * Obtém a URL de retorno após o checkout de assinatura.
 * @see lib/environment.ts
 */
function getBackUrl(): string {
  return getMercadoPagoBackUrl("/profile/subscriptions");
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Recurring Subscription
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria uma assinatura recorrente REAL via Preapproval API.
 * 
 * Diferente do Checkout Pro (Preferences), esta assinatura:
 * - Cobra automaticamente todo mês
 * - MP faz retry automático se falhar
 * - MP cancela automaticamente após 3 falhas
 * - Você recebe webhook a cada cobrança
 * 
 * @example
 * ```ts
 * const result = await createRecurringSubscription({
 *   cardToken: "token_do_cartao",
 *   payerEmail: "cliente@email.com",
 *   planName: "Doende Bronze",
 *   amount: 49.90,
 *   externalReference: "sub_uuid",
 * });
 * ```
 */
export async function createRecurringSubscription(
  data: CreateRecurringSubscriptionRequest
): Promise<RecurringSubscriptionResult> {
  console.log("[Subscription Service] Creating recurring subscription...");
  console.log("[Subscription Service] Data:", {
    cardToken: data.cardToken ? `${data.cardToken.substring(0, 20)}...` : "❌ MISSING!",
    planName: data.planName,
    amount: data.amount,
    frequencyMonths: data.frequencyMonths || 1,
    externalReference: data.externalReference,
  });

  // Validação crítica
  if (!data.cardToken) {
    console.error("[Subscription Service] ❌ Card token is missing!");
    return {
      success: false,
      error: "Token do cartão é obrigatório para assinatura recorrente",
      errorCode: "MISSING_CARD_TOKEN",
    };
  }

  try {
    // Calcula datas
    const startDate = new Date();
    let endDate: string | undefined;
    
    if (data.durationMonths) {
      const end = new Date(startDate);
      end.setMonth(end.getMonth() + data.durationMonths);
      endDate = end.toISOString();
    }

    // Cria assinatura via Preapproval API
    const preapproval = await createPreapproval({
      back_url: getBackUrl(),
      reason: `Assinatura ${data.planName} - Doende Verde`,
      payer_email: data.payerEmail,
      card_token_id: data.cardToken,
      external_reference: data.externalReference,
      status: "authorized", // Já autoriza cobrança automática
      notification_url: getWebhookUrl(),
      auto_recurring: {
        frequency: data.frequencyMonths || 1,
        frequency_type: "months",
        transaction_amount: data.amount,
        currency_id: "BRL",
        start_date: startDate.toISOString(),
        end_date: endDate,
        ...(data.freeTrialDays && data.freeTrialDays > 0 ? {
          free_trial: {
            frequency: data.freeTrialDays,
            frequency_type: "days" as const,
          },
        } : {}),
      },
    });

    console.log("[Subscription Service] ✅ Subscription created successfully");
    console.log("[Subscription Service] MP Subscription ID:", preapproval.id);
    console.log("[Subscription Service] Status:", preapproval.status);
    console.log("[Subscription Service] Next payment:", preapproval.next_payment_date);

    return {
      success: true,
      mpSubscriptionId: preapproval.id,
      status: preapproval.status,
      nextPaymentDate: preapproval.next_payment_date,
    };

  } catch (error) {
    console.error("[Subscription Service] ❌ Error creating subscription:", error);
    
    const err = error as Error;
    
    // Parse erro do MP
    let errorMessage = err.message || "Erro ao criar assinatura";
    let errorCode = "SUBSCRIPTION_ERROR";
    
    // Erros comuns do Preapproval
    if (errorMessage.includes("invalid card_token")) {
      errorMessage = "Token do cartão inválido ou expirado. Tente novamente.";
      errorCode = "INVALID_CARD_TOKEN";
    } else if (errorMessage.includes("payer_email")) {
      errorMessage = "Email do pagador inválido.";
      errorCode = "INVALID_PAYER_EMAIL";
    } else if (errorMessage.includes("amount")) {
      errorMessage = "Valor da assinatura inválido.";
      errorCode = "INVALID_AMOUNT";
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca detalhes de uma assinatura no MP.
 */
export async function getSubscriptionDetails(
  mpSubscriptionId: string
): Promise<PreapprovalResponse | null> {
  try {
    return await getPreapproval(mpSubscriptionId);
  } catch (error) {
    console.error("[Subscription Service] Error getting subscription:", error);
    return null;
  }
}

/**
 * Pausa uma assinatura (para de cobrar).
 */
export async function pauseSubscription(
  mpSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pausePreapproval(mpSubscriptionId);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * Reativa uma assinatura pausada.
 */
export async function resumeSubscription(
  mpSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resumePreapproval(mpSubscriptionId);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

/**
 * Cancela uma assinatura permanentemente.
 */
export async function cancelSubscriptionMP(
  mpSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await cancelPreapproval(mpSubscriptionId);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o status indica assinatura ativa.
 */
export function isSubscriptionActive(status: string): boolean {
  return status === "authorized";
}

/**
 * Verifica se o status indica assinatura pausada.
 */
export function isSubscriptionPaused(status: string): boolean {
  return status === "paused";
}

/**
 * Verifica se o status indica assinatura cancelada.
 */
export function isSubscriptionCancelled(status: string): boolean {
  return status === "cancelled";
}
