/**
 * Subscription Checkout Page
 * 
 * Server component that fetches plan data and user info,
 * then renders the checkout flow.
 */

import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscriptionRepository } from "@/repositories/subscription.repository";
import * as addressRepository from "@/repositories/address.repository";
import * as preferencesRepository from "@/repositories/preferences.repository";
import { getPlanColorScheme, type PlanColorScheme } from "@/types/subscription";
import { SubscriptionCheckoutClient } from "./SubscriptionCheckoutClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubscriptionCheckoutPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/subscription/${slug}`)}`);
  }

  // 2. Fetch plan details with benefits from database
  const plan = await subscriptionRepository.findPlanBySlug(slug);
  if (!plan) {
    notFound();
  }

  // Get color scheme from plan or default
  const colorScheme = plan.colorScheme as PlanColorScheme | null;
  const planColors = colorScheme || getPlanColorScheme(null, plan.isFeatured);

  // 3. Check if user already has active subscription
  const hasActiveSubscription = await subscriptionRepository.userHasAnyActiveSubscription(
    session.user.id
  );

  // 4. Fetch user data in parallel
  const [addresses, preferencesSummary, preferences, user] = await Promise.all([
    addressRepository.findUserAddresses(session.user.id),
    preferencesRepository.getPreferencesSummary(session.user.id),
    preferencesRepository.findUserPreferences(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  // 5. Prepare data for client component
  const checkoutData = {
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price: Number(plan.price),
      billingCycle: plan.billingCycle,
      discountPercent: plan.discountPercent,
      benefits: plan.planBenefits.map(pb => ({
        name: pb.benefit.name,
        slug: pb.benefit.slug,
        icon: pb.benefit.icon,
        customValue: pb.customValue,
        enabled: pb.enabled,
      })),
      badge: plan.isFeatured ? "popular" : undefined,
      colorScheme: planColors,
    },
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      whatsapp: user.whatsapp,
    },
    addresses,
    hasAddress: addresses.length > 0,
    defaultAddressId: addresses.find(a => a.isDefault)?.id || addresses[0]?.id || null,
    hasPreferences: preferencesSummary.hasPreferences,
    preferencesComplete: preferencesSummary.isComplete,
    preferencesSummary: preferencesSummary.summary,
    preferences: preferences ? {
      yearsSmoking: preferences.yearsSmoking,
      favoritePaperType: preferences.favoritePaperType,
      favoritePaperSize: preferences.favoritePaperSize,
      paperFilterSize: preferences.paperFilterSize,
      glassFilterSize: preferences.glassFilterSize,
      glassFilterThickness: preferences.glassFilterThickness,
      favoriteColors: preferences.favoriteColors,
      tobaccoUsage: preferences.tobaccoUsage,
      consumptionFrequency: preferences.consumptionFrequency,
      consumptionMoment: preferences.consumptionMoment,
      consumesFlower: preferences.consumesFlower,
      consumesSkunk: preferences.consumesSkunk,
      consumesHash: preferences.consumesHash,
      consumesExtracts: preferences.consumesExtracts,
      consumesOilEdibles: preferences.consumesOilEdibles,
      likesAccessories: preferences.likesAccessories,
      likesCollectibles: preferences.likesCollectibles,
      likesPremiumItems: preferences.likesPremiumItems,
      notes: preferences.notes,
    } : null,
    hasActiveSubscription,
  };

  return (
    <main className="bg-page py-8">
      {/* <div className="container mx-auto px-4 max-w-4xl"> */}
      <SubscriptionCheckoutClient data={checkoutData} />
      {/* </div> */}
    </main>
  );
}
