/**
 * Preferences Repository
 * 
 * Database operations for user preferences.
 * Handles CRUD operations for the UserPreferences model.
 */

import { prisma } from "@/lib/prisma";
import type { UserPreferences } from "@prisma/client";
import type { PreferencesInput, PreferencesUpdateInput } from "@/schemas/checkout.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find user preferences
 */
export async function findUserPreferences(userId: string): Promise<UserPreferences | null> {
  return prisma.userPreferences.findUnique({
    where: { userId },
  });
}

/**
 * Check if user has preferences set
 */
export async function userHasPreferences(userId: string): Promise<boolean> {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { id: true },
  });
  return preferences !== null;
}

/**
 * Check if preferences are "complete" (has at least some key fields filled)
 * This helps determine if user should "edit" vs "create" preferences
 */
export async function hasCompletePreferences(userId: string): Promise<boolean> {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: {
      consumptionFrequency: true,
      favoritePaperType: true,
      tobaccoUsage: true,
    },
  });

  if (!preferences) return false;

  // Consider complete if at least one key preference is set
  return !!(
    preferences.consumptionFrequency ||
    preferences.favoritePaperType ||
    preferences.tobaccoUsage
  );
}

/**
 * Create preferences for user
 */
export async function createPreferences(
  userId: string,
  data: PreferencesInput
): Promise<UserPreferences> {
  // Filter out undefined values and ensure proper types
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return prisma.userPreferences.create({
    data: {
      ...cleanData,
      userId,
    } as any,
  });
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  userId: string,
  data: PreferencesUpdateInput
): Promise<UserPreferences | null> {
  // Check if preferences exist
  const existing = await findUserPreferences(userId);
  if (!existing) return null;

  // Filter out undefined values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return prisma.userPreferences.update({
    where: { userId },
    data: cleanData as any,
  });
}

/**
 * Create or update preferences (upsert)
 */
export async function upsertPreferences(
  userId: string,
  data: PreferencesInput | PreferencesUpdateInput
): Promise<UserPreferences> {
  // Filter out undefined values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return prisma.userPreferences.upsert({
    where: { userId },
    create: {
      ...cleanData,
      userId,
    } as any,
    update: cleanData as any,
  });
}

/**
 * Delete user preferences
 */
export async function deletePreferences(userId: string): Promise<boolean> {
  const existing = await findUserPreferences(userId);
  if (!existing) return false;

  await prisma.userPreferences.delete({
    where: { userId },
  });

  return true;
}

/**
 * Get preferences summary for display
 */
export async function getPreferencesSummary(userId: string): Promise<{
  hasPreferences: boolean;
  isComplete: boolean;
  summary: string[];
}> {
  const preferences = await findUserPreferences(userId);

  if (!preferences) {
    return {
      hasPreferences: false,
      isComplete: false,
      summary: [],
    };
  }

  const summary: string[] = [];

  // Build summary strings
  if (preferences.consumptionFrequency) {
    const freqMap: Record<string, string> = {
      OCCASIONAL: "Consumo ocasional",
      WEEKLY: "Consumo semanal",
      DAILY: "Consumo diário",
      HEAVY: "Consumo frequente",
    };
    summary.push(freqMap[preferences.consumptionFrequency] || preferences.consumptionFrequency);
  }

  if (preferences.favoritePaperType) {
    const paperMap: Record<string, string> = {
      WHITE: "Seda branca",
      BROWN: "Seda marrom",
      CELLULOSE: "Celulose",
      MIXED: "Tipos variados",
    };
    summary.push(paperMap[preferences.favoritePaperType] || preferences.favoritePaperType);
  }

  if (preferences.favoriteColors && preferences.favoriteColors.length > 0) {
    summary.push(`Cores: ${preferences.favoriteColors.join(", ")}`);
  }

  const consumption: string[] = [];
  if (preferences.consumesFlower) consumption.push("Flor");
  if (preferences.consumesSkunk) consumption.push("Skunk");
  if (preferences.consumesHash) consumption.push("Hash");
  if (preferences.consumesExtracts) consumption.push("Extratos");
  if (consumption.length > 0) {
    summary.push(`Consome: ${consumption.join(", ")}`);
  }

  return {
    hasPreferences: true,
    isComplete: summary.length >= 2,
    summary,
  };
}
