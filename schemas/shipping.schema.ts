/**
 * Shipping Schemas
 *
 * Zod validation schemas for shipping-related operations.
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Profile Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const shippingProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  weightKg: z
    .number()
    .positive("Peso deve ser maior que zero")
    .max(30, "Peso máximo de 30kg"),
  widthCm: z
    .number()
    .int("Largura deve ser um número inteiro")
    .positive("Largura deve ser maior que zero")
    .max(100, "Largura máxima de 100cm"),
  heightCm: z
    .number()
    .int("Altura deve ser um número inteiro")
    .positive("Altura deve ser maior que zero")
    .max(100, "Altura máxima de 100cm"),
  lengthCm: z
    .number()
    .int("Comprimento deve ser um número inteiro")
    .positive("Comprimento deve ser maior que zero")
    .max(100, "Comprimento máximo de 100cm"),
  isActive: z.boolean().optional().default(true),
});

export const shippingProfileUpdateSchema = shippingProfileSchema.partial();

export type ShippingProfileInput = z.infer<typeof shippingProfileSchema>;
export type ShippingProfileUpdateInput = z.infer<typeof shippingProfileUpdateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// CEP Validation
// ─────────────────────────────────────────────────────────────────────────────

const cepRegex = /^\d{5}-?\d{3}$/;

export const cepSchema = z
  .string()
  .regex(cepRegex, "CEP inválido. Use o formato 00000-000 ou 00000000")
  .transform((cep) => cep.replace(/\D/g, ""));

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Quote Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const shippingQuoteRequestSchema = z
  .object({
    cep: cepSchema,
    shippingProfileId: z.string().uuid("ID do perfil inválido").optional(),
    productIds: z.array(z.string().uuid("ID de produto inválido")).optional(),
    planId: z.string().uuid("ID do plano inválido").optional(),
  })
  .refine(
    (data) => data.shippingProfileId || data.productIds?.length || data.planId,
    {
      message:
        "É necessário informar shippingProfileId, productIds ou planId para calcular o frete",
    }
  );

export type ShippingQuoteRequestInput = z.infer<typeof shippingQuoteRequestSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Selected Shipping Option Schema (for checkout)
// ─────────────────────────────────────────────────────────────────────────────

export const selectedShippingOptionSchema = z.object({
  optionId: z.string().min(1, "Selecione uma opção de frete"),
  carrier: z.string().min(1),
  service: z.string().min(1),
  price: z.number().nonnegative("Valor do frete inválido"),
  deliveryDays: z.number().int().positive(),
});

export type SelectedShippingOptionInput = z.infer<typeof selectedShippingOptionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Order Shipping Data Schema (for persistence)
// ─────────────────────────────────────────────────────────────────────────────

export const orderShippingDataSchema = z.object({
  optionId: z.string(),
  carrier: z.string(),
  service: z.string(),
  price: z.number().nonnegative(),
  deliveryDays: z.number().int().positive(),
  destinationZipCode: z.string(),
  originZipCode: z.string(),
  totalWeightKg: z.number().positive(),
  dimensions: z.object({
    widthCm: z.number().positive(),
    heightCm: z.number().positive(),
    lengthCm: z.number().positive(),
  }),
  quotedAt: z.string(),
  estimatedDeliveryDate: z.string().optional(),
});

export type OrderShippingDataInput = z.infer<typeof orderShippingDataSchema>;
