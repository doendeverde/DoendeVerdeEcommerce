/**
 * Payment Validation Schemas
 * 
 * Schemas Zod para validação de pagamentos.
 * Suporta: PIX, Cartão de Crédito e Débito.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLUXO DE VALIDAÇÃO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Frontend submete dados de pagamento
 * 2. API Route valida com Zod schema
 * 3. Se válido → processa pagamento
 * 4. Se inválido → retorna erro 400 com detalhes
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * IMPORTANTE - SEGURANÇA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * - NUNCA validamos número de cartão real (dados sensíveis não trafegam)
 * - O token vem do SDK do Mercado Pago (já tokenizado no frontend)
 * - Backend recebe apenas token seguro (não-sensível)
 * - Isso nos mantém FORA do escopo PCI-DSS
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-api
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const PaymentMethodEnum = z.enum(["pix", "credit_card", "debit_card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

// ─────────────────────────────────────────────────────────────────────────────
// PIX Payment Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema para pagamento PIX.
 * PIX não requer dados adicionais - apenas o método.
 */
export const pixPaymentSchema = z.object({
  method: z.literal("pix"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Card Payment Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema para pagamento com cartão (crédito ou débito).
 * 
 * O token é gerado pelo SDK do Mercado Pago (Checkout Bricks).
 * Nunca recebemos dados reais do cartão - apenas token seguro.
 * 
 * Nota: Zod 4.x usa `error` ou `message` ao invés de `required_error`
 */
export const cardPaymentSchema = z.object({
  method: z.enum(["credit_card", "debit_card"]),
  
  // Token gerado pelo SDK do Mercado Pago (obrigatório para cartão)
  token: z.string({ error: "Token do cartão é obrigatório" })
    .min(1, "Token do cartão não pode estar vazio"),
  
  // ID do método de pagamento (visa, master, elo, etc)
  paymentMethodId: z.string({ error: "ID do método de pagamento é obrigatório" })
    .min(1, "ID do método não pode estar vazio"),
  
  // ID do emissor do cartão (MP espera number)
  issuerId: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number(),
  ]).pipe(z.number({ error: "ID do emissor deve ser um número válido" })),
  
  // Número de parcelas (1-12)
  installments: z.number({ error: "Número de parcelas é obrigatório" })
    .int("Parcelas deve ser número inteiro")
    .min(1, "Mínimo 1 parcela")
    .max(12, "Máximo 12 parcelas"),
  
  // Email do pagador
  payerEmail: z.string({ error: "Email do pagador é obrigatório" })
    .email("Email inválido"),
  
  // Tipo de documento (opcional - CPF, CNPJ)
  identificationType: z.string().optional(),
  
  // Número do documento (opcional - usado para 3DS)
  identificationNumber: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Unified Payment Schema (discriminated union)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema unificado de pagamento usando discriminated union.
 * Automaticamente valida campos diferentes baseado no method.
 */
export const paymentDataSchema = z.discriminatedUnion("method", [
  pixPaymentSchema,
  cardPaymentSchema,
]);

export type PaymentData = z.infer<typeof paymentDataSchema>;
export type PixPaymentData = z.infer<typeof pixPaymentSchema>;
export type CardPaymentData = z.infer<typeof cardPaymentSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida dados de pagamento e retorna resultado tipado.
 * 
 * @example
 * ```ts
 * const result = validatePaymentData(body.paymentData);
 * if (!result.success) {
 *   return { error: result.error };
 * }
 * const payment = result.data; // Tipo inferido corretamente
 * ```
 */
export function validatePaymentData(data: unknown): {
  success: true;
  data: PaymentData;
} | {
  success: false;
  error: string;
  details: Array<{ field: string; message: string }>;
} {
  const result = paymentDataSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
  
  // Gera mensagem de erro amigável
  const firstError = details[0];
  const errorMessage = firstError 
    ? `${firstError.field}: ${firstError.message}`
    : "Dados de pagamento inválidos";
  
  return {
    success: false,
    error: errorMessage,
    details,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type guard para verificar se é pagamento PIX.
 */
export function isPixPayment(data: PaymentData): data is PixPaymentData {
  return data.method === "pix";
}

/**
 * Type guard para verificar se é pagamento com cartão.
 */
export function isCardPayment(data: PaymentData): data is CardPaymentData {
  return data.method === "credit_card" || data.method === "debit_card";
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Messages (Mercado Pago)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeamento de códigos de erro do Mercado Pago para mensagens amigáveis.
 * 
 * @see https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
 */
export const MP_ERROR_MESSAGES: Record<string, string> = {
  // Erros de token/cartão
  "2006": "Token do cartão não encontrado. Tente novamente.",
  "2007": "Erro de conexão com o processador de pagamentos.",
  "2062": "Token de cartão inválido. Verifique os dados e tente novamente.",
  "3003": "Token já utilizado. Por favor, insira os dados do cartão novamente.",
  "3006": "Token de cartão inválido.",
  "3008": "Token não encontrado.",
  
  // Erros de validação
  "2067": "Número de documento inválido. Verifique o CPF.",
  "2072": "Valor da transação inválido.",
  "3014": "Método de pagamento inválido.",
  "4033": "Número de parcelas inválido.",
  "4037": "Valor da transação inválido.",
  "4050": "Email do pagador inválido.",
  
  // Erros de idempotência
  "4292": "Header X-Idempotency-Key é obrigatório.",
  
  // Erros genéricos
  "1": "Erro nos parâmetros. Verifique os dados e tente novamente.",
  "3": "Token deve ser de teste em ambiente de testes.",
  
  // Fallback
  default: "Erro ao processar pagamento. Tente novamente.",
};

/**
 * Retorna mensagem de erro amigável para código do Mercado Pago.
 */
export function getMPErrorMessage(errorCode: string | number): string {
  const code = String(errorCode);
  return MP_ERROR_MESSAGES[code] || MP_ERROR_MESSAGES.default;
}
