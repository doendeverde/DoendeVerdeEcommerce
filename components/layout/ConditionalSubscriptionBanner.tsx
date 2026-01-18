/**
 * Conditional Subscription Banner
 * 
 * Wrapper that only renders SubscriptionBanner when NOT on checkout pages.
 * This keeps the main layout as a Server Component while handling
 * client-side path detection.
 */

"use client";

import { usePathname } from "next/navigation";
import { SubscriptionBanner } from "@/components/layout";

export function ConditionalSubscriptionBanner() {
  const pathname = usePathname();

  // Don't show banner on checkout pages
  const isCheckoutPage = pathname?.startsWith("/checkout/subscription");

  if (isCheckoutPage) {
    return null;
  }

  return <SubscriptionBanner />;
}
