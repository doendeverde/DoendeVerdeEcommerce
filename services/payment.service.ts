/**
 * Payment Service
 * 
 * Orchestrates payment operations using Mercado Pago.
 * Handles subscription and one-time payments.
 */

import {
  createPaymentPreference,
  isTestMode,
  type CreatePreferenceItem,
  type PreferenceResponse,
} from "@/lib/mercadopago";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionPaymentData {
  planId: string;
  planName: string;
  planDescription: string;
  price: number;
  userId: string;
  userEmail: string;
  userName?: string;
  orderId?: string;
  subscriptionId?: string;
}

export interface ProductPaymentData {
  items: Array<{
    productId: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
  userId: string;
  userEmail: string;
  userName?: string;
  orderId: string;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  isTestMode: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a payment preference for subscription checkout
 */
export async function createSubscriptionPayment(
  data: SubscriptionPaymentData
): Promise<PaymentPreferenceResult> {
  const items: CreatePreferenceItem[] = [
    {
      id: data.planId,
      title: `Assinatura ${data.planName}`,
      description: data.planDescription,
      quantity: 1,
      unit_price: data.price,
      currency_id: "BRL",
      category_id: "subscription",
    },
  ];

  const nameParts = data.userName?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const preference = await createPaymentPreference({
    items,
    payer: {
      name: firstName,
      surname: lastName,
      email: data.userEmail,
    },
    external_reference: data.subscriptionId || data.orderId || `sub_${data.userId}_${Date.now()}`,
    metadata: {
      type: "subscription",
      plan_id: data.planId,
      plan_name: data.planName,
      user_id: data.userId,
      order_id: data.orderId,
      subscription_id: data.subscriptionId,
    },
    statement_descriptor: "DOENDEVERDE CLUB",
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    isTestMode: isTestMode(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Payment (Cart Checkout)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a payment preference for product/cart checkout
 */
export async function createProductPayment(
  data: ProductPaymentData
): Promise<PaymentPreferenceResult> {
  const items: CreatePreferenceItem[] = data.items.map((item) => ({
    id: item.productId,
    title: item.name,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: "BRL",
    picture_url: item.imageUrl,
    category_id: "products",
  }));

  const nameParts = data.userName?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const preference = await createPaymentPreference({
    items,
    payer: {
      name: firstName,
      surname: lastName,
      email: data.userEmail,
    },
    external_reference: data.orderId,
    metadata: {
      type: "product",
      user_id: data.userId,
      order_id: data.orderId,
    },
    statement_descriptor: "DOENDEVERDE",
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    isTestMode: isTestMode(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PIX Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a PIX payment directly using Payment API
 * Returns QR code for immediate payment
 */
export interface PixPaymentResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  ticketUrl: string;
  expirationDate: Date;
}

export interface PixPaymentDirectData {
  amount: number;
  description: string;
  email: string;
  externalReference: string;
  firstName?: string;
  lastName?: string;
  identification?: {
    type: string;
    number: string;
  };
  phone?: string;
  items?: Array<{
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }>;
}

export async function createPixPaymentDirect(data: PixPaymentDirectData): Promise<PixPaymentResult> {
  // Validate and normalize amount (MP requires 2 decimal places max, > 0)
  const normalizedAmount = Math.round(data.amount * 100) / 100;
  
  if (normalizedAmount <= 0 || !Number.isFinite(normalizedAmount)) {
    throw new Error(`Invalid transaction_amount: ${data.amount} (normalized: ${normalizedAmount})`);
  }
  
  console.log("[PIX Payment] Creating with amount:", {
    original: data.amount,
    normalized: normalizedAmount,
    description: data.description,
    email: data.email,
  });

  // Import MP service for quality-enhanced payment
  const { createPixPayment: createMPPixPayment } = await import("./mercadopago.service");
  const { parsePhone } = await import("@/lib/mercadopago-quality");
  
  // Build request with quality fields
  const result = await createMPPixPayment({
    amount: normalizedAmount,
    description: data.description,
    externalReference: data.externalReference,
    payer: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      identification: data.identification,
      phone: parsePhone(data.phone),
    },
    items: data.items?.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to create PIX payment");
  }

  return {
    paymentId: result.paymentId || "",
    qrCode: result.qrCode || "",
    qrCodeBase64: result.qrCodeBase64 || "",
    pixCopyPaste: result.pixCopyPaste || "",
    ticketUrl: result.ticketUrl || "",
    expirationDate: result.expirationDate || new Date(Date.now() + 30 * 60 * 1000),
  };
}

/**
 * @deprecated Use createPixPaymentDirect instead
 */
export async function createPixPayment(data: {
  amount: number;
  description: string;
  userEmail: string;
  externalReference: string;
  firstName?: string;
  lastName?: string;
}) {
  return createPixPaymentDirect({
    amount: data.amount,
    description: data.description,
    email: data.userEmail,
    externalReference: data.externalReference,
    firstName: data.firstName,
    lastName: data.lastName,
  });
}
