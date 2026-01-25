/**
 * AddToCartButton Component
 *
 * Botão de adicionar ao carrinho com seletor de quantidade.
 */

'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useAuthModalStore } from '@/stores/authModal';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  productId: string;
  productSlug: string;
  stock: number;
  isOutOfStock: boolean;
}

export function AddToCartButton({
  productId,
  productSlug,
  stock,
  isOutOfStock,
}: AddToCartButtonProps) {
  const { data: session } = useSession();
  const { addItem, pendingOperations } = useCartStore();
  const { open } = useAuthModalStore();
  const [quantity, setQuantity] = useState(1);

  const isAdding = pendingOperations.has(`add-${productId}`);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      open('login', `/products/${productSlug}`);
      toast.info('Faça login para adicionar ao carrinho');
      return;
    }

    if (isOutOfStock) {
      toast.error('Produto indisponível');
      return;
    }

    const success = await addItem(productId, quantity);
    if (success) {
      toast.success(`${quantity} ${quantity > 1 ? 'itens adicionados' : 'item adicionado'} ao carrinho!`, {
        action: {
          label: 'Ver carrinho',
          onClick: () => useCartStore.getState().openDrawer(),
        },
      });
      setQuantity(1);
    }
  };

  if (isOutOfStock) {
    return (
      <button
        disabled
        className="w-full rounded-lg bg-gray-300 py-4 text-base font-semibold text-gray-500 cursor-not-allowed"
      >
        Produto Indisponível
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-text-secondary">Quantidade:</span>
        <div className="flex items-center rounded-lg border border-gray-border">
          <button
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Diminuir quantidade"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-base font-medium text-text-primary">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            disabled={quantity >= stock}
            className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Aumentar quantidade"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-text-secondary">
          {stock} disponíveis
        </span>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary-green py-4 text-base font-semibold text-white transition-all hover:bg-green-600 disabled:opacity-70"
      >
        {isAdding ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ShoppingCart className="h-5 w-5" />
        )}
        {isAdding ? 'Adicionando...' : 'Adicionar ao Carrinho'}
      </button>
    </div>
  );
}
