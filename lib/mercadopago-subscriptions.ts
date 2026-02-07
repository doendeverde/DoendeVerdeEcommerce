/**
 * Mercado Pago Subscriptions API (Preapproval)
 * 
 * Este módulo implementa a API de Preapproval (Subscriptions) do Mercado Pago
 * para cobranças recorrentes REAIS onde o MP faz a cobrança automática.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * IMPORTANTE - DIFERENÇA ENTRE APIs:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ❌ Preferences API (Checkout Pro):
 *    - Cria pagamentos ÚNICOS (one-time)
 *    - NÃO suporta recorrência automática
 *    - Retorna init_point para redirect
 * 
 * ✅ Preapproval API (Subscriptions):
 *    - Cria assinaturas RECORRENTES
 *    - MP cobra automaticamente na frequência configurada
 *    - Lógica de retry integrada (4 tentativas em 10 dias)
 *    - Cancela automaticamente após 3 parcelas rejeitadas
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ENDPOINT: POST /preapproval
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments
 */

import { MP_ACCESS_TOKEN, IS_MP_PRODUCTION } from "./mercadopago-config";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PreapprovalAutoRecurring {
  /** Frequência de cobrança (ex: 1 para mensal = 1 mês) */
  frequency: number;
  /** Tipo de frequência: months, days, weeks */
  frequency_type: "months" | "days" | "weeks";
  /** Valor a cobrar em cada período */
  transaction_amount: number;
  /** Moeda (BRL para Brasil) */
  currency_id: string;
  /** Data de início (ISO8601) */
  start_date?: string;
  /** Data de término (ISO8601) - opcional para assinatura ilimitada */
  end_date?: string;
  /** Dias de teste grátis */
  free_trial?: {
    frequency: number;
    frequency_type: "months" | "days";
  };
}

export interface CreatePreapprovalRequest {
  /** URL de retorno após pagamento */
  back_url: string;
  /** Descrição da assinatura (aparece para o cliente) */
  reason: string;
  /** Email do pagador */
  payer_email: string;
  /** Token do cartão gerado pelo MercadoPago.js */
  card_token_id: string;
  /** Configuração da recorrência */
  auto_recurring: PreapprovalAutoRecurring;
  /** ID de referência externa (nosso subscription_id) */
  external_reference?: string;
  /** Status inicial: authorized = já cobra automaticamente */
  status: "authorized" | "pending";
  /** URL de notificação para webhooks */
  notification_url?: string;
}

export interface PreapprovalResponse {
  /** ID da assinatura no Mercado Pago */
  id: string;
  /** Status atual */
  status: "authorized" | "pending" | "paused" | "cancelled";
  /** Motivo/descrição */
  reason: string;
  /** Email do pagador */
  payer_email: string;
  /** Referência externa */
  external_reference?: string;
  /** URL de redirecionamento (para pending) */
  init_point?: string;
  /** Data de criação */
  date_created: string;
  /** Configuração recorrente */
  auto_recurring: PreapprovalAutoRecurring;
  /** ID do último pagamento */
  last_modified?: string;
  /** Próxima data de cobrança */
  next_payment_date?: string;
}

export interface PreapprovalSearchResponse {
  results: PreapprovalResponse[];
  paging: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = "https://api.mercadopago.com";

/**
 * Cria uma assinatura com pagamento autorizado (recorrente).
 * 
 * O Mercado Pago fará:
 * - Primeira cobrança imediata (ou após free_trial)
 * - Cobranças automáticas na frequência configurada
 * - Retry automático em caso de falha (4 tentativas em 10 dias)
 * - Cancelamento automático após 3 parcelas rejeitadas consecutivas
 * 
 * @example
 * ```ts
 * const subscription = await createPreapproval({
 *   back_url: "https://meusite.com/assinatura/sucesso",
 *   reason: "Assinatura Doende Bronze - Mensal",
 *   payer_email: "cliente@email.com",
 *   card_token_id: "token_do_cartao",
 *   auto_recurring: {
 *     frequency: 1,
 *     frequency_type: "months",
 *     transaction_amount: 49.90,
 *     currency_id: "BRL",
 *   },
 *   external_reference: "sub_uuid_interno",
 *   status: "authorized",
 * });
 * ```
 */
export async function createPreapproval(
  data: CreatePreapprovalRequest
): Promise<PreapprovalResponse> {
  console.log("[Preapproval] Creating subscription with data:", {
    reason: data.reason,
    payer_email: data.payer_email,
    card_token_id: data.card_token_id ? `${data.card_token_id.substring(0, 20)}...` : "❌ MISSING!",
    status: data.status,
    auto_recurring: data.auto_recurring,
    external_reference: data.external_reference,
    back_url: data.back_url,
    notification_url: data.notification_url,
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️ ALERTA: LIMITAÇÃO CONHECIDA EM AMBIENTE DE TESTE
  // ═══════════════════════════════════════════════════════════════════════════
  // 
  // PROBLEMA: Existe um PARADOXO entre Checkout Bricks e Preapproval API:
  //
  // 1. Checkout Bricks (frontend) NÃO ACEITA usuários de teste do MP
  //    - Documentação: "Integrações com Checkout Bricks não suportam usuários de teste"
  //    - Se usar email test_user_xxx@testuser.com, o Brick não carrega
  //
  // 2. Preapproval API com status=authorized EXIGE usuário de teste
  //    - Em ambiente sandbox, emails reais retornam erro 403
  //    - Erro: PA_UNAUTHORIZED_RESULT_FROM_POLICIES
  //
  // RESULTADO: É IMPOSSÍVEL testar o fluxo completo de assinatura com cartão
  //            em ambiente de teste usando Checkout Bricks.
  //
  // SOLUÇÕES:
  // - Usar PIX para testes (não tem essa limitação)
  // - Usar credenciais de PRODUÇÃO com cartão real (cuidado!)
  // - Ver docs/SUBSCRIPTION_SYSTEM_REFERENCE.md para mais detalhes
  //
  // ═══════════════════════════════════════════════════════════════════════════
  
  const isTestUserEmail = data.payer_email.includes("testuser.com") || 
                          data.payer_email.includes("@test.com");
  
  if (!IS_MP_PRODUCTION && !isTestUserEmail) {
    console.warn("═".repeat(70));
    console.warn("[Preapproval] ⚠️ AVISO: Usando email REAL em ambiente de TESTE");
    console.warn("[Preapproval] ⚠️ Email:", data.payer_email);
    console.warn("[Preapproval] ⚠️");
    console.warn("[Preapproval] ⚠️ A API Preapproval pode retornar erro 403:");
    console.warn("[Preapproval] ⚠️ PA_UNAUTHORIZED_RESULT_FROM_POLICIES");
    console.warn("[Preapproval] ⚠️");
    console.warn("[Preapproval] ⚠️ PORÉM: Checkout Bricks NÃO aceita usuários de teste!");
    console.warn("[Preapproval] ⚠️ Isso é uma limitação conhecida do Mercado Pago.");
    console.warn("[Preapproval] ⚠️");
    console.warn("[Preapproval] ⚠️ SOLUÇÕES:");
    console.warn("[Preapproval] ⚠️ 1. Use PIX para testes (funciona em sandbox)");
    console.warn("[Preapproval] ⚠️ 2. Use credenciais de PRODUÇÃO com cartão real");
    console.warn("[Preapproval] ⚠️");
    console.warn("[Preapproval] ⚠️ Ver: docs/SUBSCRIPTION_SYSTEM_REFERENCE.md");
    console.warn("═".repeat(70));
    
    // NÃO bloqueamos aqui porque:
    // 1. O erro vai vir do MP de qualquer forma
    // 2. O desenvolvedor precisa ver a mensagem de erro real do MP para debug
    // 3. Em algum momento pode haver workaround que desconhecemos
  }

  // Validação crítica: card_token_id é OBRIGATÓRIO para status=authorized
  if (data.status === "authorized" && !data.card_token_id) {
    throw new Error("card_token_id é obrigatório para criar assinatura com status 'authorized'");
  }

  // Headers - adiciona X-scope: stage para ambiente de teste (conforme doc MP)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    "X-Idempotency-Key": `preapproval-${data.external_reference}-${Date.now()}`,
  };
  
  // Para ambiente de teste, adiciona header especial
  if (!IS_MP_PRODUCTION) {
    headers["X-scope"] = "stage";
  }

  console.log("[Preapproval] Request headers:", {
    ...headers,
    Authorization: `Bearer ${MP_ACCESS_TOKEN?.substring(0, 20)}...`,
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/preapproval`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  } catch (fetchError) {
    console.error("[Preapproval] ❌ Network error:", fetchError);
    throw new Error("Erro de rede ao conectar com Mercado Pago. Tente novamente.");
  }

  // Lê o corpo da resposta uma única vez como texto
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (textError) {
    console.error("[Preapproval] ❌ Failed to read response body:", textError);
    throw new Error(`Resposta inválida do Mercado Pago (HTTP ${response.status})`);
  }

  console.log("[Preapproval] Response status:", response.status);
  console.log("[Preapproval] Response body (first 500 chars):", responseText.substring(0, 500));

  // Tenta parsear como JSON
  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch (jsonError) {
    console.error("[Preapproval] ❌ Failed to parse JSON response:", {
      status: response.status,
      body: responseText.substring(0, 500),
    });
    throw new Error(`Resposta inválida do Mercado Pago: HTTP ${response.status}. Body não é JSON válido.`);
  }

  // Se resposta não OK, trata erro
  if (!response.ok) {
    console.error("[Preapproval] ❌ Error creating subscription:", {
      status: response.status,
      statusText: response.statusText,
      error: responseData,
    });
    
    // Mensagens de erro mais descritivas
    let errorMessage = responseData?.message || `Failed to create preapproval: ${response.status}`;
    const errorCode = responseData?.code || "";
    
    // ═══════════════════════════════════════════════════════════════════════
    // ERROS DE CARTÃO (CC_*) - Rejeições comuns
    // ═══════════════════════════════════════════════════════════════════════
    if (errorCode.startsWith("cc_rejected_") || responseData?.message?.includes("CC_VAL_")) {
      // Mapeamento de erros de cartão para mensagens amigáveis
      const cardErrorMap: Record<string, string> = {
        "cc_rejected_bad_filled_security_code": "Código de segurança (CVV) incorreto. Verifique os 3 dígitos no verso do cartão.",
        "cc_rejected_bad_filled_card_number": "Número do cartão incorreto. Verifique e tente novamente.",
        "cc_rejected_bad_filled_date": "Data de validade incorreta. Verifique mês/ano.",
        "cc_rejected_bad_filled_other": "Dados do cartão incorretos. Verifique todas as informações.",
        "cc_rejected_card_disabled": "Cartão desabilitado. Entre em contato com seu banco.",
        "cc_rejected_insufficient_amount": "Saldo insuficiente. Use outro cartão ou forma de pagamento.",
        "cc_rejected_high_risk": "Pagamento recusado por segurança. Tente outro cartão.",
        "cc_rejected_max_attempts": "Limite de tentativas excedido. Aguarde alguns minutos.",
        "cc_rejected_call_for_authorize": "Cartão requer autorização. Ligue para seu banco e autorize a compra.",
        "cc_rejected_duplicated_payment": "Pagamento duplicado detectado. Verifique seu extrato.",
        "cc_rejected_card_type_not_allowed": "Tipo de cartão não aceito para assinaturas.",
        "cc_rejected_other_reason": "Cartão recusado. Tente outro cartão ou forma de pagamento.",
      };
      
      errorMessage = cardErrorMap[errorCode] || 
        `Cartão recusado: ${responseData?.message || errorCode}. Verifique os dados e tente novamente.`;
    }
    // Erros específicos do Mercado Pago (token)
    else if (responseData?.message?.includes("Card token service not found")) {
      errorMessage = "Token de cartão inválido ou expirado. O token deve ser gerado via MercadoPago.js e usado imediatamente.";
    } else if (responseData?.message?.includes("invalid_token")) {
      errorMessage = "Token de cartão inválido. Verifique se está usando credenciais de TESTE com usuários de TESTE.";
    } else if (response.status === 401 && !errorCode.startsWith("cc_")) {
      // 401 sem código CC_* = problema de autenticação
      errorMessage = "Access token inválido ou expirado.";
    } else if (response.status === 400 && responseData?.cause) {
      // Erros de validação do MP geralmente vêm com 'cause'
      const causes = Array.isArray(responseData.cause) ? responseData.cause : [responseData.cause];
      errorMessage = causes.map((c: any) => c.description || c.message || JSON.stringify(c)).join(", ");
    } else if (response.status === 400 && responseData?.error) {
      // Outro formato de erro do MP
      errorMessage = responseData.error_description || responseData.error || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  // Valida resposta de sucesso
  if (!responseData || !responseData.id) {
    console.error("[Preapproval] ❌ Invalid success response - missing ID:", responseData);
    throw new Error("Resposta inválida do Mercado Pago: ID da assinatura não retornado.");
  }

  const result = responseData as PreapprovalResponse;
  console.log("[Preapproval] Subscription created successfully:", {
    id: result.id,
    status: result.status,
    next_payment_date: result.next_payment_date,
  });

  return result;
}

/**
 * Busca uma assinatura pelo ID.
 */
export async function getPreapproval(
  preapprovalId: string
): Promise<PreapprovalResponse> {
  console.log("[Preapproval] Getting subscription:", preapprovalId);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/preapproval/${preapprovalId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });
  } catch (fetchError) {
    console.error("[Preapproval] Network error:", fetchError);
    throw new Error("Erro de rede ao buscar assinatura. Tente novamente.");
  }

  // Lê resposta como texto primeiro para evitar erro de JSON vazio
  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago (HTTP ${response.status})`);
  }

  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago: HTTP ${response.status}`);
  }

  if (!response.ok) {
    console.error("[Preapproval] Error getting subscription:", responseData);
    throw new Error(
      responseData?.message || `Failed to get preapproval: ${response.status}`
    );
  }

  return responseData as PreapprovalResponse;
}

/**
 * Atualiza uma assinatura (pausar, cancelar, alterar valor).
 */
export async function updatePreapproval(
  preapprovalId: string,
  data: Partial<{
    status: "authorized" | "paused" | "cancelled";
    auto_recurring: Partial<PreapprovalAutoRecurring>;
    reason: string;
    back_url: string;
  }>
): Promise<PreapprovalResponse> {
  console.log("[Preapproval] Updating subscription:", preapprovalId, data);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(data),
    });
  } catch (fetchError) {
    console.error("[Preapproval] Network error:", fetchError);
    throw new Error("Erro de rede ao atualizar assinatura. Tente novamente.");
  }

  // Lê resposta como texto primeiro para evitar erro de JSON vazio
  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago (HTTP ${response.status})`);
  }

  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago: HTTP ${response.status}`);
  }

  if (!response.ok) {
    console.error("[Preapproval] Error updating subscription:", responseData);
    throw new Error(
      responseData?.message || `Failed to update preapproval: ${response.status}`
    );
  }

  return responseData as PreapprovalResponse;
}

/**
 * Pausa uma assinatura.
 * O cliente não será cobrado enquanto pausada.
 */
export async function pausePreapproval(
  preapprovalId: string
): Promise<PreapprovalResponse> {
  return updatePreapproval(preapprovalId, { status: "paused" });
}

/**
 * Reativa uma assinatura pausada.
 */
export async function resumePreapproval(
  preapprovalId: string
): Promise<PreapprovalResponse> {
  return updatePreapproval(preapprovalId, { status: "authorized" });
}

/**
 * Cancela uma assinatura permanentemente.
 */
export async function cancelPreapproval(
  preapprovalId: string
): Promise<PreapprovalResponse> {
  return updatePreapproval(preapprovalId, { status: "cancelled" });
}

/**
 * Busca assinaturas por referência externa.
 */
export async function searchPreapprovalsByExternalReference(
  externalReference: string
): Promise<PreapprovalSearchResponse> {
  console.log("[Preapproval] Searching by external_reference:", externalReference);

  const params = new URLSearchParams({
    external_reference: externalReference,
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/preapproval/search?${params}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });
  } catch (fetchError) {
    console.error("[Preapproval] Network error:", fetchError);
    throw new Error("Erro de rede ao buscar assinaturas. Tente novamente.");
  }

  // Lê resposta como texto primeiro para evitar erro de JSON vazio
  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago (HTTP ${response.status})`);
  }

  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago: HTTP ${response.status}`);
  }

  if (!response.ok) {
    console.error("[Preapproval] Error searching subscriptions:", responseData);
    throw new Error(
      responseData?.message || `Failed to search preapprovals: ${response.status}`
    );
  }

  return responseData as PreapprovalSearchResponse;
}

/**
 * Busca assinaturas por email do pagador.
 */
export async function searchPreapprovalsByPayerEmail(
  payerEmail: string
): Promise<PreapprovalSearchResponse> {
  console.log("[Preapproval] Searching by payer_email:", payerEmail);

  const params = new URLSearchParams({
    payer_email: payerEmail,
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/preapproval/search?${params}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });
  } catch (fetchError) {
    console.error("[Preapproval] Network error:", fetchError);
    throw new Error("Erro de rede ao buscar assinaturas. Tente novamente.");
  }

  // Lê resposta como texto primeiro para evitar erro de JSON vazio
  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago (HTTP ${response.status})`);
  }

  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(`Resposta inválida do Mercado Pago: HTTP ${response.status}`);
  }

  if (!response.ok) {
    console.error("[Preapproval] Error searching subscriptions:", responseData);
    throw new Error(
      responseData?.message || `Failed to search preapprovals: ${response.status}`
    );
  }

  return responseData as PreapprovalSearchResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera a data de início para a assinatura (agora ou data futura).
 */
export function getSubscriptionStartDate(delayDays: number = 0): string {
  const date = new Date();
  if (delayDays > 0) {
    date.setDate(date.getDate() + delayDays);
  }
  return date.toISOString();
}

/**
 * Calcula a data de término baseada na duração.
 */
export function getSubscriptionEndDate(
  durationMonths: number,
  startDate?: Date
): string {
  const date = startDate ? new Date(startDate) : new Date();
  date.setMonth(date.getMonth() + durationMonths);
  return date.toISOString();
}

/**
 * Mapeia status do Preapproval para nosso sistema.
 * Nota: SubscriptionStatus não tem PENDING, então mapeamos para PAUSED temporariamente.
 */
export function mapPreapprovalStatus(
  mpStatus: string
): "ACTIVE" | "PAUSED" | "CANCELED" {
  const statusMap: Record<string, "ACTIVE" | "PAUSED" | "CANCELED"> = {
    authorized: "ACTIVE",
    pending: "PAUSED", // Assinatura pendente é tratada como pausada até ser autorizada
    paused: "PAUSED",
    cancelled: "CANCELED",
  };
  return statusMap[mpStatus] || "PAUSED";
}
