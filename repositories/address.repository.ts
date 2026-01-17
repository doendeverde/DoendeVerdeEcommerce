/**
 * Address Repository
 * 
 * Database operations for user addresses.
 * Handles CRUD operations for the Address model.
 */

import { prisma } from "@/lib/prisma";
import type { Address } from "@prisma/client";
import type { AddressInput, AddressUpdateInput } from "@/schemas/checkout.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AddressWithoutTimestamps = Omit<Address, "createdAt" | "updatedAt">;

// ─────────────────────────────────────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find all addresses for a user
 */
export async function findUserAddresses(userId: string): Promise<Address[]> {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
}

/**
 * Find user's default address
 */
export async function findDefaultAddress(userId: string): Promise<Address | null> {
  return prisma.address.findFirst({
    where: { userId, isDefault: true },
  });
}

/**
 * Find address by ID (ensuring it belongs to user)
 */
export async function findAddressById(
  addressId: string,
  userId: string
): Promise<Address | null> {
  return prisma.address.findFirst({
    where: { id: addressId, userId },
  });
}

/**
 * Check if user has any address
 */
export async function userHasAddress(userId: string): Promise<boolean> {
  const count = await prisma.address.count({
    where: { userId },
  });
  return count > 0;
}

/**
 * Count user addresses
 */
export async function countUserAddresses(userId: string): Promise<number> {
  return prisma.address.count({
    where: { userId },
  });
}

/**
 * Create a new address for user
 * If isDefault is true, removes default from other addresses
 */
export async function createAddress(
  userId: string,
  data: AddressInput
): Promise<Address> {
  // Normalize CEP (remove hyphen)
  const normalizedData = {
    ...data,
    zipCode: data.zipCode.replace("-", ""),
  };

  // If this is the first address or explicitly default, make it default
  const addressCount = await countUserAddresses(userId);
  const shouldBeDefault = addressCount === 0 || data.isDefault;

  if (shouldBeDefault) {
    // Remove default from other addresses
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: {
      ...normalizedData,
      userId,
      isDefault: shouldBeDefault,
    },
  });
}

/**
 * Update an existing address
 */
export async function updateAddress(
  addressId: string,
  userId: string,
  data: AddressUpdateInput
): Promise<Address | null> {
  // Verify address belongs to user
  const existing = await findAddressById(addressId, userId);
  if (!existing) return null;

  // Normalize CEP if provided
  const normalizedData = { ...data };
  if (data.zipCode) {
    normalizedData.zipCode = data.zipCode.replace("-", "");
  }

  // If setting as default, remove default from other addresses
  if (data.isDefault === true) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data: normalizedData,
  });
}

/**
 * Delete an address
 * Cannot delete if it's the only address
 */
export async function deleteAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify address belongs to user
  const existing = await findAddressById(addressId, userId);
  if (!existing) {
    return { success: false, error: "Endereço não encontrado" };
  }

  // Check if it's the only address
  const count = await countUserAddresses(userId);
  if (count <= 1) {
    return { success: false, error: "Você deve manter pelo menos um endereço" };
  }

  // Delete the address
  await prisma.address.delete({
    where: { id: addressId },
  });

  // If deleted address was default, make the most recent one default
  if (existing.isDefault) {
    const mostRecent = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (mostRecent) {
      await prisma.address.update({
        where: { id: mostRecent.id },
        data: { isDefault: true },
      });
    }
  }

  return { success: true };
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<Address | null> {
  // Verify address belongs to user
  const existing = await findAddressById(addressId, userId);
  if (!existing) return null;

  // Transaction: remove default from all, then set new default
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  return prisma.address.findUnique({
    where: { id: addressId },
  });
}
