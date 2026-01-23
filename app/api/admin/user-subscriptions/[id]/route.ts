import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELED"]),
});

/**
 * Verifica se o usuário é admin
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: "Não autenticado", status: 401 };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Acesso negado", status: 403 };
  }
  return { user: session.user };
}

/**
 * PATCH /api/admin/user-subscriptions/[id]
 * Atualiza o status de uma assinatura
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Status inválido", details: validated.error.issues },
        { status: 400 }
      );
    }

    const subscription = await adminService.updateUserSubscriptionStatus(
      id,
      validated.data.status
    );

    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar assinatura" },
      { status: 500 }
    );
  }
}
