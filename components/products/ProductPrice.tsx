/**
 * ProductPrice Component
 * 
 * Client component for displaying product price with subscription discount.
 * Uses the SubscriptionProvider context to calculate and display discount.
 */

"use client";

import { useProductDiscount } from "@/components/providers/SubscriptionProvider";
import { PriceDisplay, SubscriptionDiscountBadge } from "@/components/ui/PriceDisplay";

interface ProductPriceProps {
  basePrice: number;
  /** Pre-calculated values from SSR (if available) */
  ssrFinalPrice?: number;
  ssrDiscountPercent?: number;
  ssrHasDiscount?: boolean;
  ssrDiscountLabel?: string | null;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show badge inline */
  showBadge?: boolean;
}

export function ProductPrice({
  basePrice,
  ssrFinalPrice,
  ssrDiscountPercent,
  ssrHasDiscount,
  ssrDiscountLabel,
  size = "lg",
  showBadge = true,
}: ProductPriceProps) {
  // Use client-side discount calculation
  const subscriptionDiscount = useProductDiscount(basePrice);

  // Merge: prefer SSR data over client-side calculation
  const discountInfo = {
    finalPrice: ssrFinalPrice ?? subscriptionDiscount.finalPrice,
    discountPercent: ssrDiscountPercent ?? subscriptionDiscount.discountPercent,
    hasSubscriptionDiscount: ssrHasDiscount ?? subscriptionDiscount.hasSubscriptionDiscount,
    discountLabel: ssrDiscountLabel ?? subscriptionDiscount.discountLabel,
  };

  const hasDiscount = Boolean(
    discountInfo.hasSubscriptionDiscount &&
    discountInfo.discountPercent &&
    discountInfo.discountPercent > 0
  );

  return (
    <PriceDisplay
      basePrice={basePrice}
      finalPrice={hasDiscount ? discountInfo.finalPrice : undefined}
      discountPercent={hasDiscount ? discountInfo.discountPercent : undefined}
      discountLabel={discountInfo.discountLabel}
      hasDiscount={hasDiscount}
      size={size}
      showBadge={showBadge}
      layout="inline"
    />
  );
}

/**
 * Simple price display for detail pages showing original and discounted price
 */
interface ProductDetailPriceProps {
  basePrice: number;
}

export function ProductDetailPrice({ basePrice }: ProductDetailPriceProps) {
  const { finalPrice, discountPercent, hasSubscriptionDiscount, discountLabel, isLoading } =
    useProductDiscount(basePrice);

  const hasDiscount = hasSubscriptionDiscount && discountPercent > 0;

  if (isLoading) {
    return (
      <div className="flex items-baseline gap-4 animate-pulse">
        <div className="h-9 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!hasDiscount) {
    return (
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-bold text-gray-900">
          R$ {basePrice.toFixed(2).replace(".", ",")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Original price */}
      <span className="text-lg text-gray-400 line-through">
        R$ {basePrice.toFixed(2).replace(".", ",")}
      </span>

      {/* Discounted price and badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl font-bold text-gray-900">
          R$ {finalPrice.toFixed(2).replace(".", ",")}
        </span>
        <SubscriptionDiscountBadge
          discountPercent={discountPercent}
          discountLabel={discountLabel}
          size="lg"
        />
      </div>

      {/* Savings message */}
      <p className="text-sm text-primary-purple font-medium">
        Você economiza R$ {(basePrice - finalPrice).toFixed(2).replace(".", ",")} com sua assinatura!
      </p>
    </div>
  );
}
