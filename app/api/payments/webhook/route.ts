/**
 * Mercado Pago Webhook API
 * 
 * POST /api/payments/webhook - Handle Mercado Pago payment notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { checkoutService } from "@/services/checkout.service";
import { mercadoPagoWebhookSchema } from "@/schemas/checkout.schema";

// ─────────────────────────────────────────────────────────────────────────────
// POST - Handle webhook notification
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook payload
    const validated = mercadoPagoWebhookSchema.safeParse(body);
    
    if (!validated.success) {
      console.warn("Invalid webhook payload:", body);
      // Return 200 to acknowledge receipt (MP will retry otherwise)
      return NextResponse.json({ success: true, message: "Acknowledged" });
    }

    const { type, data, action } = validated.data;

    // Only process payment notifications
    if (type !== "payment") {
      return NextResponse.json({ success: true, message: "Ignored non-payment notification" });
    }

    // TODO: Verify webhook signature
    // const signature = request.headers.get("x-signature");
    // const verified = verifyMercadoPagoSignature(signature, body);
    // if (!verified) return NextResponse.json({ success: false }, { status: 401 });

    // Get payment details from Mercado Pago
    // TODO: Replace with actual MP SDK call
    // const mp = new MercadoPago(process.env.MERCADO_PAGO_ACCESS_TOKEN);
    // const mpPayment = await mp.payment.get(data.id);
    
    // For now, extract action to determine status
    let status: "approved" | "pending" | "rejected" | "cancelled";
    switch (action) {
      case "payment.created":
        status = "pending";
        break;
      case "payment.updated":
        // Would need to fetch actual status from MP
        status = "approved";
        break;
      default:
        status = "pending";
    }

    // Process the webhook
    const result = await checkoutService.handlePaymentWebhook(
      data.id,
      status,
      data.id,
      body
    );

    if (!result.success) {
      console.error("Webhook processing failed:", result.error);
      // Still return 200 to acknowledge
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Webhook verification (some providers require this)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // MP may send a verification request
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get("challenge");
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ status: "ok" });
}
