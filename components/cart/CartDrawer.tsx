/**
 * CartDrawer Component
 *
 * Drawer lateral do carrinho.
 * Abre da direita com overlay escuro.
 */

'use client';

import { useEffect, useMemo } from 'react';
import { X, ShoppingCart, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useSession } from 'next-auth/react';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    isDrawerOpen,
    closeDrawer,
    fetchCart,
    isLoading,
    isInitialized,
    cart,
  } = useCartStore();

  // Memoize derived state to prevent infinite loops
  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const isEmpty = useMemo(() => cart?.isEmpty ?? true, [cart?.isEmpty]);

  // Fetch cart when user is authenticated
  useEffect(() => {
    if (session?.user && !isInitialized) {
      fetchCart();
    }
  }, [session, isInitialized, fetchCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen, closeDrawer]);

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Carrinho</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !session ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Faça login para ver seu carrinho
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Seus itens serão salvos automaticamente.
              </p>
            </div>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Seu carrinho está vazio
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Adicione produtos para começar.
              </p>
              <button
                onClick={closeDrawer}
                className="mt-6 rounded-lg bg-primary-green px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {session && !isEmpty && !isLoading && (
          <CartSummary onCheckout={handleCheckout} />
        )}
      </div>
    </>
  );
}
