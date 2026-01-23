/**
 * API Route: Admin - Approve Payment Manually
 * 
 * Processa pagamento manualmente quando webhook do gateway falha.
 * Verifica status no Mercado Pago e atualiza o banco de dados.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Payment, MercadoPagoConfig } from "mercadopago";
import { MP_ACCESS_TOKEN } from "@/lib/mercadopago-config";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verify admin session
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const { paymentId } = body;

    console.log(`[Admin] Aprovando pagamento manualmente - Order: ${orderId}, Payment: ${paymentId}`);

    // 2. Find order and payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    const payment = order.payments.find(
      (p) => p.id === paymentId || p.transactionId === paymentId
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado neste pedido" },
        { status: 404 }
      );
    }

    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "Pagamento já está aprovado", status: payment.status },
        { status: 400 }
      );
    }

    // 3. Verify payment status on Mercado Pago (if transactionId exists)
    let mpStatus = "approved"; // Default for manual approval

    if (payment.transactionId && MP_ACCESS_TOKEN) {
      try {
        const mpConfig = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
        const mpPayment = new Payment(mpConfig);
        const mpData = await mpPayment.get({ id: payment.transactionId });

        mpStatus = mpData.status || "approved";

        console.log(`[Admin] Status no Mercado Pago: ${mpStatus}`);

        if (mpStatus !== "approved") {
          return NextResponse.json(
            { 
              error: `Pagamento não está aprovado no Mercado Pago. Status atual: ${mpStatus}`,
              mpStatus,
            },
            { status: 400 }
          );
        }
      } catch (mpError) {
        console.warn("[Admin] Erro ao verificar MP, prosseguindo com aprovação manual:", mpError);
        // Continue with manual approval if MP check fails
      }
    }

    // 4. Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
      },
    });

    // 5. Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    // 6. Check order notes for subscription plan ID
    let subscriptionCreated = false;
    let subscriptionId: string | null = null;

    // Extract planId from notes: "Assinatura: PlanName (Plan ID: uuid)"
    const planIdMatch = order.notes?.match(/Plan ID: ([a-f0-9-]+)/i);
    const planId = planIdMatch?.[1];

    if (planId) {
      console.log(`[Admin] Subscription order detected - Plan ID: ${planId}`);
      
      // Check if subscription already exists
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: order.userId,
          status: "ACTIVE",
        },
      });

      if (!existingSubscription) {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: planId },
        });

        if (plan) {
          // Calculate next billing date
          const nextBillingDate = new Date();
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          // Create subscription
          const subscription = await prisma.subscription.create({
            data: {
              userId: order.userId,
              planId: plan.id,
              status: "ACTIVE",
              startedAt: new Date(),
              nextBillingAt: nextBillingDate,
            },
          });

          subscriptionCreated = true;
          subscriptionId = subscription.id;

          console.log(`[Admin] Subscription criada: ${subscription.id} - Plano: ${plan.name}`);
        } else {
          console.warn(`[Admin] Plano não encontrado: ${planId}`);
        }
      } else {
        console.log(`[Admin] Usuário já tem subscription ativa: ${existingSubscription.id}`);
      }
    }

    console.log(`[Admin] Pagamento aprovado com sucesso - Order: ${orderId}`);

    return NextResponse.json({
      success: true,
      message: "Pagamento aprovado com sucesso",
      order: {
        id: orderId,
        status: "PAID",
      },
      payment: {
        id: payment.id,
        status: "PAID",
      },
      subscription: subscriptionCreated
        ? { created: true, id: subscriptionId }
        : { created: false },
    });
  } catch (error) {
    console.error("[Admin] Erro ao aprovar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar aprovação" },
      { status: 500 }
    );
  }
}
