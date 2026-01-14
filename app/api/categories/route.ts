/**
 * Categories API Route
 *
 * GET /api/categories - List active categories with product count
 */

import { NextResponse } from 'next/server';
import { categoryRepository } from '@/repositories';

export async function GET() {
  try {
    const categories = await categoryRepository.findActive();

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat._count.products,
    }));

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar categorias',
      },
      { status: 500 }
    );
  }
}
