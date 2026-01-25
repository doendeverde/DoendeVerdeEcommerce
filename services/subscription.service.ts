/**
 * Subscription Service Layer
 *
 * Business logic for subscription plans and user subscriptions.
 * Optimizado para SSR - dados sempre frescos do banco.
 * Todos os dados vêm do banco de dados, não há mock/hardcoded.
 */

import { subscriptionRepository } from "@/repositories/subscription.repository";
import {
  type SubscriptionPlanItem,
  type UserSubscriptionInfo,
  type BenefitItem,
  type PlanColorScheme,
  DEFAULT_COLOR_SCHEMES,
  getPlanColorScheme,
  FREE_PLAN,
} from "@/types/subscription";

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transform database plan benefits to BenefitItem array
 * Includes enabled status for showing which benefits are included
 */
function transformBenefits(planBenefits: Array<{
  enabled: boolean;
  customValue: string | null;
  benefit: {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    displayOrder?: number;
  };
}>): BenefitItem[] {
  return planBenefits.map((pb) => ({
    id: pb.benefit.id,
    name: pb.benefit.name,
    slug: pb.benefit.slug,
    description: pb.benefit.description,
    icon: pb.benefit.icon,
    customValue: pb.customValue,
    enabled: pb.enabled,
  }));
}

/**
 * Determine badge type based on isFeatured flag
 */
function determineBadge(isFeatured: boolean): "popular" | "premium" | undefined {
  // For now, featured plans get "popular" badge
  // This can be expanded to support different badge types
  return isFeatured ? "popular" : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all subscription plans for display (SSR)
 * Always fetches fresh data from database
 * Includes the virtual "Free" plan for comparison
 */
async function getPlans(): Promise<SubscriptionPlanItem[]> {
  const dbPlans = await subscriptionRepository.findActivePlans();

  // Transform database plans to display format
  const plans: SubscriptionPlanItem[] = dbPlans.map((plan) => {
    const colorScheme = plan.colorScheme as PlanColorScheme | null;
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      shortDescription: plan.shortDescription || plan.description || "",
      price: Number(plan.price),
      billingCycle: plan.billingCycle,
      active: plan.active,
      isFeatured: plan.isFeatured,
      discountPercent: plan.discountPercent,
      colorScheme: colorScheme || getPlanColorScheme(null, plan.isFeatured),
      benefits: transformBenefits(plan.planBenefits),
      badge: determineBadge(plan.isFeatured),
    };
  });

  // Add virtual "Free" plan if not in database
  const hasFree = plans.some((p) => p.slug === "gratuito");
  if (!hasFree) {
    plans.unshift({ 
      ...FREE_PLAN,
      colorScheme: DEFAULT_COLOR_SCHEMES.free,
    });
  }

  // Sort by price (free first, then ascending)
  return plans.sort((a, b) => a.price - b.price);
}

/**
 * Get user's current active subscription (SSR)
 * Returns null if no active subscription (= free plan)
 */
async function getUserSubscription(
  userId: string
): Promise<UserSubscriptionInfo | null> {
  const subscription =
    await subscriptionRepository.findUserActiveSubscription(userId);

  if (!subscription) {
    return null;
  }

  const colorScheme = subscription.plan.colorScheme as PlanColorScheme | null;

  return {
    id: subscription.id,
    status: subscription.status,
    startedAt: subscription.startedAt,
    nextBillingAt: subscription.nextBillingAt,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      slug: subscription.plan.slug,
      price: Number(subscription.plan.price),
      discountPercent: subscription.plan.discountPercent,
      colorScheme: colorScheme || getPlanColorScheme(null, false),
      benefits: transformBenefits(subscription.plan.planBenefits),
    },
  };
}

/**
 * Get user's current plan slug
 * Returns "gratuito" if no active subscription
 */
async function getUserPlanSlug(userId: string): Promise<string> {
  const subscription =
    await subscriptionRepository.findUserActiveSubscription(userId);

  return subscription?.plan.slug || "gratuito";
}

/**
 * Get user's discount percentage from active subscription
 * Returns 0 if no active subscription
 */
async function getUserDiscountPercent(userId: string): Promise<number> {
  const subscription =
    await subscriptionRepository.findUserActiveSubscription(userId);

  return subscription?.plan.discountPercent || 0;
}

/**
 * Check if user has a specific plan
 */
async function userHasPlan(userId: string, planSlug: string): Promise<boolean> {
  const currentSlug = await getUserPlanSlug(userId);
  return currentSlug === planSlug;
}

/**
 * Get all paid plans for display (CTA banners, etc)
 * Excludes free plan
 */
async function getPaidPlans(): Promise<SubscriptionPlanItem[]> {
  const plans = await getPlans();
  return plans.filter((p) => p.price > 0);
}

/**
 * Get subscription discount info for checkout
 * Returns discount percentage and label based on user's active subscription
 */
interface SubscriptionDiscountInfo {
  hasActiveSubscription: boolean;
  discountPercent: number;
  discountLabel: string | null;
  planSlug: string | null;
  planName: string | null;
}

async function getUserSubscriptionDiscount(userId: string): Promise<SubscriptionDiscountInfo> {
  const subscription = await subscriptionRepository.findUserActiveSubscription(userId);
  
  if (!subscription) {
    return {
      hasActiveSubscription: false,
      discountPercent: 0,
      discountLabel: null,
      planSlug: null,
      planName: null,
    };
  }
  
  // Use discount from database
  const discountPercent = subscription.plan.discountPercent;
  
  return {
    hasActiveSubscription: true,
    discountPercent,
    discountLabel: discountPercent > 0 
      ? `Desconto ${subscription.plan.name}` 
      : null,
    planSlug: subscription.plan.slug,
    planName: subscription.plan.name,
  };
}

export const subscriptionService = {
  getPlans,
  getPaidPlans,
  getUserSubscription,
  getUserSubscriptionDiscount,
  getUserPlanSlug,
  getUserDiscountPercent,
  userHasPlan,
};