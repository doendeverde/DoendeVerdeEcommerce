/**
 * Shipping Profiles Admin API
 *
 * GET /api/admin/shipping-profiles - List all profiles
 * POST /api/admin/shipping-profiles - Create new profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shippingRepository } from "@/repositories/shipping.repository";
import { shippingProfileSchema } from "@/schemas/shipping.schema";

// GET - List all shipping profiles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const profiles = await shippingRepository.getAll({ includeCount: true });

    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error("[Admin Shipping Profiles] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao listar perfis de frete" },
      { status: 500 }
    );
  }
}

// POST - Create new shipping profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate
    const validation = shippingProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    // Create profile
    const profile = await shippingRepository.create(validation.data);

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin Shipping Profiles] POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar perfil de frete" },
      { status: 500 }
    );
  }
}
