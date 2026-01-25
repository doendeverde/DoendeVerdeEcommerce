/**
 * Shipping Types
 *
 * Types for shipping calculation, profiles, and freight quotes.
 */

import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Profile Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ShippingProfileBase {
  name: string;
  weightKg: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
  isActive?: boolean;
}

export interface ShippingProfile extends ShippingProfileBase {
  id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingProfileWithRelations extends ShippingProfile {
  products?: { id: string; name: string }[];
  subscriptionPlans?: { id: string; name: string }[];
  _count?: {
    products: number;
    subscriptionPlans: number;
  };
}

export type ShippingProfileCreateInput = ShippingProfileBase;
export type ShippingProfileUpdateInput = Partial<ShippingProfileBase>;

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Quote Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ShippingQuoteRequest {
  /** CEP de destino (apenas números ou com hífen) */
  cep: string;
  /** ID do perfil de frete a usar */
  shippingProfileId?: string;
  /** IDs dos produtos no carrinho (usado para calcular peso total) */
  productIds?: string[];
  /** ID do plano de assinatura */
  planId?: string;
}

export interface ShippingOption {
  /** ID único da opção (ex: "correios_pac", "jadlog_package") */
  id: string;
  /** Nome da transportadora */
  carrier: string;
  /** Nome do serviço (PAC, SEDEX, etc) */
  service: string;
  /** Nome para exibição (carrier + service) */
  name: string;
  /** Preço do frete em reais */
  price: number;
  /** Prazo estimado em dias úteis */
  deliveryDays: number;
  /** Alias para deliveryDays (compatibilidade) */
  estimatedDays: number;
  /** Prazo formatado (ex: "5 a 8 dias úteis") */
  deliveryTime: string;
  /** Se é a opção recomendada/mais barata */
  recommended?: boolean;
}

/** Opção de frete selecionada pelo usuário no checkout */
export interface SelectedShippingOption {
  id: string;
  carrier: string;
  service: string;
  name: string;
  price: number;
  deliveryDays: number;
}

export interface ShippingQuoteResponse {
  success: boolean;
  /** CEP formatado */
  zipCode: string;
  /** Cidade/estado (se disponível) */
  location?: string;
  /** Opções de frete disponíveis */
  options: ShippingOption[];
  /** Mensagem de erro (se houver) */
  error?: string;
  /** Timestamp da cotação */
  quotedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Data (persisted in Order)
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderShippingData {
  /** ID da opção selecionada */
  optionId: string;
  /** Nome da transportadora */
  carrier: string;
  /** Nome do serviço */
  service: string;
  /** Preço do frete */
  price: number;
  /** Prazo em dias úteis */
  deliveryDays: number;
  /** CEP de destino */
  destinationZipCode: string;
  /** CEP de origem (loja) */
  originZipCode: string;
  /** Peso total em kg */
  totalWeightKg: number;
  /** Dimensões do pacote */
  dimensions: {
    widthCm: number;
    heightCm: number;
    lengthCm: number;
  };
  /** Timestamp da cotação */
  quotedAt: string;
  /** Data estimada de entrega */
  estimatedDeliveryDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// External API Types (Melhor Envio / Correios)
// ─────────────────────────────────────────────────────────────────────────────

export interface MelhorEnvioQuoteRequest {
  from: { postal_code: string };
  to: { postal_code: string };
  package: {
    weight: number; // kg
    width: number; // cm
    height: number; // cm
    length: number; // cm
  };
  options?: {
    insurance_value?: number;
    receipt?: boolean;
    own_hand?: boolean;
  };
}

export interface MelhorEnvioQuoteResponse {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: {
    min: number;
    max: number;
  };
  company: {
    id: number;
    name: string;
    picture: string;
  };
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback / Fixed Shipping Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegionalShippingRate {
  /** Estado ou região */
  region: string;
  /** Taxa fixa para a região */
  fixedRate: number;
  /** Prazo estimado */
  deliveryDays: number;
}

export const BRAZILIAN_REGIONS: Record<string, string[]> = {
  SUDESTE: ["SP", "RJ", "MG", "ES"],
  SUL: ["PR", "SC", "RS"],
  CENTRO_OESTE: ["GO", "MT", "MS", "DF"],
  NORDESTE: ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"],
  NORTE: ["AM", "PA", "AC", "RO", "RR", "AP", "TO"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Calculator Context
// ─────────────────────────────────────────────────────────────────────────────

export interface ShippingCalculatorState {
  cep: string;
  isLoading: boolean;
  options: ShippingOption[];
  selectedOption: ShippingOption | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderShippingInfo Types (Database Model)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Data required to create an OrderShippingInfo record
 */
export interface CreateOrderShippingInfoData {
  carrier: string;
  serviceCode: string;
  serviceName: string;
  estimatedDays: number;
  shippingCost: number;
  packageWeight?: number;
  packageDimensions?: {
    width: number;
    height: number;
    length: number;
  };
  quotedAt: Date;
}

/**
 * Build CreateOrderShippingInfoData from shipping option and quote data
 */
export function buildOrderShippingInfoData(
  option: SelectedShippingOption,
  weight?: number,
  dimensions?: { widthCm: number; heightCm: number; lengthCm: number }
): CreateOrderShippingInfoData {
  return {
    carrier: option.carrier,
    serviceCode: option.id,
    serviceName: option.service,
    estimatedDays: option.deliveryDays,
    shippingCost: option.price,
    packageWeight: weight,
    packageDimensions: dimensions
      ? {
          width: dimensions.widthCm,
          height: dimensions.heightCm,
          length: dimensions.lengthCm,
        }
      : undefined,
    quotedAt: new Date(),
  };
}
