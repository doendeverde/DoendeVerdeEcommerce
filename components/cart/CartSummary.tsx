/**
 * CartSummary Component
 *
 * Resumo do carrinho com subtotal e botão de checkout.
 */

'use client';

import { useMemo } from 'react';
import { ShoppingBag, BadgePercent } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { formatCurrency } from '@/lib/utils';

interface CartSummaryProps {
  onCheckout?: () => void;
}

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const cart = useCartStore((state) => state.cart);

  // Memoize derived values
  const subtotal = useMemo(() => cart?.subtotal ?? 0, [cart?.subtotal]);
  const itemCount = useMemo(() => cart?.itemCount ?? 0, [cart?.itemCount]);

  // Subscription discount
  const subscriptionDiscount = useMemo(() => cart?.subscriptionDiscount, [cart?.subscriptionDiscount]);
  const hasDiscount = useMemo(() =>
    subscriptionDiscount?.hasActiveSubscription && subscriptionDiscount?.discountPercent > 0,
    [subscriptionDiscount]
  );
  const discountAmount = useMemo(() => subscriptionDiscount?.discountAmount ?? 0, [subscriptionDiscount?.discountAmount]);
  const finalTotal = useMemo(() =>
    Math.round((subtotal - discountAmount) * 100) / 100,
    [subtotal, discountAmount]
  );

  // FEATURE DISABLED: Points will be implemented in the future
  // const estimatedPoints = Math.floor(subtotal * 10);

  // Check for issues
  const hasIssues = cart?.hasOutOfStockItems || cart?.hasPriceChangedItems;

  return (
    <div className="border-t border-gray-border bg-gray-bg p-4">
      {/* Subscription Discount Banner */}
      {hasDiscount && subscriptionDiscount && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-purple to-purple-600 px-4 py-2 text-white">
          <BadgePercent className="h-4 w-4" />
          <span className="text-sm font-medium">
            Você economiza <strong>{formatCurrency(discountAmount)}</strong> como assinante {subscriptionDiscount.planName}
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span>Itens ({itemCount})</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {/* Subscription Discount */}
        {hasDiscount && subscriptionDiscount && (
          <div className="flex items-center justify-between text-primary-purple">
            <span className="flex items-center gap-1">
              <BadgePercent className="h-4 w-4" />
              {subscriptionDiscount.discountLabel || `Desconto ${subscriptionDiscount.planName}`}
            </span>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-border pt-2 text-base font-semibold text-text-primary">
          <span>Total</span>
          <div className="text-right">
            {hasDiscount && (
              <span className="block text-xs text-text-secondary line-through">
                {formatCurrency(subtotal)}
              </span>
            )}
            <span className={hasDiscount ? 'text-primary-purple' : ''}>
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hasIssues && (
        <div className="mt-3 rounded-lg bg-yellow-bg border border-yellow-border p-3 text-xs text-yellow-text">
          Alguns itens precisam de atenção. Verifique os alertas acima.
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={hasIssues || itemCount === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-green py-3 text-sm font-semibold text-white transition-all hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
      >
        <ShoppingBag className="h-5 w-5" />
        Finalizar Compra
      </button>

      {/* Continue Shopping */}
      <p className="mt-3 text-center text-xs text-text-secondary">
        Frete calculado no checkout
      </p>
    </div>
  );
}
