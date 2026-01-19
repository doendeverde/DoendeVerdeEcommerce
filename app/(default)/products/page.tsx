/**
 * Products Listing Page
 *
 * Catálogo de produtos com busca, filtros e paginação.
 * Dados iniciais são buscados server-side para melhor SEO e performance.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { productService } from '@/services';
import { ProductCatalog } from './ProductCatalog';
import type { ProductFilters } from '@/types/product';

// ISR: Revalidate product listing every 5 minutes
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Produtos | Doende HeadShop',
  description: 'Explore nosso catálogo completo de acessórios, piteiras, bongs, sedas, vaporizadores e muito mais.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;

  // Map URL params to service filters
  const mapSortBy = (): ProductFilters['sortBy'] => {
    const sortBy = params.sortBy;
    const sortOrder = params.sortOrder;

    if (!sortBy) return 'newest';

    // Already in combined format
    if (['relevance', 'price_asc', 'price_desc', 'newest'].includes(sortBy)) {
      return sortBy as ProductFilters['sortBy'];
    }

    // Map from separate sortBy + sortOrder
    switch (sortBy) {
      case 'price':
        return sortOrder === 'asc' ? 'price_asc' : 'price_desc';
      case 'createdAt':
        return 'newest';
      default:
        return 'relevance';
    }
  };

  const filters: ProductFilters = {
    search: params.search || undefined,
    categorySlug: params.category || undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === 'true' ? true : undefined,
    sortBy: mapSortBy(),
    page: params.page ? Number(params.page) : 1,
    limit: 12,
  };

  // Fetch initial data server-side
  const result = await productService.getProductsWithCategories(filters);

  // Transform pagination to match ProductCatalog expectations
  const initialPagination = {
    page: result.pagination.page,
    pageSize: result.pagination.limit,
    total: result.pagination.total,
    totalPages: result.pagination.totalPages,
    hasNext: result.pagination.hasMore,
    hasPrev: result.pagination.page > 1,
  };

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

        {/* Catalog with initial data from server */}
        <Suspense fallback={<ProductCatalogSkeleton />}>
          <ProductCatalog
            initialProducts={result.products}
            initialCategories={result.categories}
            initialPagination={initialPagination}
          />
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
