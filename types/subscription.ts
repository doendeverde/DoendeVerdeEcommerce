/**
 * Subscription Types for Frontend
 *
 * Tipos para planos de assinatura e assinaturas do usuário.
 * Todos os dados vêm do banco de dados via API/repository.
 */

import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Color Scheme Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Color scheme stored in database as JSON
 */
export interface PlanColorScheme {
  primary: string;      // Primary background color
  text: string;         // Text color on primary
  primaryDark: string;  // Primary color for dark mode
  textDark: string;     // Text color for dark mode
  badge?: string;       // Badge background color (optional)
  icon?: string;        // Icon background color (optional)
}

/**
 * Default color schemes by plan type
 */
export const DEFAULT_COLOR_SCHEMES: Record<string, PlanColorScheme> = {
  free: {
    primary: "#6B7280",
    text: "#FFFFFF",
    primaryDark: "#4B5563",
    textDark: "#FFFFFF",
  },
  basic: {
    primary: "#22C55E",
    text: "#FFFFFF",
    primaryDark: "#16A34A",
    textDark: "#FFFFFF",
  },
  popular: {
    primary: "#22C55E",
    text: "#FFFFFF",
    primaryDark: "#16A34A",
    textDark: "#FFFFFF",
    badge: "#22C55E",
  },
  premium: {
    primary: "#8B5CF6",
    text: "#FFFFFF",
    primaryDark: "#7C3AED",
    textDark: "#FFFFFF",
    badge: "#8B5CF6",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Plan Types
// ─────────────────────────────────────────────────────────────────────────────

// Plan with all relations loaded from Prisma
export type SubscriptionPlanWithRelations = Prisma.SubscriptionPlanGetPayload<{
  include: {
    products: {
      include: {
        product: true;
      };
    };
    _count: {
      select: {
        subscriptions: true;
      };
    };
  };
}>;

// Benefit item for display (includes enabled state for showing disabled benefits)
export interface BenefitItem {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  customValue?: string | null;
  enabled?: boolean; // Whether this benefit is included in the plan
}

// Plan for display in subscription page (SSR optimized)
export interface SubscriptionPlanItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  billingCycle: string;
  active: boolean;
  isFeatured: boolean;
  // From database
  discountPercent: number;
  colorScheme?: PlanColorScheme | null;
  benefits: BenefitItem[];
  // Derived from isFeatured
  badge?: "popular" | "premium";
}

// ─────────────────────────────────────────────────────────────────────────────
// User Subscription Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPercent: number;
  colorScheme?: PlanColorScheme | null;
  benefits?: BenefitItem[];
}

export interface UserSubscriptionInfo {
  id: string;
  status: string;
  startedAt: Date;
  nextBillingAt: Date;
  plan: UserSubscriptionPlan;
}

// Subscription with full plan details for dashboard
export type SubscriptionWithDetails = Prisma.SubscriptionGetPayload<{
  include: {
    plan: true;
  };
}>;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get color scheme for a plan (from database or default)
 */
export function getPlanColorScheme(colorScheme: PlanColorScheme | null | undefined, isFeatured: boolean): PlanColorScheme {
  if (colorScheme) return colorScheme;
  
  // Return default based on featured status
  return isFeatured ? DEFAULT_COLOR_SCHEMES.premium : DEFAULT_COLOR_SCHEMES.basic;
}

// ─────────────────────────────────────────────────────────────────────────────
// Free Plan Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Virtual free plan for users without subscription
 * Used when user has no active subscription
 */
export const FREE_PLAN: SubscriptionPlanItem = {
  id: "free",
  name: "Gratuito",
  slug: "gratuito",
  description: "Acesso básico à plataforma",
  shortDescription: "Acesso básico à plataforma",
  price: 0,
  billingCycle: "MONTHLY",
  active: true,
  isFeatured: false,
  discountPercent: 0,
  colorScheme: DEFAULT_COLOR_SCHEMES.free,
  benefits: [
    { name: "Acesso ao catálogo completo", slug: "catalogo-completo", enabled: true },
    { name: "Acúmulo de pontos nas compras", slug: "acumulo-pontos", enabled: true },
    { name: "Troca de pontos por cupons", slug: "troca-cupons", enabled: true },
    { name: "Suporte por email", slug: "suporte-email", enabled: true },
  ],
};

