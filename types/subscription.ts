/**
 * Subscription Types for Frontend
 *
 * Tipos para planos de assinatura e assinaturas do usuário.
 * Os benefícios são configuração estática para flexibilidade de marketing.
 */

import type { Prisma } from "@prisma/client";

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

// Plan for display in subscription page (SSR optimized)
export interface SubscriptionPlanItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  active: boolean;
  // Computed/Display fields
  discountPercent: number;
  monthlyPoints: number;
  benefits: string[];
  badge?: "popular" | "premium";
  order: number;
  // Color fields for display
  color: string;
  colorDark: string;
  shortDescription: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Subscription Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSubscriptionInfo {
  id: string;
  status: string;
  startedAt: Date;
  nextBillingAt: Date;
  plan: {
    id: string;
    name: string;
    slug: string;
    price: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan Benefits Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plan display configuration interface
 */
export interface PlanDisplayConfig {
  discountPercent: number;
  monthlyPoints: number;
  benefits: string[];
  badge?: "popular" | "premium";
  order: number;
  color: string; // Primary gradient color
  colorDark: string; // Secondary gradient color
  shortDescription: string; // Short description for carousel
}

/**
 * Benefits configuration for each plan tier
 * This is configuration data, not database data
 * Allows marketing flexibility without database migrations
 */
export const PLAN_CONFIG: Record<string, PlanDisplayConfig> = {
  gratuito: {
    discountPercent: 0,
    monthlyPoints: 0,
    benefits: [
      "Acesso ao catálogo completo",
      "Acúmulo de pontos nas compras",
      "Troca de pontos por cupons",
      "Suporte por email",
    ],
    order: 0,
    color: "#6B7280", // Gray
    colorDark: "#4B5563",
    shortDescription: "Acesso básico à plataforma",
  },
  "doende-x": {
    discountPercent: 5,
    monthlyPoints: 200,
    benefits: [
      "Tudo do plano Gratuito",
      "200 pontos mensais automáticos",
      "5% de desconto em todas as compras",
      "Acúmulo de pontos 1.2x mais rápido",
      "Frete grátis acima de R$ 150",
      "Acesso a produtos exclusivos",
      "Suporte prioritário",
    ],
    order: 1,
    color: "#22C55E", // Green
    colorDark: "#16A34A",
    shortDescription: "5% de desconto + 200 pontos/mês",
  },
  "doende-bronze": {
    discountPercent: 15,
    monthlyPoints: 350,
    benefits: [
      "Tudo do plano Doende X",
      "350 pontos mensais automáticos",
      "15% de desconto em todas as compras",
      "Acúmulo de pontos 1.5x mais rápido",
      "Frete grátis acima de R$ 100",
      "Brindes mensais exclusivos",
      "Acesso antecipado a lançamentos",
      "Suporte VIP 24/7",
    ],
    badge: "popular",
    order: 2,
    color: "#CD7F32", // Bronze
    colorDark: "#A0522D",
    shortDescription: "15% de desconto + 350 pontos/mês",
  },
  "doende-prata": {
    discountPercent: 20,
    monthlyPoints: 500,
    benefits: [
      "Tudo do plano Bronze",
      "500 pontos mensais automáticos",
      "20% de desconto em todas as compras",
      "Acúmulo de pontos 2x mais rápido",
      "Frete grátis em todas as compras",
      "Produtos exclusivos premium",
      "Kit de boas-vindas premium",
      "Convite para eventos exclusivos",
      "Suporte VIP dedicado",
    ],
    badge: "premium",
    order: 3,
    color: "#C0C0C0", // Silver
    colorDark: "#A8A8A8",
    shortDescription: "20% de desconto + 500 pontos/mês",
  },
};

/**
 * Helper to get plan display info
 */
export function getPlanConfig(slug: string) {
  return PLAN_CONFIG[slug] || PLAN_CONFIG["gratuito"];
}
