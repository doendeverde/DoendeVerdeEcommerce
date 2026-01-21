/**
 * Product Checkout API Route
 *
 * POST /api/checkout/cart - Process cart checkout
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkoutService } from "@/services/checkout.service";
import { productCheckoutSchema } from "@/schemas/checkout.schema";
import { ZodError } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// POST - Process Cart Checkout
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado", errorCode: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validated = productCheckoutSchema.parse(body);

    // 3. Process checkout
    const result = await checkoutService.processProductCheckout(
      session.user.id,
      {
        id: session.user.id,
        fullName: session.user.name || "Cliente",
        email: session.user.email || "",
        whatsapp: null, // TODO: Get from user profile
      },
      validated
    );

    // 4. Return result
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
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

    console.error("Checkout API error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
