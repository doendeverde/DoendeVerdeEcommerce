import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook endpoint for payment provider notifications
 * This will be called by Mercado Pago when payment status changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log webhook for debugging
    console.log("Payment webhook received:", JSON.stringify(body, null, 2));

    // TODO: Implement webhook signature verification
    // TODO: Process payment notifications
    // TODO: Update order/payment status in database

    // For now, just acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Mercado Pago also sends GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" }, { status: 200 });
}
