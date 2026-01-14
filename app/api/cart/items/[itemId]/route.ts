/**
 * Cart Items API Route
 *
 * PATCH /api/cart/items/[itemId] - Update item quantity
 * DELETE /api/cart/items/[itemId] - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cartService } from '@/services';
import { updateCartItemSchema } from '@/schemas/cart.schema';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do item é obrigatório',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parseResult = updateCartItemSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantidade inválida',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { quantity } = parseResult.data;
    const result = await cartService.updateQuantity(session.user.id, itemId, quantity);

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
    console.error('[API] Error updating cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar item',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do item é obrigatório',
        },
        { status: 400 }
      );
    }

    const result = await cartService.removeItem(session.user.id, itemId);

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
    console.error('[API] Error removing cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao remover item',
      },
      { status: 500 }
    );
  }
}
