/**
 * Payment Preference API
 * 
 * POST /api/checkout/payment-preference - Create Mercado Pago checkout preference
 * 
 * This creates a Checkout Pro preference that redirects users to Mercado Pago
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscriptionPayment, createProductPayment } from "@/services/payment.service";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const subscriptionPreferenceSchema = z.object({
  type: z.literal("subscription"),
  planSlug: z.string(),
  orderId: z.string().optional(),
});

const productPreferenceSchema = z.object({
  type: z.literal("product"),
  orderId: z.string(),
});

const paymentPreferenceSchema = z.discriminatedUnion("type", [
  subscriptionPreferenceSchema,
  productPreferenceSchema,
]);

// ─────────────────────────────────────────────────────────────────────────────
// POST - Create payment preference
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = paymentPreferenceSchema.parse(body);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Subscription Payment
    // ─────────────────────────────────────────────────────────────────────────

    if (validated.type === "subscription") {
      // Get plan
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { slug: validated.planSlug, active: true },
      });

      if (!plan) {
        return NextResponse.json(
          { success: false, error: "Plano não encontrado" },
          { status: 404 }
        );
      }

      // Create payment preference
      const preference = await createSubscriptionPayment({
        planId: plan.id,
        planName: plan.name,
        planDescription: plan.description || `Assinatura ${plan.name}`,
        price: Number(plan.price),
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        orderId: validated.orderId,
      });

      return NextResponse.json({
        success: true,
        data: {
          preferenceId: preference.preferenceId,
          initPoint: preference.isTestMode 
            ? preference.sandboxInitPoint 
            : preference.initPoint,
          isTestMode: preference.isTestMode,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Product Payment (Cart)
    // ─────────────────────────────────────────────────────────────────────────

    if (validated.type === "product") {
      // Get order with items
      const order = await prisma.order.findUnique({
        where: { 
          id: validated.orderId,
          userId: session.user.id,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Pedido não encontrado" },
          { status: 404 }
        );
      }

      // Create payment preference
      const preference = await createProductPayment({
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.product?.name || item.title,
          description: item.product?.description || undefined,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          imageUrl: item.product?.images[0]?.url,
        })),
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        orderId: order.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          preferenceId: preference.preferenceId,
          initPoint: preference.isTestMode 
            ? preference.sandboxInitPoint 
            : preference.initPoint,
          isTestMode: preference.isTestMode,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Tipo de pagamento inválido" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    console.error("Error creating payment preference:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar preferência de pagamento" },
      { status: 500 }
    );
  }
}
