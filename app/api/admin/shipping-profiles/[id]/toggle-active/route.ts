/**
 * Toggle Shipping Profile Active Status
 *
 * POST /api/admin/shipping-profiles/[id]/toggle-active
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shippingRepository } from "@/repositories/shipping.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Toggle active status
    try {
      const profile = await shippingRepository.toggleActive(id);

      return NextResponse.json({
        success: true,
        data: profile,
        message: profile.isActive
          ? "Perfil de frete ativado"
          : "Perfil de frete desativado",
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("[Admin Shipping Profile Toggle] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao alterar status do perfil de frete" },
      { status: 500 }
    );
  }
}
