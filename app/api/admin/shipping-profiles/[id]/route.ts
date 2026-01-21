/**
 * Shipping Profile Admin API - Single Resource
 *
 * GET /api/admin/shipping-profiles/[id] - Get single profile
 * PATCH /api/admin/shipping-profiles/[id] - Update profile
 * DELETE /api/admin/shipping-profiles/[id] - Delete profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shippingRepository } from "@/repositories/shipping.repository";
import { shippingProfileUpdateSchema } from "@/schemas/shipping.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single shipping profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const profile = await shippingRepository.getWithRelations(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Perfil de frete não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("[Admin Shipping Profile] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar perfil de frete" },
      { status: 500 }
    );
  }
}

// PATCH - Update shipping profile
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate
    const validation = shippingProfileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await shippingRepository.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Perfil de frete não encontrado" },
        { status: 404 }
      );
    }

    // Update
    const profile = await shippingRepository.update(id, validation.data);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("[Admin Shipping Profile] PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar perfil de frete" },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipping profile
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Try to delete
    try {
      await shippingRepository.delete(id);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Perfil de frete excluído com sucesso",
    });
  } catch (error) {
    console.error("[Admin Shipping Profile] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao excluir perfil de frete" },
      { status: 500 }
    );
  }
}
