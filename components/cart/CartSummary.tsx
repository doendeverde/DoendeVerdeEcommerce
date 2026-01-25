/**
 * CartSummary Component
 *
 * Resumo do carrinho com subtotal e botão de checkout.
 */

'use client';

import { useMemo } from 'react';
import { Package, ShoppingBag, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

interface CartSummaryProps {
  onCheckout?: () => void;
}

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const cart = useCartStore((state) => state.cart);

  // Memoize derived values
  const subtotal = useMemo(() => cart?.subtotal ?? 0, [cart?.subtotal]);
  const itemCount = useMemo(() => cart?.itemCount ?? 0, [cart?.itemCount]);

  // FEATURE DISABLED: Points will be implemented in the future
  // const estimatedPoints = Math.floor(subtotal * 10);

  // Check for issues
  const hasIssues = cart?.hasOutOfStockItems || cart?.hasPriceChangedItems;

  return (
    <div className="border-t border-gray-border bg-gray-bg p-4">
      {/* FEATURE DISABLED: Points will be implemented in the future */}
      {/* <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-purple to-purple-600 px-4 py-2 text-white">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">
          Ganhe <strong>+{estimatedPoints} pontos</strong> nesta compra
        </span>
      </div> */}

      {/* Summary */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span>Itens ({itemCount})</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>

        {/* Discount placeholder */}
        {/* <div className="flex items-center justify-between text-primary-green">
          <span>Desconto do plano</span>
          <span>-R$ 0,00</span>
        </div> */}

        <div className="flex items-center justify-between border-t border-gray-border pt-2 text-base font-semibold text-text-primary">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Warnings */}
      {hasIssues && (
        <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
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
