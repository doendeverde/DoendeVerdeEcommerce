/**
 * ProductGrid Component
 *
 * Grid responsivo de cards de produto.
 * Desktop: 4 cols, Tablet: 2 cols, Mobile: 1 col
 */

import { ProductListItem } from '@/types/product';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductListItem[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Nenhum produto encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Tente ajustar os filtros ou buscar por outro termo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white border border-gray-200">
      {/* Image */}
      <div className="aspect-square bg-gray-200" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />

        {/* Points */}
        <div className="h-4 w-24 rounded bg-gray-200" />

        {/* Price */}
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-6 w-24 rounded bg-gray-200" />
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
