/**
 * Single Product API Route
 *
 * GET /api/products/[slug] - Get product details by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug do produto é obrigatório',
        },
        { status: 400 }
      );
    }

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado',
        },
        { status: 404 }
      );
    }

    // Get related products
    const relatedProducts = await productService.getRelatedProducts(
      product.id, 
      product.category.id, 
      4
    );

    return NextResponse.json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error('[API] Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar produto',
      },
      { status: 500 }
    );
  }
}
