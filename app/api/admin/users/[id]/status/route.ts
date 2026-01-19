import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
 * PATCH /api/admin/users/[id]/status
 * Atualiza status do usuário (bloquear/desbloquear)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    // Prevent self-blocking
    if (id === authResult.user.id) {
      return NextResponse.json(
        { error: "Você não pode bloquear sua própria conta" },
        { status: 400 }
      );
    }

    const user = await adminService.updateUserStatus(id, validated.status);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Status inválido", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do usuário" },
      { status: 500 }
    );
  }
}
