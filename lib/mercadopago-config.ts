/**
 * Configuração centralizada do Mercado Pago
 * 
 * Lê MP_USE_PRODUCTION e retorna as credenciais corretas automaticamente.
 * 
 * @example
 * // No .env:
 * // MP_USE_PRODUCTION=false → usa credenciais TEST
 * // MP_USE_PRODUCTION=true  → usa credenciais PROD
 */

const isProduction = process.env.MP_USE_PRODUCTION === "true";

/**
 * Public Key (usado no frontend - Checkout Bricks)
 * Seleciona automaticamente baseado em MP_USE_PRODUCTION
 */
export const MP_PUBLIC_KEY = isProduction
  ? process.env.MP_PROD_PUBLIC_KEY
  : process.env.MP_TEST_PUBLIC_KEY;

/**
 * Access Token (usado no backend - API calls)
 * Seleciona automaticamente baseado em MP_USE_PRODUCTION
 */
export const MP_ACCESS_TOKEN = isProduction
  ? process.env.MP_PROD_ACCESS_TOKEN
  : process.env.MP_TEST_ACCESS_TOKEN;

/**
 * Indica se está em modo produção
 */
export const IS_MP_PRODUCTION = isProduction;

/**
 * Valida se as credenciais necessárias estão configuradas
 */
export function validateMercadoPagoConfig() {
  if (!MP_PUBLIC_KEY) {
    throw new Error(
      `Credencial ${isProduction ? "MP_PROD_PUBLIC_KEY" : "MP_TEST_PUBLIC_KEY"} não configurada no .env`
    );
  }

  if (!MP_ACCESS_TOKEN) {
    throw new Error(
      `Credencial ${isProduction ? "MP_PROD_ACCESS_TOKEN" : "MP_TEST_ACCESS_TOKEN"} não configurada no .env`
    );
  }

  // Validação adicional: verificar se está usando credenciais corretas
  if (isProduction && !MP_PUBLIC_KEY?.startsWith("APP_USR-")) {
    console.warn("⚠️  MP_USE_PRODUCTION=true mas MP_PROD_PUBLIC_KEY não começa com APP_USR-");
  }

  if (!isProduction && !MP_PUBLIC_KEY?.startsWith("TEST-")) {
    console.warn("⚠️  MP_USE_PRODUCTION=false mas MP_TEST_PUBLIC_KEY não começa com TEST-");
  }
}

// Log de inicialização (apenas no servidor)
if (typeof window === "undefined") {
  console.log(`[MercadoPago Config] Modo: ${isProduction ? "PRODUÇÃO" : "TESTE"}`);
  console.log(`[MercadoPago Config] Public Key: ${MP_PUBLIC_KEY?.substring(0, 20)}...`);
}
