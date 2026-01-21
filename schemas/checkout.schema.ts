/**
 * Checkout Schemas
 * 
 * Zod validation schemas for checkout flows.
 * Used in API routes and form validation.
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Address Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  street: z.string().min(3, "Rua é obrigatória").max(200),
  number: z.string().min(1, "Número é obrigatório").max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório").max(100),
  city: z.string().min(2, "Cidade é obrigatória").max(100),
  state: z.string().length(2, "Estado deve ter 2 caracteres (UF)"),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  country: z.string().default("BR"),
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressSchema.partial();

export const addressIdSchema = z.object({
  addressId: z.string().uuid("ID de endereço inválido"),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Preferences Schemas
// ─────────────────────────────────────────────────────────────────────────────

// Enums matching Prisma
const paperTypeEnum = z.enum(["WHITE", "BROWN", "CELLULOSE", "MIXED"]);
const paperSizeEnum = z.enum(["MINI", "KING_SIZE_SLIM", "KING_SIZE_TRADITIONAL", "KING_SIZE_LONG", "MIXED"]);
const filterPaperSizeEnum = z.enum(["SHORT", "MEDIUM", "LONG", "ULTRA_LONG", "MIXED"]);
const glassFilterSizeEnum = z.enum(["SHORT", "MEDIUM", "LONG", "MIXED"]);
const glassFilterThicknessEnum = z.enum(["THIN", "MEDIUM", "THICK", "MIXED"]);
const tobaccoUsageEnum = z.enum(["FULL_TIME", "MIX_ONLY", "NONE"]);
const consumptionFrequencyEnum = z.enum(["OCCASIONAL", "WEEKLY", "DAILY", "HEAVY"]);
const consumptionMomentEnum = z.enum(["MORNING", "AFTERNOON", "NIGHT", "WEEKEND"]);

export const preferencesSchema = z.object({
  yearsSmoking: z.number().int().min(0).max(100).optional().nullable(),
  favoritePaperType: paperTypeEnum.optional().nullable(),
  favoritePaperSize: paperSizeEnum.optional().nullable(),
  paperFilterSize: filterPaperSizeEnum.optional().nullable(),
  glassFilterSize: glassFilterSizeEnum.optional().nullable(),
  glassFilterThickness: glassFilterThicknessEnum.optional().nullable(),
  favoriteColors: z.array(z.string()).default([]),
  tobaccoUsage: tobaccoUsageEnum.optional().nullable(),
  consumptionFrequency: consumptionFrequencyEnum.optional().nullable(),
  consumptionMoment: z.array(consumptionMomentEnum).default([]),
  consumesFlower: z.boolean().default(false),
  consumesSkunk: z.boolean().default(false),
  consumesHash: z.boolean().default(false),
  consumesExtracts: z.boolean().default(false),
  consumesOilEdibles: z.boolean().default(false),
  likesAccessories: z.boolean().default(false),
  likesCollectibles: z.boolean().default(false),
  likesPremiumItems: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
});

export const preferencesUpdateSchema = preferencesSchema.partial();

export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Payment Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const paymentMethodEnum = z.enum(["credit_card", "debit_card", "pix"]);

export const paymentDataSchema = z.object({
  method: paymentMethodEnum,
  // For card payments (token from Mercado Pago SDK)
  cardToken: z.string().optional(),
  cardBrand: z.string().optional(),
  cardLastFour: z.string().length(4).optional(),
  installments: z.number().int().min(1).max(12).default(1),
}).refine(
  (data) => {
    // Card payments require token
    if (data.method === "credit_card" || data.method === "debit_card") {
      return !!data.cardToken;
    }
    return true;
  },
  { message: "Token do cartão é obrigatório para pagamento com cartão" }
);

export type PaymentDataInput = z.infer<typeof paymentDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const selectedShippingOptionSchema = z.object({
  id: z.string().min(1, "ID da opção de frete é obrigatório"),
  carrier: z.string().min(1, "Transportadora é obrigatória"),
  service: z.string().min(1, "Serviço é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  deliveryDays: z.number().int().min(0, "Prazo não pode ser negativo"),
});

export type SelectedShippingOptionInput = z.infer<typeof selectedShippingOptionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Checkout Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionCheckoutSchema = z.object({
  planSlug: z.string().min(1, "Plano é obrigatório"),
  addressId: z.string().uuid("ID de endereço inválido"),
  paymentData: paymentDataSchema,
  shippingOption: selectedShippingOptionSchema.optional(),
});

export type SubscriptionCheckoutInput = z.infer<typeof subscriptionCheckoutSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Product Checkout Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const productCheckoutSchema = z.object({
  addressId: z.string().uuid("ID de endereço inválido"),
  paymentData: paymentDataSchema,
  notes: z.string().max(500).optional(),
  shippingOption: selectedShippingOptionSchema.optional(),
});

export type ProductCheckoutInput = z.infer<typeof productCheckoutSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Schemas (Mercado Pago)
// ─────────────────────────────────────────────────────────────────────────────

export const mercadoPagoWebhookSchema = z.object({
  action: z.string(),
  api_version: z.string().optional(),
  data: z.object({
    id: z.string(),
  }),
  date_created: z.string().optional(),
  id: z.union([z.string(), z.number()]),
  live_mode: z.boolean().optional(),
  type: z.string(),
  user_id: z.union([z.string(), z.number()]).optional(),
});

export type MercadoPagoWebhookInput = z.infer<typeof mercadoPagoWebhookSchema>;
