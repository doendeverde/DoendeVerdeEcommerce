import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { z } from "zod";

// Schema de validação para criação de plano
const createPlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive("Preço deve ser maior que zero"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]).default("MONTHLY"),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
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
 * GET /api/admin/subscription-plans
 * Lista todos os planos de assinatura
 */
export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const plans = await adminService.getSubscriptionPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos de assinatura" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscription-plans
 * Cria um novo plano de assinatura
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();
    const validated = createPlanSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const plan = await adminService.createSubscriptionPlan({
      ...validated.data,
      imageUrl: validated.data.imageUrl || undefined,
      features: validated.data.features || [],
    });

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Já existe um plano com este slug" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar plano de assinatura" },
      { status: 500 }
    );
  }
}
