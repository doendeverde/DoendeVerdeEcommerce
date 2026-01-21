/**
 * Shipping Service
 *
 * Business logic for shipping calculations, external API integration,
 * and fallback mechanisms.
 */

import { shippingRepository } from "@/repositories/shipping.repository";
import type {
  ShippingProfile,
  ShippingOption,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
  OrderShippingData,
  MelhorEnvioQuoteResponse,
  RegionalShippingRate,
  SelectedShippingOption,
} from "@/types/shipping";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  /** CEP de origem (loja) */
  ORIGIN_CEP: process.env.SHIPPING_ORIGIN_CEP || "01310100", // SP - Paulista
  /** Timeout para API externa em ms */
  API_TIMEOUT: 10000,
  /** URL da API Melhor Envio - Sandbox ou Produção */
  MELHOR_ENVIO_URL:
    process.env.NODE_ENV === "production"
      ? "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate"
      : "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
  /** Preço mínimo de frete */
  MIN_SHIPPING_PRICE: 15.0,
  /** Usar API externa ou fallback fixo */
  USE_EXTERNAL_API: process.env.SHIPPING_USE_EXTERNAL_API === "true",
};

// ─────────────────────────────────────────────────────────────────────────────
// Regional Fallback Rates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Taxas fixas por região (fallback quando API externa falha)
 */
const REGIONAL_RATES: Record<string, RegionalShippingRate> = {
  SP: { region: "São Paulo", fixedRate: 15.9, deliveryDays: 3 },
  RJ: { region: "Rio de Janeiro", fixedRate: 18.9, deliveryDays: 5 },
  MG: { region: "Minas Gerais", fixedRate: 19.9, deliveryDays: 5 },
  ES: { region: "Espírito Santo", fixedRate: 21.9, deliveryDays: 6 },
  PR: { region: "Paraná", fixedRate: 22.9, deliveryDays: 6 },
  SC: { region: "Santa Catarina", fixedRate: 24.9, deliveryDays: 7 },
  RS: { region: "Rio Grande do Sul", fixedRate: 26.9, deliveryDays: 8 },
  // Centro-Oeste
  GO: { region: "Goiás", fixedRate: 24.9, deliveryDays: 7 },
  MT: { region: "Mato Grosso", fixedRate: 29.9, deliveryDays: 9 },
  MS: { region: "Mato Grosso do Sul", fixedRate: 27.9, deliveryDays: 8 },
  DF: { region: "Distrito Federal", fixedRate: 23.9, deliveryDays: 6 },
  // Nordeste
  BA: { region: "Bahia", fixedRate: 29.9, deliveryDays: 9 },
  SE: { region: "Sergipe", fixedRate: 32.9, deliveryDays: 10 },
  AL: { region: "Alagoas", fixedRate: 33.9, deliveryDays: 10 },
  PE: { region: "Pernambuco", fixedRate: 34.9, deliveryDays: 10 },
  PB: { region: "Paraíba", fixedRate: 35.9, deliveryDays: 11 },
  RN: { region: "Rio Grande do Norte", fixedRate: 36.9, deliveryDays: 11 },
  CE: { region: "Ceará", fixedRate: 37.9, deliveryDays: 11 },
  PI: { region: "Piauí", fixedRate: 38.9, deliveryDays: 12 },
  MA: { region: "Maranhão", fixedRate: 39.9, deliveryDays: 12 },
  // Norte
  TO: { region: "Tocantins", fixedRate: 34.9, deliveryDays: 10 },
  PA: { region: "Pará", fixedRate: 42.9, deliveryDays: 14 },
  AP: { region: "Amapá", fixedRate: 49.9, deliveryDays: 16 },
  AM: { region: "Amazonas", fixedRate: 54.9, deliveryDays: 18 },
  RR: { region: "Roraima", fixedRate: 59.9, deliveryDays: 20 },
  AC: { region: "Acre", fixedRate: 59.9, deliveryDays: 20 },
  RO: { region: "Rondônia", fixedRate: 44.9, deliveryDays: 15 },
};

// Default rate for unknown states
const DEFAULT_RATE: RegionalShippingRate = {
  region: "Brasil",
  fixedRate: 39.9,
  deliveryDays: 12,
};

// ─────────────────────────────────────────────────────────────────────────────
// CEP Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate and normalize CEP
 */
function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

/**
 * Get state from CEP using range lookup
 */
function getStateFromCep(cep: string): string | null {
  const numCep = parseInt(normalizeCep(cep), 10);

  // CEP ranges by state (simplified)
  const ranges: Array<[number, number, string]> = [
    [1000000, 19999999, "SP"],
    [20000000, 28999999, "RJ"],
    [29000000, 29999999, "ES"],
    [30000000, 39999999, "MG"],
    [40000000, 48999999, "BA"],
    [49000000, 49999999, "SE"],
    [50000000, 56999999, "PE"],
    [57000000, 57999999, "AL"],
    [58000000, 58999999, "PB"],
    [59000000, 59999999, "RN"],
    [60000000, 63999999, "CE"],
    [64000000, 64999999, "PI"],
    [65000000, 65999999, "MA"],
    [66000000, 68899999, "PA"],
    [68900000, 68999999, "AP"],
    [69000000, 69299999, "AM"],
    [69300000, 69399999, "RR"],
    [69400000, 69899999, "AM"],
    [69900000, 69999999, "AC"],
    [70000000, 72799999, "DF"],
    [72800000, 72999999, "GO"],
    [73000000, 73699999, "DF"],
    [73700000, 76799999, "GO"],
    [76800000, 76999999, "RO"],
    [77000000, 77999999, "TO"],
    [78000000, 78899999, "MT"],
    [79000000, 79999999, "MS"],
    [80000000, 87999999, "PR"],
    [88000000, 89999999, "SC"],
    [90000000, 99999999, "RS"],
  ];

  for (const [min, max, state] of ranges) {
    if (numCep >= min && numCep <= max) {
      return state;
    }
  }

  return null;
}

/**
 * Validate CEP format
 */
function isValidCep(cep: string): boolean {
  const normalized = normalizeCep(cep);
  return /^\d{8}$/.test(normalized);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate shipping options for a given request
 */
export async function calculateShipping(
  request: ShippingQuoteRequest
): Promise<ShippingQuoteResponse> {
  const cep = normalizeCep(request.cep);

  // Validate CEP
  if (!isValidCep(cep)) {
    return {
      success: false,
      zipCode: cep,
      options: [],
      error: "CEP inválido. Verifique e tente novamente.",
      quotedAt: new Date().toISOString(),
    };
  }

  // Get shipping profile
  let profile: ShippingProfile | null = null;

  if (request.shippingProfileId) {
    profile = await shippingRepository.getById(request.shippingProfileId);
  } else if (request.productIds?.length) {
    profile = await shippingRepository.getFromProducts(request.productIds);
  } else if (request.planId) {
    profile = await shippingRepository.getFromPlan(request.planId);
  }

  // If no profile found, use a default profile for fallback calculations
  // This allows shipping to work even if products/plans don't have specific shipping profiles
  if (!profile) {
    console.log("[Shipping] No profile found, using default fallback profile");
    profile = {
      id: "default",
      name: "Perfil Padrão",
      weightKg: 0.5, // 500g default weight
      widthCm: 20,
      heightCm: 10,
      lengthCm: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Try external API if enabled
  if (CONFIG.USE_EXTERNAL_API && process.env.MELHOR_ENVIO_TOKEN) {
    try {
      const externalOptions = await fetchMelhorEnvioQuotes(cep, profile);
      if (externalOptions.length > 0) {
        return {
          success: true,
          zipCode: formatCep(cep),
          location: getStateFromCep(cep) || undefined,
          options: externalOptions,
          quotedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("[Shipping] External API error:", error);
      // Fall through to fallback
    }
  }

  // Use fallback rates
  const fallbackOptions = calculateFallbackRates(cep, profile);

  return {
    success: true,
    zipCode: formatCep(cep),
    location: getStateFromCep(cep) || undefined,
    options: fallbackOptions,
    quotedAt: new Date().toISOString(),
  };
}

/**
 * Format CEP with hyphen
 */
function formatCep(cep: string): string {
  const normalized = normalizeCep(cep);
  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// External API Integration (Melhor Envio)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch shipping quotes from Melhor Envio API
 */
async function fetchMelhorEnvioQuotes(
  destinationCep: string,
  profile: ShippingProfile
): Promise<ShippingOption[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

  try {
    const response = await fetch(CONFIG.MELHOR_ENVIO_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
      },
      body: JSON.stringify({
        from: { postal_code: CONFIG.ORIGIN_CEP },
        to: { postal_code: destinationCep },
        package: {
          weight: profile.weightKg,
          width: profile.widthCm,
          height: profile.heightCm,
          length: profile.lengthCm,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Melhor Envio API error: ${response.status}`);
    }

    const data: MelhorEnvioQuoteResponse[] = await response.json();

    // Transform to our format and filter valid options
    return data
      .filter((item) => !item.error && parseFloat(item.price) > 0)
      .map((item, index) => ({
        id: `melhor_envio_${item.id}`,
        carrier: item.company.name,
        service: item.name,
        name: `${item.company.name} ${item.name}`,
        price: parseFloat(item.custom_price || item.price),
        deliveryDays: item.delivery_range.max,
        estimatedDays: item.delivery_range.max,
        deliveryTime: `${item.delivery_range.min} a ${item.delivery_range.max} dias úteis`,
        recommended: index === 0,
      }))
      .sort((a, b) => a.price - b.price);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate shipping using fixed regional rates (fallback)
 */
function calculateFallbackRates(
  destinationCep: string,
  profile: ShippingProfile
): ShippingOption[] {
  const state = getStateFromCep(destinationCep);
  const rate = state ? REGIONAL_RATES[state] : DEFAULT_RATE;

  if (!rate) {
    return [createDefaultOption(profile)];
  }

  // Adjust price based on weight
  const weightMultiplier = Math.max(1, profile.weightKg / 0.5); // Base is 500g
  const adjustedPrice = Math.max(
    CONFIG.MIN_SHIPPING_PRICE,
    rate.fixedRate * weightMultiplier
  );

  // Create PAC-like option (cheaper, slower)
  const pacOption: ShippingOption = {
    id: "fallback_pac",
    carrier: "Correios",
    service: "PAC",
    name: "Correios PAC",
    price: roundPrice(adjustedPrice),
    deliveryDays: rate.deliveryDays + 2,
    estimatedDays: rate.deliveryDays + 2,
    deliveryTime: `${rate.deliveryDays} a ${rate.deliveryDays + 4} dias úteis`,
    recommended: true,
  };

  // Create SEDEX-like option (faster, more expensive)
  const sedexOption: ShippingOption = {
    id: "fallback_sedex",
    carrier: "Correios",
    service: "SEDEX",
    name: "Correios SEDEX",
    price: roundPrice(adjustedPrice * 1.8),
    deliveryDays: Math.max(1, rate.deliveryDays - 3),
    estimatedDays: Math.max(1, rate.deliveryDays - 3),
    deliveryTime: `${Math.max(1, rate.deliveryDays - 4)} a ${Math.max(2, rate.deliveryDays - 2)} dias úteis`,
    recommended: false,
  };

  return [pacOption, sedexOption];
}

/**
 * Create default shipping option when no rate is available
 */
function createDefaultOption(profile: ShippingProfile): ShippingOption {
  const basePrice = Math.max(CONFIG.MIN_SHIPPING_PRICE, profile.weightKg * 20);

  return {
    id: "fallback_default",
    carrier: "Transportadora",
    service: "Padrão",
    name: "Entrega Padrão",
    price: roundPrice(basePrice),
    deliveryDays: 15,
    estimatedDays: 15,
    deliveryTime: "10 a 15 dias úteis",
    recommended: true,
  };
}

/**
 * Round price to 2 decimal places
 */
function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Shipping Data Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build shipping data to persist in Order
 * Can accept either a full ShippingOption or a SelectedShippingOption
 */
export function buildOrderShippingData(
  selectedOption: ShippingOption | SelectedShippingOption,
  destinationCep: string,
  profile?: ShippingProfile | null
): OrderShippingData {
  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(
    estimatedDeliveryDate.getDate() + selectedOption.deliveryDays
  );

  return {
    optionId: selectedOption.id,
    carrier: selectedOption.carrier,
    service: selectedOption.service,
    price: selectedOption.price,
    deliveryDays: selectedOption.deliveryDays,
    destinationZipCode: normalizeCep(destinationCep),
    originZipCode: CONFIG.ORIGIN_CEP,
    totalWeightKg: profile?.weightKg || 0,
    dimensions: {
      widthCm: profile?.widthCm || 0,
      heightCm: profile?.heightCm || 0,
      lengthCm: profile?.lengthCm || 0,
    },
    quotedAt: new Date().toISOString(),
    estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that products/plan have shipping profiles
 */
export async function validateShippingAvailability(
  productIds?: string[],
  planId?: string
): Promise<{ valid: boolean; error?: string }> {
  if (productIds?.length) {
    const profile = await shippingRepository.getFromProducts(productIds);
    if (!profile) {
      return {
        valid: false,
        error: "Um ou mais produtos não possuem configuração de frete",
      };
    }
  }

  if (planId) {
    const profile = await shippingRepository.getFromPlan(planId);
    if (!profile) {
      return {
        valid: false,
        error: "O plano selecionado não possui configuração de frete",
      };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Service
// ─────────────────────────────────────────────────────────────────────────────

export const shippingService = {
  calculateShipping,
  buildOrderShippingData,
  validateShippingAvailability,
  getStateFromCep,
  isValidCep,
  normalizeCep,
  formatCep,
};
