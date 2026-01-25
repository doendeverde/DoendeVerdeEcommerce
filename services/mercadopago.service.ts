/**
 * Mercado Pago Payment Service
 * 
 * Serviço completo para processamento de pagamentos via Mercado Pago.
 * Suporta: PIX, Cartão de Crédito e Débito.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ARQUITETURA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Frontend tokeniza cartão via SDK do MP (Checkout Bricks)
 * 2. Backend recebe token seguro (nunca dados reais do cartão)
 * 3. Backend cria pagamento via API do Mercado Pago
 * 4. Webhook recebe confirmação de pagamento
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TIPOS DE PAGAMENTO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * PIX:
 *   - Pagamento instantâneo
 *   - Gera QR Code e código copia/cola
 *   - Validade: 30 minutos
 *   - Status confirmado via webhook
 * 
 * CARTÃO:
 *   - Crédito: até 12x
 *   - Débito: à vista
 *   - Aprovação instantânea ou em análise
 *   - Suporta 3DS para transações mais seguras
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA (PCI-DSS):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Este serviço está FORA do escopo PCI-DSS porque:
 * - Nunca recebe/armazena número de cartão
 * - Nunca recebe/armazena CVV
 * - Usa apenas tokens do Mercado Pago
 * - Toda tokenização é feita no frontend via SDK seguro
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-api
 */

import { Payment, MercadoPagoConfig } from "mercadopago";
import { randomUUID } from "crypto";
import type { CardPaymentData } from "@/schemas/payment.schema";
import { MP_ACCESS_TOKEN, validateMercadoPagoConfig } from "@/lib/mercadopago-config";
import {
  STATEMENT_DESCRIPTOR,
  CATEGORY_ID,
  PIX_EXPIRATION_MINUTES,
  buildAdditionalInfo,
  parsePhone,
  buildPayerAddress,
  type QualityPaymentRequest,
  type QualityPayerData,
  type QualityItemData,
  type QualityShippingData,
  type MPAdditionalInfo,
} from "@/lib/mercadopago-quality";
import { getMercadoPagoWebhookUrl } from "@/lib/environment";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Valida configuração na inicialização
validateMercadoPagoConfig();

const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "",
  options: {
    timeout: 10000, // 10 segundos
    idempotencyKey: randomUUID(), // Será sobrescrito por request
  },
});

const paymentClient = new Payment(client);

// ─────────────────────────────────────────────────────────────────────────────
// Webhook URL Helper (using centralized environment module)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtém a URL correta para webhooks usando o módulo centralizado.
 * @see lib/environment.ts
 */
function getWebhookUrl(): string {
  const webhookUrl = getMercadoPagoWebhookUrl();
  
  if (webhookUrl) {
    console.log("[MercadoPago] Using webhook URL:", webhookUrl);
  } else {
    console.warn("[MercadoPago] ⚠️ No webhook URL configured! Set WEBHOOK_NGROK_URL or NEXTAUTH_URL");
  }
  
  return webhookUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentRequest {
  amount: number;
  description: string;
  externalReference: string;
  payer: {
    email: string;
    firstName?: string;
    lastName?: string;
    identification?: {
      type: string;
      number: string;
    };
    phone?: {
      area_code: string;
      number: string;
    };
    address?: {
      zip_code: string;
      street_name: string;
      street_number: string;
    };
  };
  /** Itens do pedido para additional_info */
  items?: QualityItemData[];
  /** Dados de envio para additional_info */
  shipping?: QualityShippingData;
  metadata?: Record<string, unknown>;
}

export interface CardPaymentRequest extends PaymentRequest {
  token: string;
  paymentMethodId: string;
  issuerId: number; // MP expects number
  installments: number;
}

export interface PixPaymentRequest extends PaymentRequest {
  // PIX não requer campos adicionais
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  status?: PaymentStatus;
  statusDetail?: string;
  error?: string;
  errorCode?: string;
  // PIX specific
  qrCode?: string;
  qrCodeBase64?: string;
  pixCopyPaste?: string;
  ticketUrl?: string;
  expirationDate?: Date;
  // Card specific
  transactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
}

export type PaymentStatus = 
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeia erros do Mercado Pago para mensagens amigáveis.
 */
function mapMPError(error: unknown): { error: string; errorCode: string } {
  const err = error as any;
  
  // Erro estruturado do SDK
  if (err?.cause) {
    const causes = Array.isArray(err.cause) ? err.cause : [err.cause];
    const firstCause = causes[0];
    
    if (firstCause?.code) {
      return {
        errorCode: String(firstCause.code),
        error: getErrorMessage(String(firstCause.code), firstCause.description),
      };
    }
  }
  
  // Erro de API
  if (err?.response?.data) {
    const data = err.response.data;
    return {
      errorCode: data.error || "unknown",
      error: data.message || "Erro ao processar pagamento",
    };
  }
  
  // Erro genérico
  if (err?.message) {
    return {
      errorCode: "generic_error",
      error: err.message,
    };
  }
  
  return {
    errorCode: "unknown_error",
    error: "Erro desconhecido ao processar pagamento",
  };
}

/**
 * Retorna mensagem amigável para código de erro.
 */
function getErrorMessage(code: string, description?: string): string {
  const messages: Record<string, string> = {
    // Token/Card errors
    "2006": "Token do cartão não encontrado. Tente novamente.",
    "2062": "Token de cartão inválido. Verifique os dados.",
    "3003": "Token já utilizado. Insira os dados novamente.",
    "cc_rejected_bad_filled_card_number": "Número do cartão incorreto.",
    "cc_rejected_bad_filled_date": "Data de validade incorreta.",
    "cc_rejected_bad_filled_other": "Dados do cartão incorretos.",
    "cc_rejected_bad_filled_security_code": "CVV incorreto.",
    "cc_rejected_blacklist": "Cartão não permitido.",
    "cc_rejected_call_for_authorize": "Autorize o pagamento junto ao banco.",
    "cc_rejected_card_disabled": "Cartão desabilitado. Contate o banco.",
    "cc_rejected_card_error": "Erro no cartão. Tente outro.",
    "cc_rejected_duplicated_payment": "Pagamento duplicado. Aguarde.",
    "cc_rejected_high_risk": "Pagamento recusado por segurança.",
    "cc_rejected_insufficient_amount": "Saldo insuficiente.",
    "cc_rejected_invalid_installments": "Parcelas não permitidas.",
    "cc_rejected_max_attempts": "Limite de tentativas. Tente outro cartão.",
    "cc_rejected_other_reason": "Pagamento recusado pelo banco.",
    // Validation errors
    "2067": "CPF/CNPJ inválido.",
    "4033": "Parcelas inválidas.",
    "4050": "Email inválido.",
    // Generic
    "1": "Erro nos parâmetros enviados.",
  };
  
  return messages[code] || description || "Erro ao processar pagamento. Tente novamente.";
}

// ─────────────────────────────────────────────────────────────────────────────
// PIX Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um pagamento PIX.
 * 
 * Retorna QR Code e código copia/cola para o cliente pagar.
 * O pagamento será confirmado via webhook quando processado.
 * 
 * @example
 * ```ts
 * const result = await createPixPayment({
 *   amount: 99.90,
 *   description: "Assinatura Doende Bronze",
 *   externalReference: "order_123",
 *   payer: { email: "user@example.com" },
 * });
 * 
 * if (result.success) {
 *   // Exibir QR Code para o cliente
 *   console.log(result.qrCodeBase64);
 * }
 * ```
 */
export async function createPixPayment(
  request: PixPaymentRequest
): Promise<PaymentResponse> {
  const idempotencyKey = `pix_${request.externalReference}_${Date.now()}`;
  
  try {
    console.log("[MercadoPago] Creating PIX payment:", {
      amount: request.amount,
      externalReference: request.externalReference,
      email: request.payer.email,
    });
    
    // Build additional_info for better approval rates
    const additionalInfo = buildAdditionalInfo({
      amount: request.amount,
      description: request.description,
      externalReference: request.externalReference,
      payer: {
        email: request.payer.email,
        first_name: request.payer.firstName,
        last_name: request.payer.lastName,
        phone: request.payer.phone,
        address: request.payer.address,
      },
      items: request.items,
      shipping: request.shipping,
    });
    
    const response = await paymentClient.create({
      body: {
        transaction_amount: request.amount,
        description: request.description,
        payment_method_id: "pix",
        payer: {
          email: request.payer.email,
          first_name: request.payer.firstName,
          last_name: request.payer.lastName,
          identification: request.payer.identification,
        },
        external_reference: request.externalReference,
        notification_url: getWebhookUrl(),
        statement_descriptor: STATEMENT_DESCRIPTOR,
        additional_info: additionalInfo as any,
        metadata: request.metadata,
      },
      requestOptions: {
        idempotencyKey,
      },
    });
    
    console.log("[MercadoPago] PIX payment created:", {
      id: response.id,
      status: response.status,
    });
    
    // Log destacado para testes de webhook
    const transactionData = response.point_of_interaction?.transaction_data;
    console.log("\n" + "=".repeat(80));
    console.log("🔵 PIX PAYMENT ID (use para webhook):", response.id);
    console.log("   External Reference:", request.externalReference);
    console.log("   Amount: R$", request.amount);
    console.log("   Webhook URL:", getWebhookUrl());
    if (transactionData?.ticket_url) {
      console.log("\n   🎫 TICKET URL (abra para aprovar com conta teste):");
      console.log("   ", transactionData.ticket_url);
    }
    console.log("=".repeat(80) + "\n");
    
    return {
      success: true,
      paymentId: String(response.id),
      status: response.status as PaymentStatus,
      statusDetail: response.status_detail || undefined,
      qrCode: transactionData?.qr_code,
      qrCodeBase64: transactionData?.qr_code_base64,
      pixCopyPaste: transactionData?.qr_code,
      ticketUrl: transactionData?.ticket_url,
      expirationDate: response.date_of_expiration 
        ? new Date(response.date_of_expiration) 
        : new Date(Date.now() + 30 * 60 * 1000), // 30 min default
    };
  } catch (error) {
    console.error("[MercadoPago] PIX payment error:", error);
    const mapped = mapMPError(error);
    return {
      success: false,
      ...mapped,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um pagamento com cartão (crédito ou débito).
 * 
 * Usa o token gerado pelo SDK do Mercado Pago no frontend.
 * NUNCA recebe dados reais do cartão.
 * 
 * @example
 * ```ts
 * const result = await createCardPayment({
 *   amount: 99.90,
 *   description: "Assinatura Doende Bronze",
 *   externalReference: "order_123",
 *   payer: { email: "user@example.com" },
 *   token: "card_token_from_sdk",
 *   paymentMethodId: "visa",
 *   issuerId: "1234",
 *   installments: 1,
 * });
 * 
 * if (result.success && result.status === "approved") {
 *   // Pagamento aprovado instantaneamente
 * }
 * ```
 */
export async function createCardPayment(
  request: CardPaymentRequest
): Promise<PaymentResponse> {
  const idempotencyKey = `card_${request.externalReference}_${Date.now()}`;
  
  try {
    console.log("[MercadoPago] Creating card payment:", {
      amount: request.amount,
      externalReference: request.externalReference,
      email: request.payer.email,
      paymentMethodId: request.paymentMethodId,
      installments: request.installments,
    });
    
    // Build additional_info for better approval rates and fraud prevention
    const additionalInfo = buildAdditionalInfo({
      amount: request.amount,
      description: request.description,
      externalReference: request.externalReference,
      payer: {
        email: request.payer.email,
        first_name: request.payer.firstName,
        last_name: request.payer.lastName,
        phone: request.payer.phone,
        address: request.payer.address,
      },
      items: request.items,
      shipping: request.shipping,
    });
    
    const response = await paymentClient.create({
      body: {
        transaction_amount: request.amount,
        description: request.description,
        payment_method_id: request.paymentMethodId,
        token: request.token,
        issuer_id: request.issuerId,
        installments: request.installments,
        payer: {
          email: request.payer.email,
          first_name: request.payer.firstName,
          last_name: request.payer.lastName,
          identification: request.payer.identification,
        },
        external_reference: request.externalReference,
        notification_url: getWebhookUrl(),
        statement_descriptor: STATEMENT_DESCRIPTOR,
        additional_info: additionalInfo as any,
        metadata: request.metadata,
        // 3DS - desabilitado temporariamente para debug
        // Se estiver tendo rejeições por high_risk, pode ajudar:
        // - "optional": MP decide se usa 3DS
        // - "not_supported": Nunca usa 3DS (pode ajudar em alguns casos)
        // three_d_secure_mode: "optional",
      },
      requestOptions: {
        idempotencyKey,
      },
    });
    
    console.log("[MercadoPago] Card payment created:", {
      id: response.id,
      status: response.status,
      statusDetail: response.status_detail,
    });
    
    return {
      success: true,
      paymentId: String(response.id),
      status: response.status as PaymentStatus,
      statusDetail: response.status_detail || undefined,
      transactionId: String(response.id),
      cardLastFour: response.card?.last_four_digits,
      cardBrand: response.payment_method_id,
    };
  } catch (error) {
    console.error("[MercadoPago] Card payment error:", error);
    const mapped = mapMPError(error);
    return {
      success: false,
      ...mapped,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Consulta o status de um pagamento.
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  try {
    const response = await paymentClient.get({ id: paymentId });
    
    return {
      success: true,
      paymentId: String(response.id),
      status: response.status as PaymentStatus,
      statusDetail: response.status_detail || undefined,
    };
  } catch (error) {
    console.error("[MercadoPago] Get payment status error:", error);
    const mapped = mapMPError(error);
    return {
      success: false,
      ...mapped,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Convert CardPaymentData to Request
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converte dados validados do frontend para o formato do request.
 */
export function buildCardPaymentRequest(
  cardData: CardPaymentData,
  baseRequest: PaymentRequest
): CardPaymentRequest {
  return {
    ...baseRequest,
    token: cardData.token,
    paymentMethodId: cardData.paymentMethodId,
    issuerId: cardData.issuerId,
    installments: cardData.installments,
    payer: {
      ...baseRequest.payer,
      email: cardData.payerEmail,
      identification: cardData.identificationType && cardData.identificationNumber
        ? {
            type: cardData.identificationType,
            number: cardData.identificationNumber,
          }
        : undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o pagamento foi aprovado.
 */
export function isPaymentApproved(status: PaymentStatus | undefined): boolean {
  return status === "approved";
}

/**
 * Verifica se o pagamento está pendente.
 */
export function isPaymentPending(status: PaymentStatus | undefined): boolean {
  return ["pending", "authorized", "in_process", "in_mediation"].includes(status || "");
}

/**
 * Verifica se o pagamento foi rejeitado.
 */
export function isPaymentRejected(status: PaymentStatus | undefined): boolean {
  return ["rejected", "cancelled"].includes(status || "");
}

/**
 * Verifica se houve reembolso.
 */
export function isPaymentRefunded(status: PaymentStatus | undefined): boolean {
  return ["refunded", "charged_back"].includes(status || "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Mode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se está em modo de teste.
 */
export function isTestMode(): boolean {
  return MP_ACCESS_TOKEN?.startsWith("TEST-") ?? false;
}

/**
 * Retorna o ambiente atual.
 */
export function getEnvironment(): "sandbox" | "production" {
  return isTestMode() ? "sandbox" : "production";
}
