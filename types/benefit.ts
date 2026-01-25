/**
 * Types for Subscription Benefits
 */

import { Benefit, PlanBenefit } from '@prisma/client';

// ==========================================
// BENEFIT TYPES
// ==========================================

export interface BenefitWithRelations extends Benefit {
  planBenefits?: PlanBenefitWithPlan[];
}

export interface PlanBenefitWithBenefit extends PlanBenefit {
  benefit: Benefit;
}

export interface PlanBenefitWithPlan extends PlanBenefit {
  plan: {
    id: string;
    name: string;
    slug: string;
  };
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface BenefitListResponse {
  benefits: Benefit[];
  total: number;
}

export interface PlanBenefitsResponse {
  planId: string;
  planName: string;
  benefits: Array<{
    id: string;
    benefitId: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    enabled: boolean;
    customValue: string | null;
  }>;
}

// ==========================================
// CREATE/UPDATE TYPES
// ==========================================

export interface CreateBenefitInput {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateBenefitInput {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdatePlanBenefitsInput {
  benefits: Array<{
    benefitId: string;
    enabled: boolean;
    customValue?: string | null;
  }>;
}

// ==========================================
// DISPLAY TYPES (Frontend)
// ==========================================

export interface BenefitDisplay {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  enabled: boolean;
  customValue: string | null;
}

export interface PlanWithBenefits {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPercent: number;
  benefits: BenefitDisplay[];
}

// ==========================================
// LUCIDE ICON NAMES (for validation)
// ==========================================

export const ALLOWED_BENEFIT_ICONS = [
  'Truck',
  'Percent',
  'Gift',
  'Zap',
  'Headset',
  'Star',
  'Crown',
  'Shield',
  'Clock',
  'Heart',
  'Award',
  'Sparkles',
  'BadgeCheck',
  'Package',
  'CreditCard',
] as const;

export type BenefitIconName = typeof ALLOWED_BENEFIT_ICONS[number];
