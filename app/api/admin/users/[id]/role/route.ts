import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN"]),
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
 * PATCH /api/admin/users/[id]/role
 * Atualiza role do usuário (promover/rebaixar)
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
    const validated = updateRoleSchema.parse(body);

    // Prevent self-demotion
    if (id === authResult.user.id && validated.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Você não pode remover sua própria permissão de admin" },
        { status: 400 }
      );
    }

    const success = await adminService.updateUserRole(id, validated.role);
    
    if (!success) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar role:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
