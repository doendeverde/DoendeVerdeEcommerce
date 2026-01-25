/**
 * Shipping Quote API
 *
 * POST /api/shipping/quote
 *
 * Calculate shipping options for a given CEP and products/plan.
 * Admin users get free shipping option even in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { shippingQuoteRequestSchema } from "@/schemas/shipping.schema";
import { shippingService } from "@/services/shipping.service";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Shipping Quote API] Request body:", JSON.stringify(body, null, 2));

    // Check if user is admin (for free shipping option)
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    
    if (isAdmin) {
      console.log("[Shipping Quote API] Admin user detected - free shipping enabled");
    }

    // Validate request
    const validation = shippingQuoteRequestSchema.safeParse(body);

    if (!validation.success) {
      console.log("[Shipping Quote API] Validation failed:", validation.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    // Calculate shipping (admin gets free shipping option)
    const result = await shippingService.calculateShipping(validation.data, isAdmin);

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
      data: result,
    });
  } catch (error) {
    console.error("[Shipping Quote API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao calcular frete. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
