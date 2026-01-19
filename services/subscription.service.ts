/**
 * Subscription Service Layer
 *
 * Business logic for subscription plans and user subscriptions.
 * Optimizado para SSR - dados sempre frescos do banco.
 */

import { subscriptionRepository } from "@/repositories/subscription.repository";
import {
  type SubscriptionPlanItem,
  type UserSubscriptionInfo,
  getPlanConfig,
} from "@/types/subscription";

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
    const config = getPlanConfig(plan.slug);
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price: Number(plan.price),
      billingCycle: plan.billingCycle,
      active: plan.active,
      discountPercent: config.discountPercent,
      monthlyPoints: config.monthlyPoints,
      benefits: config.benefits,
      badge: config.badge,
      order: config.order,
      color: config.color,
      colorDark: config.colorDark,
      shortDescription: config.shortDescription,
    };
  });

  // Add virtual "Free" plan if not in database
  const hasFree = plans.some((p) => p.slug === "gratuito");
  if (!hasFree) {
    const freeConfig = getPlanConfig("gratuito");
    plans.unshift({
      id: "free",
      name: "Gratuito",
      slug: "gratuito",
      description: "Acesso básico à plataforma",
      price: 0,
      billingCycle: "MONTHLY",
      active: true,
      discountPercent: freeConfig.discountPercent,
      monthlyPoints: freeConfig.monthlyPoints,
      benefits: freeConfig.benefits,
      badge: freeConfig.badge,
      order: freeConfig.order,
      color: freeConfig.color,
      colorDark: freeConfig.colorDark,
      shortDescription: freeConfig.shortDescription,
    });
  }

  // Sort by order (ensures consistent display)
  return plans.sort((a, b) => a.order - b.order);
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
 * Check if user has a specific plan
 */
async function userHasPlan(userId: string, planSlug: string): Promise<boolean> {
  const currentSlug = await getUserPlanSlug(userId);
  return currentSlug === planSlug;
}

/**
 * Get plan display config (colors, discount, etc.)
 * Used by API to return display data
 */
function getPlanDisplayConfig(slug: string) {
  return getPlanConfig(slug);
}

/**
 * Get all plans with color information for display
 * Used by SubscriptionCTABanner carousel
 */
async function getPlansWithColors(): Promise<SubscriptionPlanItem[]> {
  const dbPlans = await subscriptionRepository.findActivePlans();

  // Transform database plans to display format with colors
  const plans: SubscriptionPlanItem[] = dbPlans.map((plan) => {
    const config = getPlanConfig(plan.slug);
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price: Number(plan.price),
      billingCycle: plan.billingCycle,
      active: plan.active,
      discountPercent: config.discountPercent,
      monthlyPoints: config.monthlyPoints,
      benefits: config.benefits,
      badge: config.badge,
      order: config.order,
      color: config.color,
      colorDark: config.colorDark,
      shortDescription: config.shortDescription,
    };
  });

  // Add virtual "Free" plan if not in database
  const hasFree = plans.some((p) => p.slug === "gratuito");
  if (!hasFree) {
    const freeConfig = getPlanConfig("gratuito");
    plans.unshift({
      id: "free",
      name: "Gratuito",
      slug: "gratuito",
      description: "Acesso básico à plataforma",
      price: 0,
      billingCycle: "MONTHLY",
      active: true,
      discountPercent: freeConfig.discountPercent,
      monthlyPoints: freeConfig.monthlyPoints,
      benefits: freeConfig.benefits,
      badge: freeConfig.badge,
      order: freeConfig.order,
      color: freeConfig.color,
      colorDark: freeConfig.colorDark,
      shortDescription: freeConfig.shortDescription,
    });
  }

  // Sort by order and filter only paid plans (skip free for CTA)
  return plans
    .filter((p) => p.price > 0)
    .sort((a, b) => a.order - b.order);
}

export const subscriptionService = {
  getPlans,
  getUserSubscription,
  getUserPlanSlug,
  userHasPlan,
  getPlanDisplayConfig,
  getPlansWithColors,
};