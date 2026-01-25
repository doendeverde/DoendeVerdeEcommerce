"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserStatusBanner } from "./UserStatusBanner";
import { SubscriptionCTABanner } from "./SubscriptionCTABanner";
import { cn } from "@/lib/utils";

interface PlanColorScheme {
  primary: string;
  text: string;
  primaryDark: string;
  textDark: string;
  badge?: string;
  icon?: string;
}

interface UserSubscriptionData {
  id: string;
  status: string;
  plan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountPercent: number;
    colorScheme?: PlanColorScheme;
  };
}

interface SubscriptionBannerProps {
  className?: string;
}

/**
 * Orchestrator component for subscription banners
 *
 * Logic:
 * - If user is logged in AND has active subscription → UserStatusBanner (with plan info)
 * - If user is NOT logged in OR has no subscription → SubscriptionCTABanner (carousel)
 */
export function SubscriptionBanner({ className }: SubscriptionBannerProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [subscription, setSubscription] = useState<UserSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user subscription when logged in
  useEffect(() => {
    async function fetchSubscription() {
      // Don't fetch if not logged in
      if (sessionStatus === "loading") return;

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [session, sessionStatus]);

  // Loading state - show skeleton
  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className={cn("w-full rounded-xl overflow-hidden", className)}>
        <div className="bg-gradient-to-r from-gray-300 to-gray-200 p-4 sm:p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl" />
            <div className="flex-1">
              <div className="h-5 bg-white/20 rounded w-40 mb-2" />
              <div className="h-4 bg-white/20 rounded w-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in AND has subscription → Show status banner
  if (session?.user && subscription) {
    const colorScheme = subscription.plan.colorScheme;
    return (
      <UserStatusBanner
        className={className}
        planName={subscription.plan.name}
        discountPercent={subscription.plan.discountPercent}
        primaryColor={colorScheme?.primary || "#22C55E"}
        primaryDark={colorScheme?.primaryDark || "#16A34A"}
        textColor={colorScheme?.text || "#FFFFFF"}
      />
    );
  }

  // User is NOT logged in OR has no subscription → Show CTA carousel
  return <SubscriptionCTABanner className={className} />;
}
