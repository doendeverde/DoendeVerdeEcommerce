import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";

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
 * GET /api/admin/user-subscriptions
 * Lista todas as assinaturas de usuários
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      planId: searchParams.get("planId") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
    };

    const result = await adminService.getUserSubscriptions(filters);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas" },
      { status: 500 }
    );
  }
}
