/**
 * CartItem Component
 *
 * Item individual do carrinho com controles de quantidade.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import { CartItemDisplay } from '@/types/cart';
import { useCartStore, selectIsItemPending } from '@/stores/cart';
import { productImageProps, getSafeImageUrl, getImageSizes } from '@/lib/image-utils';
import { formatCurrency } from '@/lib/utils';

interface CartItemProps {
  item: CartItemDisplay;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, closeDrawer } = useCartStore();
  const isPending = useCartStore(selectIsItemPending(item.id));

  const handleIncrease = () => {
    if (item.quantity < item.maxQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  return (
    <div
      className={`flex gap-4 rounded-lg border p-3 transition-all ${isPending ? 'opacity-60' : ''
        } ${item.isOutOfStock ? 'border-red-border bg-red-bg' : 'border-gray-border bg-card-bg'}`}
    >
      {/* Image */}
      <Link
        href={`/products/${item.product.slug}`}
        onClick={closeDrawer}
        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-bg"
      >
        <Image
          src={getSafeImageUrl(item.product.image?.url)}
          alt={item.product.image?.altText || item.product.name}
          fill
          className="object-cover"
          sizes={getImageSizes('cart')}
          {...productImageProps}
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        {/* Name */}
        <Link
          href={`/products/${item.product.slug}`}
          onClick={closeDrawer}
          className="text-sm font-medium text-text-primary line-clamp-2 hover:text-primary-green transition-colors"
        >
          {item.product.name}
        </Link>

        {/* Warnings */}
        {item.isOutOfStock && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-text">
            <AlertCircle className="h-3 w-3" />
            <span>Produto indisponível</span>
          </div>
        )}

        {item.priceChanged && !item.isOutOfStock && (
          <div className="mt-1 flex items-center gap-1 text-xs text-yellow-text">
            <AlertCircle className="h-3 w-3" />
            <span>Preço atualizado para {formatCurrency(item.currentPrice)}</span>
          </div>
        )}

        {/* Price and Quantity */}
        <div className="mt-auto flex items-end justify-between">
          {/* Price */}
          <div className="text-sm font-semibold text-text-primary">
            {formatCurrency(item.totalPrice)}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecrease}
              disabled={isPending || item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-border text-text-secondary transition-colors hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-[2rem] text-center text-sm font-medium text-text-primary">
              {item.quantity}
            </span>

            <button
              onClick={handleIncrease}
              disabled={isPending || item.quantity >= item.maxQuantity}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-border text-text-secondary transition-colors hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleRemove}
              disabled={isPending}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-red-bg hover:text-red-text disabled:opacity-50"
              aria-label="Remover item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
