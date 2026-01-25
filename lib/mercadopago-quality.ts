/**
 * Mercado Pago Quality Configuration
 * 
 * Constantes e tipos para garantir alta taxa de aprovação
 * seguindo o checklist de qualidade do Mercado Pago.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CHECKLIST DE QUALIDADE MP:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ✅ OBRIGATÓRIOS:
 *   - webhooks_ipn: Notificações webhook habilitadas
 *   - external_reference: Referência externa para conciliação
 *   - back_end_sdk: Uso do SDK oficial de backend
 *   - web_front_end_sdk: Uso do MercadoPago.js V2
 *   - statement_descriptor: Descrição na fatura do cartão
 *   - ssl/tls: Certificados de segurança
 *   - secure_form: Uso de Secure Fields/Card Form
 *   - payer.email: Email do comprador
 *   - payer.first_name: Nome do comprador
 *   - payer.last_name: Sobrenome do comprador
 *   - items[]: Informações dos itens
 * 
 * ⭐ BOAS PRÁTICAS (aumentam aprovação):
 *   - payer.address: Endereço do comprador
 *   - payer.phone: Telefone do comprador
 *   - payer.identification: CPF/CNPJ do comprador
 *   - additional_info: Dados adicionais anti-fraude
 *   - binary_mode: Resposta binária (opcional)
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/checkout-api/best-practices
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Statement Descriptor - Texto que aparece na fatura do cartão.
 * Máximo: 22 caracteres
 * Deve ser o nome do estabelecimento para evitar chargebacks.
 */
export const STATEMENT_DESCRIPTOR = "DOENDEVERDE";

/**
 * Prefixo para external_reference.
 * Facilita a identificação e conciliação.
 */
export const EXTERNAL_REF_PREFIX = {
  ORDER: "order_",
  SUBSCRIPTION: "sub_",
  PIX: "pix_",
} as const;

/**
 * Categoria do MCC (Merchant Category Code) para headshop/tabacaria.
 * Usado no campo items[].category_id
 */
export const CATEGORY_ID = "others"; // MP category for miscellaneous items

/**
 * Tempo de expiração padrão para PIX (em minutos).
 */
export const PIX_EXPIRATION_MINUTES = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Types for Additional Info
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dados do item para additional_info.
 * Melhora análise de fraude e conciliação.
 */
export interface MPItemInfo {
  /** ID único do produto no sistema */
  id: string;
  /** Nome/título do produto */
  title: string;
  /** Descrição do produto (max 256 chars) */
  description?: string;
  /** URL da imagem do produto */
  picture_url?: string;
  /** Categoria do item (MP category) */
  category_id?: string;
  /** Quantidade */
  quantity: number;
  /** Preço unitário em reais */
  unit_price: number;
}

/**
 * Endereço do pagador para additional_info.payer.
 */
export interface MPPayerAddress {
  /** CEP */
  zip_code: string;
  /** Logradouro */
  street_name: string;
  /** Número */
  street_number: string;
}

/**
 * Telefone do pagador.
 */
export interface MPPayerPhone {
  /** Código de área (DDD) */
  area_code: string;
  /** Número do telefone */
  number: string;
}

/**
 * Dados do pagador para additional_info.payer.
 * Quanto mais dados, maior a taxa de aprovação.
 */
export interface MPPayerInfo {
  /** Nome */
  first_name?: string;
  /** Sobrenome */
  last_name?: string;
  /** Telefone */
  phone?: MPPayerPhone;
  /** Endereço */
  address?: MPPayerAddress;
  /** Data de registro no site (ISO 8601) */
  registration_date?: string;
}

/**
 * Dados do destinatário para shipments.
 */
export interface MPReceiverAddress {
  /** CEP */
  zip_code: string;
  /** UF */
  state_name: string;
  /** Cidade */
  city_name: string;
  /** Logradouro */
  street_name: string;
  /** Número */
  street_number: string;
  /** Apartamento/complemento */
  apartment?: string;
}

/**
 * Dados de envio.
 * Importante para produtos físicos.
 */
export interface MPShipments {
  /** Endereço de entrega */
  receiver_address: MPReceiverAddress;
}

/**
 * Additional Info completo.
 * Enviado no campo additional_info do pagamento.
 */
export interface MPAdditionalInfo {
  /** Lista de itens */
  items?: MPItemInfo[];
  /** Dados do pagador */
  payer?: MPPayerInfo;
  /** Dados de envio */
  shipments?: MPShipments;
  /** IP do comprador (capturado no frontend) */
  ip_address?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Types (Extended)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dados do pagador estendidos para alta qualidade.
 */
export interface QualityPayerData {
  email: string;
  first_name?: string;
  last_name?: string;
  identification?: {
    type: string;
    number: string;
  };
  phone?: MPPayerPhone;
  address?: MPPayerAddress;
}

/**
 * Dados de envio para o pagamento.
 */
export interface QualityShippingData {
  zipCode: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement?: string;
}

/**
 * Item do pedido para o pagamento.
 */
export interface QualityItemData {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  quantity: number;
  unit_price: number;
}

/**
 * Request de pagamento com dados completos para qualidade.
 */
export interface QualityPaymentRequest {
  /** Valor total */
  amount: number;
  /** Descrição do pagamento */
  description: string;
  /** Referência externa (order ID) */
  externalReference: string;
  /** Dados do pagador */
  payer: QualityPayerData;
  /** Itens do pedido */
  items?: QualityItemData[];
  /** Dados de envio */
  shipping?: QualityShippingData;
  /** Metadados adicionais */
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrai DDD e número de um telefone brasileiro.
 * @example parsePhone("11999998888") => { area_code: "11", number: "999998888" }
 */
export function parsePhone(phone: string | null | undefined): MPPayerPhone | undefined {
  if (!phone) return undefined;
  
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, "");
  
  // Telefone brasileiro: 10 ou 11 dígitos (com DDD)
  if (digits.length >= 10 && digits.length <= 11) {
    return {
      area_code: digits.slice(0, 2),
      number: digits.slice(2),
    };
  }
  
  return undefined;
}

/**
 * Constrói o objeto additional_info para o pagamento.
 */
export function buildAdditionalInfo(
  request: QualityPaymentRequest,
  ipAddress?: string
): MPAdditionalInfo {
  const additionalInfo: MPAdditionalInfo = {};
  
  // Items
  if (request.items && request.items.length > 0) {
    additionalInfo.items = request.items.map((item) => ({
      id: item.id,
      title: item.title.slice(0, 256), // Max 256 chars
      description: item.description?.slice(0, 256),
      picture_url: item.picture_url,
      category_id: CATEGORY_ID,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
  }
  
  // Payer info
  if (request.payer) {
    additionalInfo.payer = {
      first_name: request.payer.first_name,
      last_name: request.payer.last_name,
      phone: request.payer.phone,
      address: request.payer.address,
    };
  }
  
  // Shipments
  if (request.shipping) {
    additionalInfo.shipments = {
      receiver_address: {
        zip_code: request.shipping.zipCode.replace(/\D/g, ""),
        state_name: request.shipping.state,
        city_name: request.shipping.city,
        street_name: request.shipping.street,
        street_number: request.shipping.number,
        apartment: request.shipping.complement,
      },
    };
  }
  
  // IP Address
  if (ipAddress) {
    additionalInfo.ip_address = ipAddress;
  }
  
  return additionalInfo;
}

/**
 * Converte endereço do sistema para formato MP payer.address.
 */
export function buildPayerAddress(
  street: string,
  number: string,
  zipCode: string
): MPPayerAddress {
  return {
    zip_code: zipCode.replace(/\D/g, ""),
    street_name: street,
    street_number: number,
  };
}

/**
 * Gera external_reference padronizado.
 */
export function generateExternalReference(
  type: keyof typeof EXTERNAL_REF_PREFIX,
  id: string
): string {
  return `${EXTERNAL_REF_PREFIX[type]}${id}`;
}

/**
 * Valida se o pagamento tem os campos obrigatórios de qualidade.
 */
export function validateQualityFields(request: QualityPaymentRequest): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  // Obrigatórios
  if (!request.payer.email) missing.push("payer.email");
  if (!request.externalReference) missing.push("external_reference");
  
  // Recomendados (não bloqueiam, mas logam warning)
  if (!request.payer.first_name) {
    console.warn("[MP Quality] Missing payer.first_name - may reduce approval rate");
  }
  if (!request.payer.last_name) {
    console.warn("[MP Quality] Missing payer.last_name - may reduce approval rate");
  }
  if (!request.items || request.items.length === 0) {
    console.warn("[MP Quality] Missing items[] - may reduce approval rate");
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
