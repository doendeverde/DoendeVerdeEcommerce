/**
 * Mercado Pago Webhook
 * 
 * Receives payment notifications from Mercado Pago.
 * Processes payment status updates and updates orders accordingly.
 * 
 * ⚠️ FONTE DA VERDADE:
 * - O webhook é a única forma de confirmar status final do pagamento
 * - Frontend NUNCA decide sucesso final
 * - Validação de assinatura é obrigatória em produção
 * 
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getPaymentById } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signature Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida a assinatura do webhook do Mercado Pago
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#verificarsignature
 */
function validateWebhookSignature(
  request: NextRequest,
  body: string
): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  
  // Em desenvolvimento, permitir sem validação se secret não configurado
  if (!webhookSecret) {
    console.warn("[Webhook] MP_WEBHOOK_SECRET not configured - skipping signature validation");
    return true;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  
  if (!xSignature || !xRequestId) {
    console.warn("[Webhook] Missing signature headers");
    return false;
  }

  // Parse x-signature header (format: "ts=xxx,v1=xxx")
  const signatureParts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      signatureParts[key] = value;
    }
  });

  const ts = signatureParts["ts"];
  const v1 = signatureParts["v1"];

  if (!ts || !v1) {
    console.warn("[Webhook] Invalid signature format");
    return false;
  }

  // Build manifest for signature
  // Template: id:[data.id];request-id:[x-request-id];ts:[ts];
  const dataId = JSON.parse(body)?.data?.id;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Generate HMAC signature
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(manifest)
    .digest("hex");

  const isValid = expectedSignature === v1;
  
  if (!isValid) {
    console.warn("[Webhook] Signature validation failed");
  }

  return isValid;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - Handle webhook notification
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Ler body como texto para validação de assinatura
    const bodyText = await request.text();
    
    // Validar assinatura
    if (!validateWebhookSignature(request, bodyText)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const body: WebhookPayload = JSON.parse(bodyText);

    console.log("[Webhook] Received notification:", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    });

    // Store webhook event for auditing
    await prisma.webhookEvent.create({
      data: {
        provider: "MERCADO_PAGO",
        eventType: `${body.type}.${body.action}`,
        externalId: body.data?.id?.toString(),
        payload: body as any,
        processed: false,
      },
    });

    // Only process payment notifications
    if (body.type !== "payment") {
      return NextResponse.json({ success: true, message: "Event type not processed" });
    }

    // Get payment details from Mercado Pago
    const paymentId = body.data.id;
    const paymentDetails = await getPaymentById(paymentId);

    console.log("[Webhook] Payment details:", {
      id: paymentDetails.id,
      status: paymentDetails.status,
      external_reference: paymentDetails.external_reference,
    });

    // Extract order/subscription ID from external_reference
    const externalReference = paymentDetails.external_reference;
    if (!externalReference) {
      console.warn("[Webhook] No external_reference found in payment");
      return NextResponse.json({ success: true, message: "No external reference" });
    }

    // Map Mercado Pago status to our PaymentStatus
    const statusMap: Record<string, "PENDING" | "PAID" | "FAILED" | "REFUNDED"> = {
      pending: "PENDING",
      approved: "PAID",
      authorized: "PENDING",
      in_process: "PENDING",
      in_mediation: "PENDING",
      rejected: "FAILED",
      cancelled: "FAILED",
      refunded: "REFUNDED",
      charged_back: "REFUNDED",
    };

    const paymentStatus = statusMap[paymentDetails.status!] || "PENDING";

    // Check if this is a subscription payment
    const isSubscription = externalReference.startsWith("sub_") || 
                           paymentDetails.metadata?.type === "subscription";

    if (isSubscription) {
      // Handle subscription payment
      await handleSubscriptionPayment(externalReference, paymentDetails, paymentStatus);
    } else {
      // Handle regular order payment
      await handleOrderPayment(externalReference, paymentDetails, paymentStatus);
    }

    // Mark webhook as processed
    await prisma.webhookEvent.updateMany({
      where: {
        externalId: paymentId.toString(),
        provider: "MERCADO_PAGO",
      },
      data: {
        processed: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing notification:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

async function handleSubscriptionPayment(
  externalReference: string,
  paymentDetails: any,
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
) {
  console.log("[Webhook] Processing subscription payment:", externalReference);

  // Find the subscription cycle or create payment record
  const subscriptionId = paymentDetails.metadata?.subscription_id;
  
  if (subscriptionId) {
    // Update subscription status if payment approved
    if (paymentStatus === "PAID") {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          // Calculate next billing date (1 month from now)
          nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create or update subscription cycle
      await prisma.subscriptionCycle.create({
        data: {
          subscriptionId,
          status: "PAID",
          cycleStart: new Date(),
          cycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: paymentDetails.transaction_amount,
        },
      });
    }
  }

  // Create payment record
  const orderId = paymentDetails.metadata?.order_id;
  if (orderId) {
    await prisma.payment.upsert({
      where: {
        id: paymentDetails.id?.toString() || `mp_${Date.now()}`,
      },
      create: {
        orderId,
        provider: "MERCADO_PAGO",
        status: paymentStatus,
        amount: paymentDetails.transaction_amount,
        transactionId: paymentDetails.id?.toString(),
        payload: paymentDetails as any,
      },
      update: {
        status: paymentStatus,
        payload: paymentDetails as any,
      },
    });
  }
}

async function handleOrderPayment(
  orderId: string,
  paymentDetails: any,
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
) {
  console.log("[Webhook] Processing order payment:", orderId);

  // Update payment record
  await prisma.payment.upsert({
    where: {
      id: paymentDetails.id?.toString() || `mp_${Date.now()}`,
    },
    create: {
      orderId,
      provider: "MERCADO_PAGO",
      status: paymentStatus,
      amount: paymentDetails.transaction_amount,
      transactionId: paymentDetails.id?.toString(),
      payload: paymentDetails as any,
    },
    update: {
      status: paymentStatus,
      payload: paymentDetails as any,
    },
  });

  // Update order status based on payment
  const orderStatusMap: Record<string, "PENDING" | "PAID" | "CANCELED"> = {
    PAID: "PAID",
    FAILED: "CANCELED",
    PENDING: "PENDING",
    REFUNDED: "CANCELED",
  };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: orderStatusMap[paymentStatus] || "PENDING",
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Verify webhook endpoint
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Mercado Pago Webhook",
    timestamp: new Date().toISOString(),
  });
}
