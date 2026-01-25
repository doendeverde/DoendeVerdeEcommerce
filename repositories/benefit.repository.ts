/**
 * Benefit Repository
 *
 * Data access layer for benefits and plan-benefit relationships.
 */

import { prisma } from '@/lib/prisma';
import type { Benefit, PlanBenefit, Prisma } from '@prisma/client';
import type {
  BenefitWithRelations,
  PlanBenefitWithBenefit,
  CreateBenefitInput,
  UpdateBenefitInput,
} from '@/types/benefit';

// ==========================================
// BENEFIT CRUD
// ==========================================

/**
 * Find all benefits with optional filtering
 */
export async function findAllBenefits(options?: {
  isActive?: boolean;
  orderBy?: 'name' | 'displayOrder' | 'createdAt';
  orderDir?: 'asc' | 'desc';
  includeRelations?: boolean;
}): Promise<Benefit[] | BenefitWithRelations[]> {
  const where: Prisma.BenefitWhereInput = {};

  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  const orderBy: Prisma.BenefitOrderByWithRelationInput = {
    [options?.orderBy || 'displayOrder']: options?.orderDir || 'asc',
  };

  return prisma.benefit.findMany({
    where,
    orderBy,
    include: options?.includeRelations
      ? {
          planBenefits: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        }
      : undefined,
  });
}

/**
 * Find benefit by ID
 */
export async function findBenefitById(
  id: string,
  includeRelations = false
): Promise<Benefit | BenefitWithRelations | null> {
  return prisma.benefit.findUnique({
    where: { id },
    include: includeRelations
      ? {
          planBenefits: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        }
      : undefined,
  });
}

/**
 * Find benefit by slug
 */
export async function findBenefitBySlug(slug: string): Promise<Benefit | null> {
  return prisma.benefit.findUnique({
    where: { slug },
  });
}

/**
 * Create a new benefit and automatically attach it to all existing plans as disabled
 */
export async function createBenefit(data: CreateBenefitInput): Promise<Benefit> {
  return prisma.$transaction(async (tx) => {
    // Create the benefit
    const benefit = await tx.benefit.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        icon: data.icon ?? null,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });

    // Get all existing plans
    const allPlans = await tx.subscriptionPlan.findMany({
      select: { id: true },
    });

    // Attach benefit to all plans as disabled (enabled: false)
    if (allPlans.length > 0) {
      await tx.planBenefit.createMany({
        data: allPlans.map((plan) => ({
          planId: plan.id,
          benefitId: benefit.id,
          enabled: false,
        })),
        skipDuplicates: true,
      });
    }

    return benefit;
  });
}

/**
 * Update a benefit
 */
export async function updateBenefit(id: string, data: UpdateBenefitInput): Promise<Benefit> {
  return prisma.benefit.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
    },
  });
}

/**
 * Delete a benefit
 */
export async function deleteBenefit(id: string): Promise<Benefit> {
  return prisma.benefit.delete({
    where: { id },
  });
}

/**
 * Count benefits
 */
export async function countBenefits(isActive?: boolean): Promise<number> {
  return prisma.benefit.count({
    where: isActive !== undefined ? { isActive } : undefined,
  });
}

// ==========================================
// PLAN-BENEFIT RELATIONSHIPS
// ==========================================

/**
 * Find all benefits for a subscription plan (including disabled)
 */
export async function findPlanBenefits(planId: string): Promise<PlanBenefitWithBenefit[]> {
  return prisma.planBenefit.findMany({
    where: { planId },
    include: {
      benefit: true,
    },
    orderBy: {
      benefit: {
        displayOrder: 'asc',
      },
    },
  });
}

/**
 * Find ALL benefits for a plan, ensuring any missing benefits are included as disabled
 * This is the main function for public display - shows all benefits with their status
 */
export async function findAllBenefitsForPlan(planId: string): Promise<PlanBenefitWithBenefit[]> {
  // First, sync to ensure all benefits are attached
  await syncAllBenefitsToPlan(planId, false);
  
  // Then fetch all (including disabled) ordered by displayOrder
  return prisma.planBenefit.findMany({
    where: { 
      planId,
      benefit: {
        isActive: true, // Only show active benefits
      },
    },
    include: {
      benefit: true,
    },
    orderBy: {
      benefit: {
        displayOrder: 'asc',
      },
    },
  });
}

/**
 * Find enabled benefits for a subscription plan (for display)
 */
export async function findEnabledPlanBenefits(planId: string): Promise<PlanBenefitWithBenefit[]> {
  return prisma.planBenefit.findMany({
    where: {
      planId,
      enabled: true,
      benefit: {
        isActive: true,
      },
    },
    include: {
      benefit: true,
    },
    orderBy: {
      benefit: {
        displayOrder: 'asc',
      },
    },
  });
}

/**
 * Update all benefits for a plan (replace strategy)
 */
export async function updatePlanBenefits(
  planId: string,
  benefits: Array<{
    benefitId: string;
    enabled: boolean;
    customValue?: string | null;
  }>
): Promise<PlanBenefit[]> {
  // Use transaction to ensure atomic update
  return prisma.$transaction(async (tx) => {
    // Delete existing plan-benefit relationships
    await tx.planBenefit.deleteMany({
      where: { planId },
    });

    // Create new relationships
    const created = await Promise.all(
      benefits.map((b) =>
        tx.planBenefit.create({
          data: {
            planId,
            benefitId: b.benefitId,
            enabled: b.enabled,
            customValue: b.customValue ?? null,
          },
        })
      )
    );

    return created;
  });
}

/**
 * Toggle a single benefit for a plan
 */
export async function togglePlanBenefit(
  planId: string,
  benefitId: string,
  enabled: boolean,
  customValue?: string | null
): Promise<PlanBenefit> {
  return prisma.planBenefit.upsert({
    where: {
      planId_benefitId: {
        planId,
        benefitId,
      },
    },
    create: {
      planId,
      benefitId,
      enabled,
      customValue: customValue ?? null,
    },
    update: {
      enabled,
      customValue: customValue ?? null,
    },
  });
}

/**
 * Sync all benefits to a plan (ensures all benefits have an entry)
 */
export async function syncAllBenefitsToPlan(
  planId: string,
  defaultEnabled = false
): Promise<number> {
  const allBenefits = await prisma.benefit.findMany({
    select: { id: true },
  });

  const existingPlanBenefits = await prisma.planBenefit.findMany({
    where: { planId },
    select: { benefitId: true },
  });

  const existingBenefitIds = new Set(existingPlanBenefits.map((pb: { benefitId: string }) => pb.benefitId));
  const missingBenefits = allBenefits.filter((b: { id: string }) => !existingBenefitIds.has(b.id));

  if (missingBenefits.length === 0) {
    return 0;
  }

  // Use skipDuplicates to handle race conditions gracefully
  // (two concurrent requests might try to sync the same benefits)
  const result = await prisma.planBenefit.createMany({
    data: missingBenefits.map((b: { id: string }) => ({
      planId,
      benefitId: b.id,
      enabled: defaultEnabled,
    })),
    skipDuplicates: true,
  });

  return result.count;
}
