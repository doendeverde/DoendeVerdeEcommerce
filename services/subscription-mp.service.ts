/**
 * Subscription Service - Mercado Pago
 * 
 * Serviço para gerenciamento de assinaturas recorrentes usando
 * a combinação de Payment API + Preapproval API do Mercado Pago.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLUXO DE ASSINATURA (MODELO NETFLIX/SPOTIFY):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Frontend tokeniza cartão via Checkout Bricks
 * 2. Backend faz PRIMEIRA COBRANÇA via Payment API (síncrono)
 * 3. Se aprovado → cria Preapproval com start_date no FUTURO (+30 dias)
 * 4. Assinatura ativa, próxima cobrança em 30 dias via Preapproval
 * 5. MP cobra automaticamente todo mês via Preapproval
 * 6. Cada cobrança gera webhook subscription_authorized_payment
 * 
 * VANTAGENS:
 * - Feedback imediato para o usuário (aprovado/recusado na hora)
 * - Controle total sobre a primeira cobrança
 * - Não dependemos de webhook para primeira ativação
 * - Modelo igual ao Netflix: "paga e libera acesso imediato"
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RETRY AUTOMÁTICO DO MP (para cobranças futuras):
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
  /** Data de início da PRIMEIRA cobrança pelo Preapproval (ISO string) */
  startDate?: string;
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

/** Request para pagamento inicial da assinatura */
export interface InitialSubscriptionPaymentRequest {
  /** Token do cartão gerado pelo Checkout Bricks */
  cardToken: string;
  /** Email do pagador */
  payerEmail: string;
  /** Nome completo do pagador */
  payerFirstName?: string;
  payerLastName?: string;
  /** Nome do plano (para descrição) */
  planName: string;
  /** Valor a cobrar */
  amount: number;
  /** ID da order para external_reference */
  orderId: string;
  /** ID do plano para metadata */
  planId: string;
  /** ID do usuário para metadata */
  userId: string;
  /** ID do payment record no banco */
  paymentId: string;
  /** Payment method (visa, mastercard, etc) */
  paymentMethodId: string;
  /** Issuer ID (number, obrigatório) */
  issuerId: number;
  /** CPF (opcional mas recomendado) */
  identification?: {
    type: string;
    number: string;
  };
}

/** Resultado do pagamento inicial */
export interface InitialSubscriptionPaymentResult {
  success: boolean;
  /** ID do pagamento no MP */
  paymentId?: string;
  /** Status do pagamento */
  status?: "approved" | "pending" | "rejected" | "in_process" | "cancelled";
  /** Detalhe do status (motivo da rejeição, etc) */
  statusDetail?: string;
  /** Últimos 4 dígitos do cartão */
  cardLastFour?: string;
  /** Bandeira do cartão */
  cardBrand?: string;
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

import { createCardPayment, type PaymentResponse } from "@/services/mercadopago.service";

/**
 * Processa o PAGAMENTO INICIAL de uma assinatura via Payment API.
 * 
 * Este é o primeiro passo do fluxo de assinatura:
 * 1. ✅ Cobra AGORA via Payment API (esta função)
 * 2. Se aprovado → cria Preapproval com start_date futuro
 * 
 * VANTAGENS:
 * - Feedback imediato (aprovado/recusado na hora)
 * - Não dependemos de webhook para ativar assinatura
 * - Controle total sobre a primeira cobrança
 * 
 * @example
 * ```ts
 * const paymentResult = await processInitialSubscriptionPayment({
 *   cardToken: "token_from_bricks",
 *   payerEmail: "cliente@email.com",
 *   planName: "Doende Bronze",
 *   amount: 49.90,
 *   orderId: "order_uuid",
 *   planId: "plan_uuid",
 *   userId: "user_uuid",
 *   paymentId: "payment_uuid",
 *   paymentMethodId: "visa",
 * });
 * 
 * if (paymentResult.success && paymentResult.status === "approved") {
 *   // Pagamento aprovado! Criar Preapproval para recorrência futura
 * }
 * ```
 */
export async function processInitialSubscriptionPayment(
  data: InitialSubscriptionPaymentRequest
): Promise<InitialSubscriptionPaymentResult> {
  console.log("\n" + "═".repeat(80));
  console.log("💳 PROCESSANDO PAGAMENTO INICIAL DA ASSINATURA");
  console.log("═".repeat(80));
  console.log("[Initial Payment] Plan:", data.planName);
  console.log("[Initial Payment] Amount: R$", data.amount);
  console.log("[Initial Payment] Order ID:", data.orderId);
  console.log("[Initial Payment] Card Token:", data.cardToken ? `${data.cardToken.substring(0, 20)}...` : "❌ MISSING!");
  console.log("[Initial Payment] Payment Method:", data.paymentMethodId);

  // Validação crítica
  if (!data.cardToken) {
    console.error("[Initial Payment] ❌ Card token is missing!");
    return {
      success: false,
      error: "Token do cartão é obrigatório",
      errorCode: "MISSING_CARD_TOKEN",
    };
  }

  try {
    // Usa Payment API para cobrar IMEDIATAMENTE
    const paymentResult: PaymentResponse = await createCardPayment({
      amount: data.amount,
      description: `Assinatura ${data.planName} - Primeira mensalidade`,
      externalReference: data.orderId,
      payer: {
        email: data.payerEmail,
        firstName: data.payerFirstName,
        lastName: data.payerLastName,
        identification: data.identification,
      },
      token: data.cardToken,
      paymentMethodId: data.paymentMethodId,
      issuerId: data.issuerId,
      installments: 1, // Assinatura sempre em 1x
      metadata: {
        type: "subscription_initial",
        planId: data.planId,
        userId: data.userId,
        orderId: data.orderId,
        paymentId: data.paymentId,
      },
    });

    console.log("[Initial Payment] Payment API Response:", {
      success: paymentResult.success,
      paymentId: paymentResult.paymentId,
      status: paymentResult.status,
      statusDetail: paymentResult.statusDetail,
    });

    if (!paymentResult.success) {
      console.error("[Initial Payment] ❌ Payment failed:", paymentResult.error);
      return {
        success: false,
        error: paymentResult.error || "Erro ao processar pagamento",
        errorCode: paymentResult.errorCode || "PAYMENT_ERROR",
      };
    }

    // Mapeia resultado
    const result: InitialSubscriptionPaymentResult = {
      success: true,
      paymentId: paymentResult.paymentId,
      status: paymentResult.status as "approved" | "pending" | "rejected" | "in_process" | "cancelled",
      statusDetail: paymentResult.statusDetail,
      cardLastFour: paymentResult.cardLastFour,
      cardBrand: paymentResult.cardBrand,
    };

    if (paymentResult.status === "approved") {
      console.log("[Initial Payment] ✅ PAGAMENTO APROVADO!");
      console.log("[Initial Payment] MP Payment ID:", paymentResult.paymentId);
      console.log("[Initial Payment] Card:", paymentResult.cardBrand, "****", paymentResult.cardLastFour);
    } else if (paymentResult.status === "pending" || paymentResult.status === "in_process") {
      console.log("[Initial Payment] ⏳ Pagamento em processamento...");
    } else {
      console.log("[Initial Payment] ❌ Pagamento recusado:", paymentResult.statusDetail);
      result.error = paymentResult.statusDetail || "Pagamento não aprovado";
    }

    console.log("═".repeat(80) + "\n");
    return result;

  } catch (error) {
    console.error("[Initial Payment] ❌ Error:", error);
    const err = error as Error;
    return {
      success: false,
      error: err.message || "Erro ao processar pagamento inicial",
      errorCode: "INITIAL_PAYMENT_ERROR",
    };
  }
}

/**
 * Calcula a data de início da próxima cobrança (para Preapproval).
 * 
 * @param daysFromNow Dias a partir de hoje (padrão: 30)
 * @returns ISO string da data
 */
export function calculateNextBillingDate(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  // Seta para meia-noite para evitar problemas de timezone
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Cria uma assinatura recorrente via Preapproval API.
 * 
 * FLUXO RECOMENDADO (modelo Netflix):
 * 1. Cobrar PRIMEIRA mensalidade via processInitialSubscriptionPayment()
 * 2. Se aprovado, chamar esta função com startDate = +30 dias
 * 
 * Comportamento:
 * - Se startDate é fornecido: MP faz primeira cobrança nessa data futura
 * - Se startDate é omitido: MP faz primeira cobrança IMEDIATA
 * 
 * MP gerencia automaticamente:
 * - Cobranças automáticas na frequência configurada
 * - Retry automático em caso de falha (4 tentativas em 10 dias)
 * - Cancelamento automático após 3 parcelas rejeitadas consecutivas
 * 
 * @example
 * ```ts
 * // OPÇÃO 1: Cobrar agora via Preapproval (fluxo antigo)
 * const result = await createRecurringSubscription({
 *   cardToken: "token",
 *   payerEmail: "cliente@email.com",
 *   planName: "Doende Bronze",
 *   amount: 49.90,
 *   externalReference: "sub_uuid",
 * });
 * 
 * // OPÇÃO 2: Preapproval com início futuro (após processInitialSubscriptionPayment)
 * const result = await createRecurringSubscription({
 *   cardToken: "token",
 *   payerEmail: "cliente@email.com",
 *   planName: "Doende Bronze",
 *   amount: 49.90,
 *   externalReference: "sub_uuid",
 *   startDate: calculateNextBillingDate(30), // Próxima cobrança em 30 dias
 * });
 * ```
 */
export async function createRecurringSubscription(
  data: CreateRecurringSubscriptionRequest
): Promise<RecurringSubscriptionResult> {
  console.log("\n" + "═".repeat(80));
  console.log("🔄 CRIANDO ASSINATURA RECORRENTE (PREAPPROVAL)");
  console.log("═".repeat(80));
  console.log("[Preapproval] Plan:", data.planName);
  console.log("[Preapproval] Amount: R$", data.amount);
  console.log("[Preapproval] Frequency:", data.frequencyMonths || 1, "month(s)");
  console.log("[Preapproval] External Reference:", data.externalReference);
  console.log("[Preapproval] Start Date:", data.startDate || "(imediato)");
  console.log("[Preapproval] Card Token:", data.cardToken ? `${data.cardToken.substring(0, 20)}...` : "❌ MISSING!");

  // Validação crítica
  if (!data.cardToken) {
    console.error("[Preapproval] ❌ Card token is missing!");
    return {
      success: false,
      error: "Token do cartão é obrigatório para assinatura recorrente",
      errorCode: "MISSING_CARD_TOKEN",
    };
  }

  try {
    // Calcula datas
    let endDate: string | undefined;
    
    if (data.durationMonths) {
      const end = new Date();
      end.setMonth(end.getMonth() + data.durationMonths);
      endDate = end.toISOString();
    }

    // Prepara auto_recurring com start_date condicional
    const autoRecurring: {
      frequency: number;
      frequency_type: "months";
      transaction_amount: number;
      currency_id: "BRL";
      start_date?: string;
      end_date?: string;
      free_trial?: {
        frequency: number;
        frequency_type: "days";
      };
    } = {
      frequency: data.frequencyMonths || 1,
      frequency_type: "months",
      transaction_amount: data.amount,
      currency_id: "BRL",
      end_date: endDate,
    };

    // Se startDate foi fornecido, a primeira cobrança será nessa data
    // Caso contrário, MP cobra imediatamente
    if (data.startDate) {
      autoRecurring.start_date = data.startDate;
      console.log("[Preapproval] ⏰ Primeira cobrança agendada para:", data.startDate);
    } else {
      console.log("[Preapproval] ⚡ Primeira cobrança IMEDIATA pelo MP");
    }

    // Free trial (raramente usado com o novo fluxo)
    if (data.freeTrialDays && data.freeTrialDays > 0) {
      autoRecurring.free_trial = {
        frequency: data.freeTrialDays,
        frequency_type: "days",
      };
    }

    // Cria assinatura via Preapproval API
    const preapproval = await createPreapproval({
      back_url: getBackUrl(),
      reason: `Assinatura ${data.planName} - Doende Verde`,
      payer_email: data.payerEmail,
      card_token_id: data.cardToken,
      external_reference: data.externalReference,
      status: "authorized", // Autoriza cobranças automáticas
      notification_url: getWebhookUrl(),
      auto_recurring: autoRecurring,
    });

    console.log("[Preapproval] ✅ Subscription created successfully");
    console.log("[Preapproval] MP Subscription ID:", preapproval.id);
    console.log("[Preapproval] Status:", preapproval.status);
    console.log("[Preapproval] Next payment date:", preapproval.next_payment_date);
    console.log("═".repeat(80) + "\n");

    return {
      success: true,
      mpSubscriptionId: preapproval.id,
      status: preapproval.status,
      nextPaymentDate: preapproval.next_payment_date,
    };

  } catch (error) {
    console.error("[Preapproval] ❌ Error creating subscription:", error);
    
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
