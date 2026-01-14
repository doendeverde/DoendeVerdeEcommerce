/**
 * Products Listing Page
 *
 * Catálogo de produtos com busca, filtros e paginação.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductCatalog } from './ProductCatalog';

export const metadata: Metadata = {
  title: 'Produtos | Doende HeadShop',
  description: 'Explore nosso catálogo completo de acessórios, piteiras, bongs, sedas, vaporizadores e muito mais.',
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Nossos Produtos
          </h1>
          <p className="mt-2 text-gray-600">
            Encontre os melhores acessórios para você
          </p>
        </div>

        {/* Catalog */}
        <Suspense fallback={<ProductCatalogSkeleton />}>
          <ProductCatalog />
        </Suspense>
      </div>
    </div>
  );
}

function ProductCatalogSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filters skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-12 w-full max-w-md animate-pulse rounded-full bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-white border border-gray-200">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="flex items-end justify-between pt-2">
                <div className="h-6 w-24 rounded bg-gray-200" />
                <div className="h-10 w-10 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
