import { prisma } from "@/lib/prisma";

/**
 * Subscription Repository
 *
 * Queries Prisma para planos de assinatura e assinaturas do usuário.
 * Otimizado para SSR com queries mínimas e eficientes.
 */

export const subscriptionRepository = {
  /**
   * Find all active subscription plans with ALL benefits (enabled and disabled)
   * Includes all display fields from database including colorScheme
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
        shortDescription: true,
        price: true,
        discountPercent: true,
        billingCycle: true,
        colorScheme: true,
        active: true,
        isFeatured: true,
        planBenefits: {
          where: { benefit: { isActive: true } },
          orderBy: { benefit: { displayOrder: "asc" } },
          select: {
            enabled: true,
            customValue: true,
            benefit: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                displayOrder: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Find plan by slug with all details (including all benefits)
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
        planBenefits: {
          where: { benefit: { isActive: true } },
          orderBy: { benefit: { displayOrder: "asc" } },
          select: {
            enabled: true,
            customValue: true,
            benefit: {
              select: {
                name: true,
                slug: true,
                icon: true,
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
   * Find user's active subscription with full plan details
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
            discountPercent: true,
            colorScheme: true,
            planBenefits: {
              where: { enabled: true, benefit: { isActive: true } },
              orderBy: { benefit: { displayOrder: "asc" } },
              select: {
                enabled: true,
                customValue: true,
                benefit: {
                  select: {
                    name: true,
                    slug: true,
                    icon: true,
                  },
                },
              },
            },
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

  /**
   * Check if user has active subscription for a specific plan
   */
  async userHasActivePlanSubscription(userId: string, planId: string) {
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        planId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    return existing !== null;
  },

  /**
   * Check if user has any active subscription
   */
  async userHasAnyActiveSubscription(userId: string) {
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    return existing !== null;
  },

  /**
   * Create a new subscription
   */
  async createSubscription(data: {
    userId: string;
    planId: string;
    provider?: "MERCADO_PAGO" | "STRIPE" | "MANUAL";
    providerSubId?: string;
  }) {
    const now = new Date();
    
    // Calculate next billing date (first of next month or 30 days)
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    nextBilling.setDate(1);
    nextBilling.setHours(0, 0, 0, 0);

    return prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        status: "ACTIVE",
        startedAt: now,
        nextBillingAt: nextBilling,
        provider: data.provider,
        providerSubId: data.providerSubId,
      },
      include: {
        plan: true,
      },
    });
  },

  /**
   * Create first subscription cycle
   */
  async createFirstCycle(data: {
    subscriptionId: string;
    amount: number;
    paymentId?: string;
  }) {
    const now = new Date();
    const cycleEnd = new Date(now);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);

    return prisma.subscriptionCycle.create({
      data: {
        subscriptionId: data.subscriptionId,
        status: data.paymentId ? "PAID" : "PENDING",
        cycleStart: now,
        cycleEnd,
        amount: data.amount,
        paymentId: data.paymentId,
      },
    });
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });
  },

  /**
   * Reactivate subscription (from CANCELED to ACTIVE)
   */
  async reactivateSubscription(subscriptionId: string) {
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    nextBilling.setDate(1);
    nextBilling.setHours(0, 0, 0, 0);

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        canceledAt: null,
        nextBillingAt: nextBilling,
      },
    });
  },

  /**
   * Find subscription by provider subscription ID (for webhook renewal processing)
   * Used to identify if a payment is a renewal or new subscription
   */
  async findByProviderSubId(providerSubId: string) {
    return prisma.subscription.findFirst({
      where: {
        providerSubId,
        status: "ACTIVE",
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Create a renewal cycle for an existing subscription
   * Called when Mercado Pago processes a recurring payment
   */
  async createRenewalCycle(data: {
    subscriptionId: string;
    amount: number;
    paymentId?: string;
  }) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
      select: { nextBillingAt: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const cycleStart = subscription.nextBillingAt || new Date();
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);

    // Create new cycle
    const cycle = await prisma.subscriptionCycle.create({
      data: {
        subscriptionId: data.subscriptionId,
        status: data.paymentId ? "PAID" : "PENDING",
        cycleStart,
        cycleEnd,
        amount: data.amount,
        paymentId: data.paymentId,
      },
    });

    // Update subscription's nextBillingAt to first of next month
    const newNextBilling = new Date(cycleEnd);
    newNextBilling.setDate(1);
    newNextBilling.setHours(0, 0, 0, 0);

    await prisma.subscription.update({
      where: { id: data.subscriptionId },
      data: {
        nextBillingAt: newNextBilling,
      },
    });

    return cycle;
  },
};
