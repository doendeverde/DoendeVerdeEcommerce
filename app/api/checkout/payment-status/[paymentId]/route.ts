/**
 * Payment Status API
 * 
 * GET /api/checkout/payment-status/[paymentId] - Check payment status
 * 
 * Used for polling PIX payment status.
 * Returns current status from Mercado Pago.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MP_ACCESS_TOKEN } from "@/lib/mercadopago-config";

// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago Payment Status
// ─────────────────────────────────────────────────────────────────────────────

async function getPaymentStatusFromMP(paymentId: string): Promise<{
  status: "pending" | "approved" | "rejected" | "cancelled" | "in_process";
  statusDetail: string;
}> {
  const accessToken = MP_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN not configured");
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[PaymentStatus] MP API error:", errorText);
    throw new Error(`Failed to get payment status: ${response.status}`);
  }

  const data = await response.json();

  return {
    status: data.status || "pending",
    statusDetail: data.status_detail || "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Check payment status
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { paymentId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID obrigatório" },
        { status: 400 }
      );
    }

    // If orderId provided, verify user owns the order
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Pedido não encontrado" },
          { status: 404 }
        );
      }
    }

    // Get payment status from Mercado Pago
    const mpStatus = await getPaymentStatusFromMP(paymentId);

    // Map MP status to our simplified status
    let status: "pending" | "approved" | "rejected" | "cancelled";
    switch (mpStatus.status) {
      case "approved":
        status = "approved";
        break;
      case "rejected":
        status = "rejected";
        break;
      case "cancelled":
        status = "cancelled";
        break;
      case "in_process":
      default:
        status = "pending";
    }

    return NextResponse.json({
      success: true,
      status,
      statusDetail: mpStatus.statusDetail,
      paymentId,
    });
  } catch (error) {
    console.error("[PaymentStatus] Error:", error);
    
    // Return pending on error to continue polling
    return NextResponse.json({
      success: true,
      status: "pending",
      error: error instanceof Error ? error.message : "Erro ao verificar status",
    });
  }
}
