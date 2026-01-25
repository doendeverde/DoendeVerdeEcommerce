/**
 * Mercado Pago SDK Configuration
 * 
 * Initializes and exports the Mercado Pago client for payment processing.
 * Uses the official SDK v2 for Node.js.
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/overview
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { 
  MP_ACCESS_TOKEN, 
  MP_PUBLIC_KEY, 
  validateMercadoPagoConfig,
  IS_MP_PRODUCTION 
} from "./mercadopago-config";
import {
  getMercadoPagoWebhookUrl,
  getMercadoPagoBackUrls,
} from "./environment";

// ─────────────────────────────────────────────────────────────────────────────
// Environment Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Valida configuração na inicialização
validateMercadoPagoConfig();

/**
 * Obtém a Public Key do Mercado Pago (exportado para uso no frontend).
 */
export function getMercadoPagoPublicKey(): string {
  if (!MP_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_MP_PUBLIC_KEY não configurado no .env");
  }
  
  return MP_PUBLIC_KEY;
}

/**
 * Indica se está usando credenciais de produção.
 */
export const isMercadoPagoProduction = IS_MP_PRODUCTION;

// Initialize Mercado Pago client
export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000, // 5 seconds timeout
  },
});

// Export API instances
export const preferenceApi = new Preference(mercadoPagoClient);
export const paymentApi = new Payment(mercadoPagoClient);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePreferenceItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  picture_url?: string;
  category_id?: string;
}

export interface CreatePreferenceData {
  items: CreatePreferenceItem[];
  payer?: {
    name?: string;
    surname?: string;
    email: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    identification?: {
      type?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: "approved" | "all";
  external_reference?: string;
  notification_url?: string;
  statement_descriptor?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  metadata?: Record<string, unknown>;
}

export interface PreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  external_reference?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a payment preference for Checkout Pro
 */
export async function createPaymentPreference(
  data: CreatePreferenceData
): Promise<PreferenceResponse> {
  // Use centralized URLs from environment module
  const defaultBackUrls = getMercadoPagoBackUrls();
  const defaultNotificationUrl = getMercadoPagoWebhookUrl();

  const response = await preferenceApi.create({
    body: {
      items: data.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || "BRL",
        picture_url: item.picture_url,
        category_id: item.category_id,
      })),
      payer: data.payer,
      back_urls: data.back_urls || defaultBackUrls,
      auto_return: data.auto_return || "approved",
      external_reference: data.external_reference,
      notification_url: data.notification_url || defaultNotificationUrl,
      statement_descriptor: data.statement_descriptor || "DOENDEVERDE",
      expires: data.expires,
      expiration_date_from: data.expiration_date_from,
      expiration_date_to: data.expiration_date_to,
      metadata: data.metadata,
    },
  });

  return {
    id: response.id!,
    init_point: response.init_point!,
    sandbox_init_point: response.sandbox_init_point!,
    date_created: response.date_created!,
    external_reference: response.external_reference,
  };
}

/**
 * Get payment details by ID
 */
export async function getPaymentById(paymentId: string) {
  const response = await paymentApi.get({ id: paymentId });
  return response;
}

/**
 * Check if we're in sandbox/test mode
 */
export function isTestMode(): boolean {
  return !IS_MP_PRODUCTION;
}

/**
 * Get Mercado Pago Access Token
 */
export function getAccessToken(): string {
  if (!MP_ACCESS_TOKEN) {
    throw new Error("Mercado Pago Access Token não configurado");
  }
  return MP_ACCESS_TOKEN;
}
