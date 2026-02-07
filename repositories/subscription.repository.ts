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
   * 
   * IMPORTANTE: Se `nextBillingDate` for fornecida (do Mercado Pago),
   * usa essa data. Caso contrário, calcula como 1 mês após o início.
   * O Mercado Pago é a FONTE DA VERDADE para datas de cobrança.
   */
  async createSubscription(data: {
    userId: string;
    planId: string;
    provider?: "MERCADO_PAGO" | "STRIPE" | "MANUAL";
    providerSubId?: string;
    /** Data da próxima cobrança retornada pelo Mercado Pago (next_payment_date) */
    nextBillingDate?: string | Date;
  }) {
    const now = new Date();
    
    // PRIORIDADE: Usar data do Mercado Pago se disponível
    let nextBilling: Date;
    
    if (data.nextBillingDate) {
      // Usa a data real do Mercado Pago (fonte da verdade)
      nextBilling = typeof data.nextBillingDate === 'string' 
        ? new Date(data.nextBillingDate) 
        : data.nextBillingDate;
      console.log("[Subscription] Using MP next_payment_date:", nextBilling.toISOString());
    } else {
      // Fallback: calcula mesma data no próximo mês
      nextBilling = new Date(now);
      const originalDay = now.getDate();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      
      // Ajusta para último dia do mês se necessário
      if (nextBilling.getDate() !== originalDay) {
        nextBilling.setDate(0);
      }
      nextBilling.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      console.log("[Subscription] Calculated fallback nextBilling:", nextBilling.toISOString());
    }

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
   * 
   * IMPORTANTE: O ciclo termina 1 mês após o início,
   * mantendo o mesmo dia (ou último dia do mês se necessário).
   */
  async createFirstCycle(data: {
    subscriptionId: string;
    amount: number;
    paymentId?: string;
  }) {
    const now = new Date();
    const originalDay = now.getDate();
    const cycleEnd = new Date(now);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    
    // Ajusta para último dia do mês se o dia não existe
    if (cycleEnd.getDate() !== originalDay) {
      cycleEnd.setDate(0);
    }

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
   * 
   * IMPORTANTE: A próxima cobrança é calculada como 1 mês após a reativação,
   * mantendo o mesmo dia (ou último dia do mês se necessário).
   */
  async reactivateSubscription(subscriptionId: string) {
    const now = new Date();
    const originalDay = now.getDate();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    
    // Ajusta para último dia do mês se o dia não existe
    if (nextBilling.getDate() !== originalDay) {
      nextBilling.setDate(0);
    }
    
    nextBilling.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);

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
   * 
   * IMPORTANTE: Se `nextBillingDate` for fornecida (do Mercado Pago),
   * usa essa data. Caso contrário, calcula como 1 mês após.
   * O Mercado Pago é a FONTE DA VERDADE para datas de cobrança.
   */
  async createRenewalCycle(data: {
    subscriptionId: string;
    amount: number;
    paymentId?: string;
    /** Data da próxima cobrança retornada pelo Mercado Pago */
    nextBillingDate?: string | Date;
  }) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
      select: { nextBillingAt: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const cycleStart = subscription.nextBillingAt || new Date();
    
    // Calcular cycleEnd
    let cycleEnd: Date;
    
    if (data.nextBillingDate) {
      // Usa a data real do Mercado Pago (fonte da verdade)
      cycleEnd = typeof data.nextBillingDate === 'string' 
        ? new Date(data.nextBillingDate) 
        : data.nextBillingDate;
      console.log("[Subscription] Using MP next_payment_date for cycle:", cycleEnd.toISOString());
    } else {
      // Fallback: calcula mesma data no próximo mês
      const originalDay = cycleStart.getDate();
      cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      
      // Ajusta para último dia do mês se o dia não existe
      if (cycleEnd.getDate() !== originalDay) {
        cycleEnd.setDate(0);
      }
      console.log("[Subscription] Calculated fallback cycleEnd:", cycleEnd.toISOString());
    }

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

    // Update subscription's nextBillingAt
    await prisma.subscription.update({
      where: { id: data.subscriptionId },
      data: {
        nextBillingAt: cycleEnd,
      },
    });

    return cycle;
  },
};
