/**
 * Cart API Route
 *
 * GET /api/cart - Get current user's cart
 * POST /api/cart - Add item to cart
 * DELETE /api/cart - Clear cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cartService } from '@/services';
import { addToCartSchema } from '@/schemas/cart.schema';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa estar logado para acessar o carrinho',
        },
        { status: 401 }
      );
    }

    const cart = await cartService.getCart(session.user.id);

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error('[API] Error fetching cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar carrinho',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa estar logado para adicionar ao carrinho',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = addToCartSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { productId, quantity } = parseResult.data;
    const result = await cartService.addToCart(session.user.id, productId, quantity);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: result.cart,
    });
  } catch (error) {
    console.error('[API] Error adding to cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao adicionar ao carrinho',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa estar logado',
        },
        { status: 401 }
      );
    }

    const result = await cartService.clearCart(session.user.id);

    return NextResponse.json({
      success: true,
      cart: result.cart,
    });
  } catch (error) {
    console.error('[API] Error clearing cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao limpar carrinho',
      },
      { status: 500 }
    );
  }
}
