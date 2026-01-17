/**
 * Products API Route
 *
 * GET /api/products - List products with filters, search, pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services';
import { productFiltersSchema } from '@/schemas/product.schema';
import type { ProductFilters } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Map frontend params to service format
    const mapSortBy = (): ProductFilters['sortBy'] => {
      const sortBy = searchParams.get('sortBy');
      const sortOrder = searchParams.get('sortOrder');

      if (!sortBy) return 'relevance';

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

    // Parse and transform query params
    const rawFilters = {
      search: searchParams.get('search') || undefined,
      categorySlug: searchParams.get('category') || searchParams.get('categorySlug') || undefined,
      minPrice: searchParams.get('minPrice')
        ? Number(searchParams.get('minPrice'))
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? Number(searchParams.get('maxPrice'))
        : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      page: searchParams.get('page')
        ? Number(searchParams.get('page'))
        : undefined,
      limit: searchParams.get('pageSize') || searchParams.get('limit')
        ? Number(searchParams.get('pageSize') || searchParams.get('limit'))
        : undefined,
      sortBy: mapSortBy(),
    };

    // Validate with Zod
    const parseResult = productFiltersSchema.safeParse(rawFilters);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros de busca inválidos',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Get products with categories for filtering UI
    const result = await productService.getProductsWithCategories(parseResult.data);

    // Transform pagination to match frontend expectations (hasNext/hasPrev instead of hasMore)
    const pagination = {
      page: result.pagination.page,
      pageSize: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasMore,
      hasPrev: result.pagination.page > 1,
    };

    return NextResponse.json({
      success: true,
      products: result.products,
      categories: result.categories,
      pagination,
    });
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar produtos',
      },
      { status: 500 }
    );
  }
}
