/**
 * Zod Schemas for Benefit Validation
 */

import { z } from 'zod';
import { ALLOWED_BENEFIT_ICONS } from '@/types/benefit';

// ==========================================
// BENEFIT SCHEMAS
// ==========================================

export const createBenefitSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z
    .string()
    .min(2, 'Slug deve ter pelo menos 2 caracteres')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .optional(),
  icon: z
    .enum(ALLOWED_BENEFIT_ICONS as unknown as [string, ...string[]])
    .nullable()
    .optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const updateBenefitSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  slug: z
    .string()
    .min(2, 'Slug deve ter pelo menos 2 caracteres')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .optional(),
  icon: z
    .enum(ALLOWED_BENEFIT_ICONS as unknown as [string, ...string[]])
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// ==========================================
// PLAN BENEFIT SCHEMAS
// ==========================================

export const planBenefitItemSchema = z.object({
  benefitId: z.string().uuid('ID do benefício inválido'),
  enabled: z.boolean(),
  customValue: z.string().max(100).nullable().optional(),
});

export const updatePlanBenefitsSchema = z.object({
  benefits: z.array(planBenefitItemSchema).min(1, 'Pelo menos um benefício deve ser informado'),
});

// ==========================================
// QUERY PARAMS SCHEMAS
// ==========================================

export const benefitQuerySchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  orderBy: z.enum(['name', 'displayOrder', 'createdAt']).optional().default('displayOrder'),
  orderDir: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreateBenefitInput = z.infer<typeof createBenefitSchema>;
export type UpdateBenefitInput = z.infer<typeof updateBenefitSchema>;
export type PlanBenefitItem = z.infer<typeof planBenefitItemSchema>;
export type UpdatePlanBenefitsInput = z.infer<typeof updatePlanBenefitsSchema>;
export type BenefitQueryParams = z.infer<typeof benefitQuerySchema>;
