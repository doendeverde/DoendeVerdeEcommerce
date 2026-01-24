/**
 * Product Checkout API Route
 *
 * POST /api/checkout/cart - Process cart checkout
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { checkoutService } from "@/services/checkout.service";
import { productCheckoutSchema } from "@/schemas/checkout.schema";
import { ZodError } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// POST - Process Cart Checkout
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication and blocked status
    const authResult = await requireAuth();
    if (!authResult.success) {
      return authResult.response;
    }
    
    const { session, userId } = authResult;

    // 2. Parse and validate request body
    const body = await request.json();
    const validated = productCheckoutSchema.parse(body);

    // 3. Process checkout
    const result = await checkoutService.processProductCheckout(
      userId,
      {
        id: userId,
        fullName: session?.user.name || "Cliente",
        email: session?.user.email || "",
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
