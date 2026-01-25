/**
 * Environment Configuration Module
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * MÓDULO CENTRAL DE AMBIENTE - URLS PÚBLICAS E VALIDAÇÃO
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Este módulo centraliza TODAS as URLs públicas usadas em integrações externas.
 * 
 * MOTIVAÇÃO:
 * - APIs externas (Mercado Pago, Melhor Envio) requerem URLs públicas válidas
 * - localhost:3000 causa erro 400 em webhooks e callbacks
 * - Precisa funcionar em DEV (ngrok/staging) e PROD (domínio real)
 * 
 * REGRAS:
 * 1. NUNCA hardcodar URLs diretamente nos serviços
 * 2. SEMPRE usar as constantes exportadas deste módulo
 * 3. Em DEV, usar WEBHOOK_NGROK_URL ou domínio de staging
 * 4. Em PROD, usar NEXTAUTH_URL ou AUTH_URL
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * VARIÁVEIS DE AMBIENTE ESPERADAS (.env):
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * # Para DEV - URL pública para webhooks (ngrok ou similar)
 * WEBHOOK_NGROK_URL=https://xxx.ngrok-free.dev
 * 
 * # Para AUTH.js (pode ser localhost em dev local, mas NÃO usar para webhooks)
 * AUTH_URL=http://localhost:3000
 * 
 * # Para PROD - domínio real (usar em produção)
 * NEXTAUTH_URL=https://meudominio.com.br
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * @see docs/ENVIRONMENT_CONFIG.md para documentação completa
 */

// ─────────────────────────────────────────────────────────────────────────────
// Environment Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta se está em modo produção (NODE_ENV)
 */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Detecta se está em modo desenvolvimento
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// ─────────────────────────────────────────────────────────────────────────────
// URL Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se uma URL contém localhost ou 127.0.0.1
 */
function isLocalhostUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("localhost") ||
    lowerUrl.includes("127.0.0.1") ||
    lowerUrl.includes("0.0.0.0")
  );
}

/**
 * Valida uma URL pública para integrações externas.
 * 
 * - Em PRODUÇÃO: Lança erro se for localhost
 * - Em DESENVOLVIMENTO: Lança warning no console
 * 
 * @param url URL a validar
 * @param context Nome do contexto (para logs)
 * @throws Error em produção se URL contiver localhost
 */
export function validatePublicUrl(url: string, context: string): void {
  if (!url) {
    const msg = `[Environment] ⚠️ URL não configurada para: ${context}`;
    console.warn(msg);
    return;
  }

  if (isLocalhostUrl(url)) {
    const errorMsg = `[Environment] ❌ URL inválida para ${context}: "${url}" - localhost não é permitido para integrações externas`;

    if (IS_PRODUCTION) {
      console.error(errorMsg);
      throw new Error(
        `ERRO CRÍTICO: URL de ${context} contém localhost. ` +
          `Configure NEXTAUTH_URL com o domínio de produção.`
      );
    } else {
      console.warn("═".repeat(80));
      console.warn(`[Environment] ⚠️ AVISO: ${context} usando localhost`);
      console.warn(`[Environment] ⚠️ URL: ${url}`);
      console.warn(`[Environment] ⚠️`);
      console.warn(`[Environment] ⚠️ Integrações externas (webhooks, callbacks) podem FALHAR!`);
      console.warn(`[Environment] ⚠️ Configure WEBHOOK_NGROK_URL ou use um domínio de staging.`);
      console.warn("═".repeat(80));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Base URLs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtém a URL base pública da aplicação.
 * 
 * Prioridade:
 * 1. NEXTAUTH_URL (produção)
 * 2. AUTH_URL (fallback)
 * 
 * NOTA: Esta URL é usada para redirecionamentos internos.
 * Para webhooks, use getWebhookBaseUrl().
 */
export function getAppBaseUrl(): string {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const authUrl = process.env.AUTH_URL;

  return nextAuthUrl || authUrl || "http://localhost:3000";
}

/**
 * Obtém a URL base para webhooks e callbacks de integrações externas.
 * 
 * Prioridade:
 * 1. WEBHOOK_NGROK_URL (desenvolvimento com ngrok)
 * 2. NEXTAUTH_URL (produção)
 * 3. AUTH_URL (fallback)
 * 
 * IMPORTANTE: Esta URL DEVE ser pública e acessível pela internet.
 * Em desenvolvimento, use ngrok ou similar.
 */
export function getWebhookBaseUrl(): string {
  const ngrokUrl = process.env.WEBHOOK_NGROK_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const authUrl = process.env.AUTH_URL;

  // Em DEV, preferir ngrok
  if (ngrokUrl) {
    return ngrokUrl;
  }

  // Produção ou fallback
  const baseUrl = nextAuthUrl || authUrl || "";

  // Validar (vai logar warning ou erro)
  if (baseUrl) {
    validatePublicUrl(baseUrl, "Webhook Base URL");
  }

  return baseUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago URLs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * URL de webhook para notificações do Mercado Pago.
 * 
 * Usado em:
 * - notification_url de pagamentos
 * - notification_url de preapproval (assinaturas)
 * 
 * @example
 * // Retorna: https://xxx.ngrok-free.dev/api/webhooks/mercadopago
 */
export function getMercadoPagoWebhookUrl(): string {
  const baseUrl = getWebhookBaseUrl();

  if (!baseUrl) {
    console.warn(
      "[Environment] ⚠️ Webhook URL não configurada! " +
        "Configure WEBHOOK_NGROK_URL (dev) ou NEXTAUTH_URL (prod)."
    );
    return "";
  }

  const webhookUrl = `${baseUrl}/api/webhooks/mercadopago`;
  validatePublicUrl(webhookUrl, "MercadoPago Webhook URL");

  return webhookUrl;
}

/**
 * URL de retorno após checkout do Mercado Pago.
 * 
 * Usado em:
 * - back_url de preapproval (assinaturas)
 * - back_urls de preferences (checkout pro)
 * 
 * @param path Caminho após o domínio (ex: "/subscriptions", "/checkout/success")
 */
export function getMercadoPagoBackUrl(path: string = "/subscriptions"): string {
  const baseUrl = getAppBaseUrl();

  // back_url pode usar localhost em dev (é redirecionamento, não callback de API)
  // MAS para preapproval API, precisa ser público
  const backUrl = `${baseUrl}${path}`;

  // Para preapproval, validar pois MP faz redirect
  if (IS_PRODUCTION) {
    validatePublicUrl(backUrl, "MercadoPago Back URL");
  }

  return backUrl;
}

/**
 * URLs de retorno para Checkout Pro (Preferences API).
 */
export function getMercadoPagoBackUrls() {
  const baseUrl = getAppBaseUrl();

  return {
    success: `${baseUrl}/checkout/payment/success`,
    failure: `${baseUrl}/checkout/payment/failure`,
    pending: `${baseUrl}/checkout/payment/pending`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Melhor Envio URLs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * URL de callback para notificações do Melhor Envio.
 */
export function getMelhorEnvioCallbackUrl(): string {
  const baseUrl = getWebhookBaseUrl();

  if (!baseUrl) {
    console.warn("[Environment] ⚠️ Melhor Envio callback URL não configurada!");
    return "";
  }

  const callbackUrl = `${baseUrl}/api/webhooks/melhor-envio`;
  validatePublicUrl(callbackUrl, "Melhor Envio Callback URL");

  return callbackUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// All URLs Export (for debugging/logging)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna todas as URLs configuradas para logging/debug.
 */
export function getAllConfiguredUrls() {
  return {
    environment: IS_PRODUCTION ? "PRODUCTION" : "DEVELOPMENT",
    appBaseUrl: getAppBaseUrl(),
    webhookBaseUrl: getWebhookBaseUrl(),
    mercadoPago: {
      webhookUrl: getMercadoPagoWebhookUrl(),
      backUrl: getMercadoPagoBackUrl(),
      backUrls: getMercadoPagoBackUrls(),
    },
    melhorEnvio: {
      callbackUrl: getMelhorEnvioCallbackUrl(),
    },
    rawEnvVars: {
      WEBHOOK_NGROK_URL: process.env.WEBHOOK_NGROK_URL || "(não definido)",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(não definido)",
      AUTH_URL: process.env.AUTH_URL || "(não definido)",
      NODE_ENV: process.env.NODE_ENV || "(não definido)",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialization Log (Server only)
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window === "undefined") {
  console.log("[Environment] ═══════════════════════════════════════════════════");
  console.log(`[Environment] Modo: ${IS_PRODUCTION ? "🔴 PRODUÇÃO" : "🟢 DESENVOLVIMENTO"}`);
  console.log(`[Environment] App URL: ${getAppBaseUrl()}`);
  console.log(`[Environment] Webhook URL: ${getWebhookBaseUrl() || "(não configurado)"}`);
  console.log("[Environment] ═══════════════════════════════════════════════════");
}
