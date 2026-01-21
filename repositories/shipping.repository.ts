/**
 * Shipping Repository
 *
 * Data access layer for ShippingProfile operations.
 * Handles CRUD and queries for shipping profiles.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  ShippingProfile,
  ShippingProfileCreateInput,
  ShippingProfileUpdateInput,
  ShippingProfileWithRelations,
} from "@/types/shipping";

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

export async function createShippingProfile(
  data: ShippingProfileCreateInput
): Promise<ShippingProfile> {
  const profile = await prisma.shippingProfile.create({
    data: {
      name: data.name,
      weightKg: data.weightKg,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      lengthCm: data.lengthCm,
      isActive: data.isActive ?? true,
    },
  });

  return {
    ...profile,
    weightKg: Number(profile.weightKg),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

export async function getShippingProfileById(
  id: string
): Promise<ShippingProfile | null> {
  const profile = await prisma.shippingProfile.findUnique({
    where: { id },
  });

  if (!profile) return null;

  return {
    ...profile,
    weightKg: Number(profile.weightKg),
  };
}

export async function getShippingProfileWithRelations(
  id: string
): Promise<ShippingProfileWithRelations | null> {
  const profile = await prisma.shippingProfile.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true },
        take: 10,
      },
      subscriptionPlans: {
        select: { id: true, name: true },
        take: 10,
      },
      _count: {
        select: {
          products: true,
          subscriptionPlans: true,
        },
      },
    },
  });

  if (!profile) return null;

  return {
    ...profile,
    weightKg: Number(profile.weightKg),
  };
}

export async function getAllShippingProfiles(options?: {
  activeOnly?: boolean;
  includeCount?: boolean;
}): Promise<ShippingProfileWithRelations[]> {
  const where: Prisma.ShippingProfileWhereInput = {};

  if (options?.activeOnly) {
    where.isActive = true;
  }

  const profiles = await prisma.shippingProfile.findMany({
    where,
    include: options?.includeCount
      ? {
          _count: {
            select: {
              products: true,
              subscriptionPlans: true,
            },
          },
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  return profiles.map((profile) => ({
    ...profile,
    weightKg: Number(profile.weightKg),
  }));
}

export async function getActiveShippingProfiles(): Promise<ShippingProfile[]> {
  const profiles = await prisma.shippingProfile.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return profiles.map((profile) => ({
    ...profile,
    weightKg: Number(profile.weightKg),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────────────────────────────────────

export async function updateShippingProfile(
  id: string,
  data: ShippingProfileUpdateInput
): Promise<ShippingProfile> {
  const profile = await prisma.shippingProfile.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
      ...(data.widthCm !== undefined && { widthCm: data.widthCm }),
      ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
      ...(data.lengthCm !== undefined && { lengthCm: data.lengthCm }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return {
    ...profile,
    weightKg: Number(profile.weightKg),
  };
}

export async function toggleShippingProfileActive(
  id: string
): Promise<ShippingProfile> {
  const current = await prisma.shippingProfile.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!current) {
    throw new Error("Perfil de frete não encontrado");
  }

  const profile = await prisma.shippingProfile.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  return {
    ...profile,
    weightKg: Number(profile.weightKg),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteShippingProfile(id: string): Promise<void> {
  // Check if profile is in use
  const usage = await prisma.shippingProfile.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
          subscriptionPlans: true,
        },
      },
    },
  });

  if (!usage) {
    throw new Error("Perfil de frete não encontrado");
  }

  const totalUsage = usage._count.products + usage._count.subscriptionPlans;
  if (totalUsage > 0) {
    throw new Error(
      `Não é possível excluir o perfil pois ele está vinculado a ${usage._count.products} produto(s) e ${usage._count.subscriptionPlans} plano(s)`
    );
  }

  await prisma.shippingProfile.delete({
    where: { id },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers - Get shipping profile from products/plans
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get combined shipping profile from cart products.
 * Uses the largest dimensions and sum of weights.
 */
export async function getShippingProfileFromProducts(
  productIds: string[]
): Promise<ShippingProfile | null> {
  if (productIds.length === 0) return null;

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      shippingProfileId: { not: null },
    },
    include: {
      shippingProfile: true,
    },
  });

  if (products.length === 0) return null;

  const profiles = products
    .map((p) => p.shippingProfile)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (profiles.length === 0) return null;

  // Combine: sum weights, use max dimensions
  const combined: ShippingProfile = {
    id: "combined",
    name: "Perfil combinado",
    weightKg: profiles.reduce((sum, p) => sum + Number(p.weightKg), 0),
    widthCm: Math.max(...profiles.map((p) => p.widthCm)),
    heightCm: profiles.reduce((sum, p) => sum + p.heightCm, 0), // Stack height
    lengthCm: Math.max(...profiles.map((p) => p.lengthCm)),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return combined;
}

/**
 * Get shipping profile from subscription plan.
 */
export async function getShippingProfileFromPlan(
  planId: string
): Promise<ShippingProfile | null> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    include: {
      shippingProfile: true,
    },
  });

  if (!plan?.shippingProfile) return null;

  return {
    ...plan.shippingProfile,
    weightKg: Number(plan.shippingProfile.weightKg),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export all functions
// ─────────────────────────────────────────────────────────────────────────────

export const shippingRepository = {
  create: createShippingProfile,
  getById: getShippingProfileById,
  getWithRelations: getShippingProfileWithRelations,
  getAll: getAllShippingProfiles,
  getActive: getActiveShippingProfiles,
  update: updateShippingProfile,
  toggleActive: toggleShippingProfileActive,
  delete: deleteShippingProfile,
  getFromProducts: getShippingProfileFromProducts,
  getFromPlan: getShippingProfileFromPlan,
};
