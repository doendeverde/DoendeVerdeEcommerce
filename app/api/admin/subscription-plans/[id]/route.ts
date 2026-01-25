import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { z } from "zod";

// Schema de validação para colorScheme
const colorSchemeSchema = z.object({
  primary: z.string(),
  text: z.string(),
  primaryDark: z.string(),
  textDark: z.string(),
  badge: z.string().optional(),
  icon: z.string().optional(),
}).nullable().optional();

// Schema de validação para atualização de plano
const updatePlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  price: z.number().positive("Preço deve ser maior que zero").optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]).optional(),
  colorScheme: colorSchemeSchema,
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  shippingProfileId: z.string().uuid().optional().nullable(),
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
 * GET /api/admin/subscription-plans/[id]
 * Busca um plano por ID
 */
export async function GET(
  _request: NextRequest,
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
    const plan = await adminService.getSubscriptionPlanById(id);

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return NextResponse.json(
      { error: "Erro ao buscar plano" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/subscription-plans/[id]
 * Atualiza um plano
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
    const validated = updatePlanSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    // Verifica se o plano existe
    const existingPlan = await adminService.getSubscriptionPlanById(id);
    if (!existingPlan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    const plan = await adminService.updateSubscriptionPlan(id, {
      ...validated.data,
      shippingProfileId: validated.data.shippingProfileId,
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Já existe um plano com este slug" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar plano" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscription-plans/[id]
 * Exclui um plano
 */
export async function DELETE(
  _request: NextRequest,
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

    // Verifica se o plano existe
    const existingPlan = await adminService.getSubscriptionPlanById(id);
    if (!existingPlan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Verifica se há assinaturas ativas vinculadas
    if (existingPlan._count && existingPlan._count.userSubscriptions > 0) {
      return NextResponse.json(
        { 
          error: "Não é possível excluir este plano pois existem assinaturas vinculadas",
          subscriptionsCount: existingPlan._count.userSubscriptions
        },
        { status: 400 }
      );
    }

    await adminService.deleteSubscriptionPlan(id);

    return NextResponse.json({ success: true, message: "Plano excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json(
      { error: "Erro ao excluir plano" },
      { status: 500 }
    );
  }
}
