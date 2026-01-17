/**
 * ProductCatalog Client Component
 *
 * Handles search, filters, and product listing with client-side state.
 * Receives initial data from server for fast first render.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductListItem, CategoryItem } from '@/types/product';
import {
  ProductGrid,
  SearchBar,
  CategoryChips,
  ProductFilters,
} from '@/components/products';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProductsResponse {
  success: boolean;
  products: ProductListItem[];
  categories: CategoryItem[];
  pagination: PaginationState;
}

interface ProductCatalogProps {
  initialProducts: ProductListItem[];
  initialCategories: CategoryItem[];
  initialPagination: PaginationState;
}

export function ProductCatalog({
  initialProducts,
  initialCategories,
  initialPagination,
}: ProductCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track if this is the initial render (to skip fetch on mount)
  const isInitialMount = useRef(true);

  // State - initialized with server data
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);

  // Parse URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || null;
  const minPrice = searchParams.get('minPrice')
    ? Number(searchParams.get('minPrice'))
    : undefined;
  const maxPrice = searchParams.get('maxPrice')
    ? Number(searchParams.get('maxPrice'))
    : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const sortBy = (searchParams.get('sortBy') as 'price' | 'name' | 'createdAt') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset to page 1 when filters change (except when changing page)
      if (!('page' in updates)) {
        params.delete('page');
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Fetch products on filter changes (skip initial mount - data comes from server)
  useEffect(() => {
    // Skip fetch on initial mount - we already have data from server
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        if (minPrice !== undefined) params.set('minPrice', minPrice.toString());
        if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString());
        if (inStock) params.set('inStock', 'true');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        params.set('page', page.toString());
        params.set('pageSize', '12');

        const response = await fetch(`/api/products?${params.toString()}`);
        const data: ProductsResponse = await response.json();

        if (data.success) {
          setProducts(data.products);
          setCategories(data.categories);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [search, category, minPrice, maxPrice, inStock, sortBy, sortOrder, page]);

  // Handlers
  const handleSearchChange = (value: string) => {
    updateParams({ search: value || null });
  };

  const handleCategorySelect = (categorySlug: string | null) => {
    updateParams({ category: categorySlug });
  };

  const handleFiltersChange = (filters: {
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'price' | 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) => {
    updateParams({
      minPrice: filters.minPrice?.toString() || null,
      maxPrice: filters.maxPrice?.toString() || null,
      inStock: filters.inStock ? 'true' : null,
      sortBy: filters.sortBy || null,
      sortOrder: filters.sortOrder || null,
    });
  };

  const handleClearFilters = () => {
    router.push(pathname);
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <SearchBar value={search} onChange={handleSearchChange} />
        </div>
        <div className="flex items-center gap-2">
          <ProductFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            inStock={inStock}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </div>
      </div>

      {/* Categories */}
      <CategoryChips
        categories={categories}
        selectedCategory={category}
        onSelect={handleCategorySelect}
        isLoading={isLoading && categories.length === 0}
      />

      {/* Results Count */}
      {!isLoading && (
        <p className="text-sm text-gray-500">
          {pagination.total === 0
            ? 'Nenhum produto encontrado'
            : `${pagination.total} produto${pagination.total > 1 ? 's' : ''} encontrado${pagination.total > 1 ? 's' : ''}`}
        </p>
      )}

      {/* Product Grid */}
      <ProductGrid products={products} isLoading={isLoading} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrev}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - page) <= 1
              )
              .map((p, idx, arr) => {
                // Add ellipsis
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  return (
                    <span key={`ellipsis-${p}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`h-10 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${p === page
                      ? 'bg-primary-green text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNext}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}
