/**
 * ProductCatalog Client Component
 *
 * Handles search, filters, and product listing with client-side state.
 * Receives initial data from server for fast first render (SEO optimized).
 * 
 * Optimizations:
 * - Cache for previously fetched results
 * - AbortController to cancel in-flight requests
 * - Debounce handled by SearchBar component
 */

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
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

interface CachedResult {
  products: ProductListItem[];
  categories: CategoryItem[];
  pagination: PaginationState;
  timestamp: number;
}

interface ProductCatalogProps {
  initialProducts: ProductListItem[];
  initialCategories: CategoryItem[];
  initialPagination: PaginationState;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Generate cache key from filter params
function getCacheKey(params: Record<string, string | undefined | null>): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return sortedParams || 'default';
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

  // AbortController ref for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Results cache
  const cacheRef = useRef<Map<string, CachedResult>>(new Map());

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
  const message = searchParams.get('message');

  // Show toast messages from URL params (e.g., validation errors from checkout redirect)
  useEffect(() => {
    if (message) {
      const messages: Record<string, { type: 'error' | 'warning' | 'info'; text: string }> = {
        cart_empty: { type: 'info', text: 'Seu carrinho está vazio. Adicione produtos para continuar.' },
        cart_validation_failed: { type: 'error', text: 'Alguns itens do carrinho não estão mais disponíveis. Revise seu carrinho.' },
        checkout_error: { type: 'error', text: 'Erro ao processar checkout. Tente novamente.' },
      };

      const msg = messages[message];
      if (msg) {
        toast[msg.type](msg.text);
        // Remove message from URL after showing
        const params = new URLSearchParams(searchParams.toString());
        params.delete('message');
        router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
      }
    }
  }, [message, searchParams, router, pathname]);

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

  // Current filter params for cache key
  const currentFilterParams = useMemo(() => ({
    search,
    category,
    minPrice: minPrice?.toString(),
    maxPrice: maxPrice?.toString(),
    inStock: inStock ? 'true' : undefined,
    sortBy,
    sortOrder,
    page: page.toString(),
  }), [search, category, minPrice, maxPrice, inStock, sortBy, sortOrder, page]);

  // Fetch products on filter changes (skip initial mount - data comes from server)
  useEffect(() => {
    // Skip fetch on initial mount - we already have data from server
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // Store initial data in cache
      const initialCacheKey = getCacheKey(currentFilterParams);
      cacheRef.current.set(initialCacheKey, {
        products: initialProducts,
        categories: initialCategories,
        pagination: initialPagination,
        timestamp: Date.now(),
      });
      return;
    }

    const cacheKey = getCacheKey(currentFilterParams);

    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProducts(cached.products);
      setCategories(cached.categories);
      setPagination(cached.pagination);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: abortController.signal,
        });

        // Check if request was aborted
        if (abortController.signal.aborted) return;

        const data: ProductsResponse = await response.json();

        if (data.success) {
          // Update state
          setProducts(data.products);
          setCategories(data.categories);
          setPagination(data.pagination);

          // Store in cache
          cacheRef.current.set(cacheKey, {
            products: data.products,
            categories: data.categories,
            pagination: data.pagination,
            timestamp: Date.now(),
          });

          // Cleanup old cache entries (keep last 20)
          if (cacheRef.current.size > 20) {
            const entries = Array.from(cacheRef.current.entries());
            entries
              .sort((a, b) => a[1].timestamp - b[1].timestamp)
              .slice(0, entries.length - 20)
              .forEach(([key]) => cacheRef.current.delete(key));
          }
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching products:', error);
      } finally {
        // Only set loading to false if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    // Cleanup on unmount or when deps change
    return () => {
      abortController.abort();
    };
  }, [currentFilterParams, initialProducts, initialCategories, initialPagination]);

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
      {/* Search Bar */}
      <div className="w-full">
        <SearchBar value={search} onChange={handleSearchChange} />
      </div>

      {/* FEATURE DISABLED: Filters - will be enabled in the future */}
      {/* <div className="flex items-center gap-2">
        <ProductFilters
          minPrice={minPrice}
          maxPrice={maxPrice}
          inStock={inStock}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />
      </div> */}

      {/* Categories */}
      <CategoryChips
        categories={categories}
        selectedCategory={category}
        onSelect={handleCategorySelect}
        isLoading={isLoading && categories.length === 0}
      />

      {/* Results Count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
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
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}
