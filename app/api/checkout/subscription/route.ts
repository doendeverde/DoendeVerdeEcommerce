/**
 * Subscription Checkout API
 * 
 * POST /api/checkout/subscription - Process subscription checkout
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutService } from "@/services/checkout.service";
import { subscriptionCheckoutSchema } from "@/schemas/checkout.schema";
import { ZodError } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// POST - Process subscription checkout
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validated = subscriptionCheckoutSchema.parse(body);
    
    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Process checkout
    const result = await checkoutService.processSubscriptionCheckout(
      session.user.id,
      user,
      validated
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        orderId: result.orderId,
        paymentId: result.paymentId,
        paymentPreference: result.paymentPreference,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Dados inválidos",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    
    console.error("Error processing subscription checkout:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar assinatura" },
      { status: 500 }
    );
  }
}
