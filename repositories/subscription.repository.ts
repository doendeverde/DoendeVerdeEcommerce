import { prisma } from "@/lib/prisma";

/**
 * Subscription Repository
 *
 * Queries Prisma para planos de assinatura e assinaturas do usuário.
 * Otimizado para SSR com queries mínimas e eficientes.
 */

export const subscriptionRepository = {
  /**
   * Find all active subscription plans
   * Optimized: Only fetches necessary fields, ordered by price
   */
  async findActivePlans() {
    return prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        billingCycle: true,
        active: true,
      },
    });
  },

  /**
   * Find plan by slug
   */
  async findPlanBySlug(slug: string) {
    return prisma.subscriptionPlan.findUnique({
      where: { slug, active: true },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Find plan by ID
   */
  async findPlanById(id: string) {
    return prisma.subscriptionPlan.findUnique({
      where: { id, active: true },
    });
  },

  /**
   * Find user's active subscription
   * Single query with plan info for SSR
   */
  async findUserActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        nextBillingAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find all user subscriptions (for history)
   */
  async findUserSubscriptions(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        cycles: {
          orderBy: { cycleStart: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
