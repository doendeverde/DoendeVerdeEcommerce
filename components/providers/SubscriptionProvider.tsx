/**
 * Subscription Context Provider
 * 
 * Provides subscription information throughout the app.
 * Used to apply subscription discounts to products and show discount badges.
 * 
 * BUSINESS RULE:
 * - If user has active subscription, show discounted prices on all products
 * - Discount percentage comes from the user's active plan (from database)
 * - Free plan (gratuito) has 0% discount
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  planName: string | null;
  planSlug: string | null;
  discountPercent: number;
  discountLabel: string | null;
  isLoading: boolean;
}

interface SubscriptionContextValue extends SubscriptionInfo {
  /** Calculate discounted price for a product */
  calculateDiscountedPrice: (basePrice: number) => number;
  /** Check if a discount applies */
  hasDiscount: () => boolean;
}

const defaultValue: SubscriptionContextValue = {
  hasActiveSubscription: false,
  planName: null,
  planSlug: null,
  discountPercent: 0,
  discountLabel: null,
  isLoading: true,
  calculateDiscountedPrice: (price) => price,
  hasDiscount: () => false,
};

const SubscriptionContext = createContext<SubscriptionContextValue>(defaultValue);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
  /** Optional initial subscription data for SSR */
  initialData?: {
    hasActiveSubscription: boolean;
    planSlug: string | null;
    planName: string | null;
  } | null;
}

export function SubscriptionProvider({ children, initialData }: SubscriptionProviderProps) {
  const { data: session, status } = useSession();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(() => {
    // Use initial data if provided (for SSR)
    if (initialData?.hasActiveSubscription && initialData.planSlug) {
      return {
        hasActiveSubscription: true,
        planName: initialData.planName,
        planSlug: initialData.planSlug,
        // Will be fetched from API on client
        discountPercent: 0,
        discountLabel: initialData.planName ? `Desconto ${initialData.planName}` : null,
        isLoading: true,
      };
    }
    return {
      hasActiveSubscription: false,
      planName: null,
      planSlug: null,
      discountPercent: 0,
      discountLabel: null,
      isLoading: true,
    };
  });

  useEffect(() => {
    async function fetchSubscription() {
      if (status === "loading") return;

      if (!session?.user) {
        setSubscriptionInfo({
          hasActiveSubscription: false,
          planName: null,
          planSlug: null,
          discountPercent: 0,
          discountLabel: null,
          isLoading: false,
        });
        return;
      }

      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();

          if (data.subscription?.status === "ACTIVE" && data.subscription?.plan) {
            // Use discountPercent from API (comes from database)
            const discountPercent = data.subscription.plan.discountPercent || 0;
            setSubscriptionInfo({
              hasActiveSubscription: true,
              planName: data.subscription.plan.name,
              planSlug: data.subscription.plan.slug,
              discountPercent,
              discountLabel: discountPercent > 0 ? `Desconto ${data.subscription.plan.name}` : null,
              isLoading: false,
            });
          } else {
            setSubscriptionInfo({
              hasActiveSubscription: false,
              planName: null,
              planSlug: null,
              discountPercent: 0,
              discountLabel: null,
              isLoading: false,
            });
          }
        } else {
          setSubscriptionInfo(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
        setSubscriptionInfo(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchSubscription();
  }, [session, status]);

  const calculateDiscountedPrice = (basePrice: number): number => {
    if (!subscriptionInfo.hasActiveSubscription || subscriptionInfo.discountPercent === 0) {
      return basePrice;
    }
    const discount = basePrice * (subscriptionInfo.discountPercent / 100);
    return Math.round((basePrice - discount) * 100) / 100;
  };

  const hasDiscount = (): boolean => {
    return subscriptionInfo.hasActiveSubscription && subscriptionInfo.discountPercent > 0;
  };

  const value: SubscriptionContextValue = {
    ...subscriptionInfo,
    calculateDiscountedPrice,
    hasDiscount,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to get subscription discount info for a product
 */
export function useProductDiscount(basePrice: number) {
  const { calculateDiscountedPrice, discountPercent, discountLabel, hasDiscount, isLoading } = useSubscription();

  return {
    basePrice,
    finalPrice: calculateDiscountedPrice(basePrice),
    discountPercent: hasDiscount() ? discountPercent : 0,
    discountLabel: hasDiscount() ? discountLabel : null,
    hasSubscriptionDiscount: hasDiscount(),
    isLoading,
  };
}
