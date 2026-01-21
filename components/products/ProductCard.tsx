/**
 * ProductCard Component
 *
 * Card de produto para grid de catálogo.
 * Seguindo UI spec: imagem 1:1, badges, pontos, preço, botão adicionar.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Package } from 'lucide-react';
import { ProductListItem } from '@/types/product';
import { useCartStore } from '@/stores/cart';
import { useAuthModalStore } from '@/stores/authModal';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { productImageProps, getSafeImageUrl, getImageSizes } from '@/lib/image-utils';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem, pendingOperations } = useCartStore();
  const { open } = useAuthModalStore();

  const isAddingToCart = pendingOperations.has(`add-${product.id}`);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      open('login', `/products/${product.slug}`);
      toast.info('Faça login para adicionar ao carrinho');
      return;
    }

    if (product.isOutOfStock) {
      toast.error('Produto indisponível');
      return;
    }

    const success = await addItem(product.id);
    if (success) {
      toast.success('Adicionado ao carrinho!');
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-gray-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={getSafeImageUrl(product.primaryImage?.url)}
          alt={product.primaryImage?.altText || product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes={getImageSizes('card')}
          {...productImageProps}
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex flex-col gap-1.5 sm:gap-2">
          {/* Category Badge - hidden on mobile for cleaner look */}
          {product.category && (
            <span className="hidden sm:inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              {product.category.name}
            </span>
          )}

          {/* Discount Badge */}
          {product.isOnSale && (
            <span className="inline-flex items-center rounded-full bg-primary-green px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-sm">
              -{product.discountPercentage}%
            </span>
          )}

          {/* Low Stock Badge */}
          {product.isLowStock && !product.isOutOfStock && (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-white shadow-sm">
              Últimas
            </span>
          )}

          {/* Out of Stock Badge */}
          {product.isOutOfStock && (
            <span className="inline-flex items-center rounded-full bg-gray-500 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-white shadow-sm">
              Esgotado
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-green transition-colors">
          {product.name}
        </h3>

        {/* FEATURE DISABLED: Points will be implemented in the future */}
        {/* <div className="mt-2 flex items-center gap-1 text-xs text-primary-purple font-medium">
          <Package className="h-3.5 w-3.5" />
          <span>+{product.loyaltyPoints} pontos</span>
        </div> */}

        {/* Price Section */}
        <div className="mt-auto pt-2 sm:pt-4 flex items-end justify-between gap-1 sm:gap-2">
          <div className="flex flex-col">
            {product.isOnSale && product.compareAtPrice && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                R$ {product.compareAtPrice.toFixed(2)}
              </span>
            )}
            <span className="text-sm sm:text-lg font-bold text-gray-900">
              R$ {product.basePrice.toFixed(2)}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.isOutOfStock}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary-green text-white transition-all hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Adicionar ao carrinho"
          >
            {isAddingToCart ? (
              <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
