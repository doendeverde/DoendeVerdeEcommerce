/**
 * Benefit Service
 *
 * Business logic for subscription benefits management.
 */

import * as benefitRepo from '@/repositories/benefit.repository';
import type { Benefit } from '@prisma/client';
import type {
  BenefitDisplay,
  BenefitListResponse,
  BenefitWithRelations,
  CreateBenefitInput,
  PlanBenefitsResponse,
  PlanWithBenefits,
  UpdateBenefitInput,
} from '@/types/benefit';

// ==========================================
// BENEFIT MANAGEMENT
// ==========================================

/**
 * List all benefits with optional filtering
 */
export async function listBenefits(options?: {
  isActive?: boolean;
  orderBy?: 'name' | 'displayOrder' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}): Promise<BenefitListResponse> {
  const benefits = await benefitRepo.findAllBenefits({
    isActive: options?.isActive,
    orderBy: options?.orderBy,
    orderDir: options?.orderDir,
  });

  return {
    benefits: benefits as Benefit[],
    total: benefits.length,
  };
}

/**
 * Get a single benefit by ID
 */
export async function getBenefitById(
  id: string,
  includeRelations = false
): Promise<Benefit | BenefitWithRelations | null> {
  return benefitRepo.findBenefitById(id, includeRelations);
}

/**
 * Create a new benefit
 */
export async function createBenefit(data: CreateBenefitInput): Promise<Benefit> {
  // Check if slug already exists
  const existing = await benefitRepo.findBenefitBySlug(data.slug);
  if (existing) {
    throw new Error(`Já existe um benefício com o slug "${data.slug}"`);
  }

  return benefitRepo.createBenefit(data);
}

/**
 * Update a benefit
 */
export async function updateBenefit(id: string, data: UpdateBenefitInput): Promise<Benefit> {
  // Check if benefit exists
  const existing = await benefitRepo.findBenefitById(id);
  if (!existing) {
    throw new Error('Benefício não encontrado');
  }

  // Check if new slug conflicts with another benefit
  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await benefitRepo.findBenefitBySlug(data.slug);
    if (slugConflict) {
      throw new Error(`Já existe um benefício com o slug "${data.slug}"`);
    }
  }

  return benefitRepo.updateBenefit(id, data);
}

/**
 * Delete a benefit
 */
export async function deleteBenefit(id: string): Promise<Benefit> {
  const existing = await benefitRepo.findBenefitById(id);
  if (!existing) {
    throw new Error('Benefício não encontrado');
  }

  return benefitRepo.deleteBenefit(id);
}

// ==========================================
// PLAN-BENEFIT MANAGEMENT
// ==========================================

/**
 * Get all benefits for a plan (admin view)
 */
export async function getPlanBenefits(planId: string): Promise<PlanBenefitsResponse> {
  // First, ensure all benefits are synced to the plan
  await benefitRepo.syncAllBenefitsToPlan(planId, false);

  const planBenefits = await benefitRepo.findPlanBenefits(planId);

  // Get plan info
  const { prisma } = await import('@/lib/prisma');
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: { id: true, name: true },
  });

  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  return {
    planId: plan.id,
    planName: plan.name,
    benefits: planBenefits.map((pb) => ({
      id: pb.id,
      benefitId: pb.benefit.id,
      name: pb.benefit.name,
      slug: pb.benefit.slug,
      description: pb.benefit.description,
      icon: pb.benefit.icon,
      enabled: pb.enabled,
      customValue: pb.customValue,
    })),
  };
}

/**
 * Get enabled benefits for a plan (public/display)
 */
export async function getEnabledPlanBenefits(planId: string): Promise<BenefitDisplay[]> {
  const planBenefits = await benefitRepo.findEnabledPlanBenefits(planId);

  return planBenefits.map((pb) => ({
    id: pb.id,
    name: pb.benefit.name,
    slug: pb.benefit.slug,
    description: pb.benefit.description,
    icon: pb.benefit.icon,
    enabled: pb.enabled,
    customValue: pb.customValue,
  }));
}

/**
 * Update benefits for a plan
 */
export async function updatePlanBenefits(
  planId: string,
  benefits: Array<{
    benefitId: string;
    enabled: boolean;
    customValue?: string | null;
  }>
): Promise<PlanBenefitsResponse> {
  // Verify plan exists
  const { prisma } = await import('@/lib/prisma');
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: { id: true, name: true },
  });

  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  // Verify all benefit IDs are valid
  const benefitIds = benefits.map((b) => b.benefitId);
  const existingBenefits = await prisma.benefit.findMany({
    where: { id: { in: benefitIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingBenefits.map((b: { id: string }) => b.id));
  const invalidIds = benefitIds.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error(`Benefícios não encontrados: ${invalidIds.join(', ')}`);
  }

  // Update the plan benefits
  await benefitRepo.updatePlanBenefits(planId, benefits);

  // Return updated data
  return getPlanBenefits(planId);
}

/**
 * Get plan with its enabled benefits (for frontend display)
 */
export async function getPlanWithBenefits(planId: string): Promise<PlanWithBenefits | null> {
  const { prisma } = await import('@/lib/prisma');

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discountPercent: true,
    },
  });

  if (!plan) {
    return null;
  }

  const benefits = await getEnabledPlanBenefits(planId);

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price: Number(plan.price),
    discountPercent: plan.discountPercent,
    benefits,
  };
}

/**
 * Get all plans with their benefits (for plan comparison)
 */
export async function getAllPlansWithBenefits(): Promise<PlanWithBenefits[]> {
  const { prisma } = await import('@/lib/prisma');

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discountPercent: true,
    },
    orderBy: { price: 'asc' },
  });

  const plansWithBenefits = await Promise.all(
    plans.map(async (plan) => {
      const benefits = await getEnabledPlanBenefits(plan.id);
      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: Number(plan.price),
        discountPercent: plan.discountPercent,
        benefits,
      };
    })
  );

  return plansWithBenefits;
}
