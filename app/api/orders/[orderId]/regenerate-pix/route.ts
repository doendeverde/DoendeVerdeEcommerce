/**
 * Regenerate PIX for Order API
 * 
 * POST /api/orders/[orderId]/regenerate-pix
 * Generates a new PIX payment for a pending order.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPixPaymentDirect } from "@/services/payment.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // 2. Get order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        user: {
          select: {
            email: true,
            fullName: true,
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

    // 3. Check if order is still pending
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Este pedido já foi processado" },
        { status: 400 }
      );
    }

    const lastPayment = order.payments[0];
    if (!lastPayment) {
      return NextResponse.json(
        { success: false, error: "Pagamento não encontrado" },
        { status: 400 }
      );
    }

    // 4. Check if last payment is already approved
    if (lastPayment.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "Pagamento já confirmado" },
        { status: 400 }
      );
    }

    // 5. Create new PIX payment
    const amount = Number(order.totalAmount);
    
    console.log("[Regenerate PIX] Creating new PIX for order:", {
      orderId,
      amount,
      email: order.user.email,
    });

    const pixResult = await createPixPaymentDirect({
      amount,
      description: `Pagamento pedido #${orderId}`,
      email: order.user.email,
      externalReference: orderId,
    });

    // 6. Update payment record with new PIX data
    await prisma.payment.update({
      where: { id: lastPayment.id },
      data: {
        transactionId: pixResult.paymentId,
        pixQrCode: pixResult.qrCode,
        pixQrCodeBase64: pixResult.qrCodeBase64,
        pixTicketUrl: pixResult.ticketUrl,
        pixExpiresAt: pixResult.expirationDate,
      },
    });

    console.log("[Regenerate PIX] New PIX created:", {
      paymentId: pixResult.paymentId,
      hasQrCode: !!pixResult.qrCode,
    });
    
    // Log destacado para testes de webhook
    console.log("\n" + "=".repeat(80));
    console.log("🔵 PIX PAYMENT ID (Regenerated - use para webhook):", pixResult.paymentId);
    console.log("   Order ID:", orderId);
    console.log("   Amount: R$", amount);
    if (pixResult.ticketUrl) {
      console.log("\n   🎫 TICKET URL (abra para aprovar com conta teste):");
      console.log("   ", pixResult.ticketUrl);
    }
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      pix: {
        transactionId: pixResult.paymentId,
        qrCode: pixResult.qrCode,
        qrCodeBase64: pixResult.qrCodeBase64,
        ticketUrl: pixResult.ticketUrl,
        expiresAt: pixResult.expirationDate,
      },
    });
  } catch (error) {
    console.error("[Regenerate PIX] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao regenerar PIX" 
      },
      { status: 500 }
    );
  }
}
