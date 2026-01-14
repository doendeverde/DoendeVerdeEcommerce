/**
 * Products API Route
 *
 * GET /api/products - List products with filters, search, pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services';
import { productFiltersSchema } from '@/schemas/product.schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const rawFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
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
      pageSize: searchParams.get('pageSize')
        ? Number(searchParams.get('pageSize'))
        : undefined,
      sortBy: (searchParams.get('sortBy') as 'price' | 'name' | 'createdAt') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
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

    return NextResponse.json({
      success: true,
      ...result,
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
