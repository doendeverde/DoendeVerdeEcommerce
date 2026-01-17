/**
 * Payment Repository
 * 
 * Database operations for payments.
 * Handles payment creation and status updates.
 */

import { prisma } from "@/lib/prisma";
import type { Payment, PaymentStatus, PaymentProvider, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePaymentData {
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  transactionId?: string;
  payload?: Prisma.JsonValue;
}

export type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: {
    order: {
      include: {
        user: { select: { id: true; email: true; fullName: true } };
      };
    };
  };
}>;

// ─────────────────────────────────────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find payment by ID
 */
export async function findPaymentById(paymentId: string): Promise<Payment | null> {
  return prisma.payment.findUnique({
    where: { id: paymentId },
  });
}

/**
 * Find payment by ID with order details
 */
export async function findPaymentWithOrder(paymentId: string): Promise<PaymentWithOrder | null> {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
  });
}

/**
 * Find payment by transaction ID (external gateway ID)
 */
export async function findPaymentByTransactionId(transactionId: string): Promise<Payment | null> {
  return prisma.payment.findFirst({
    where: { transactionId },
  });
}

/**
 * Find payments for an order
 */
export async function findOrderPayments(orderId: string): Promise<Payment[]> {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create a new payment record
 */
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  return prisma.payment.create({
    data: {
      orderId: data.orderId,
      provider: data.provider,
      amount: data.amount,
      status: "PENDING",
      transactionId: data.transactionId,
      payload: data.payload ?? undefined,
    },
  });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  additionalData?: { transactionId?: string; payload?: Prisma.JsonValue }
): Promise<Payment | null> {
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      ...(additionalData?.transactionId && { transactionId: additionalData.transactionId }),
      ...(additionalData?.payload && { payload: additionalData.payload }),
    },
  });
}

/**
 * Update payment by transaction ID (for webhook processing)
 */
export async function updatePaymentByTransactionId(
  transactionId: string,
  status: PaymentStatus,
  payload?: Prisma.JsonValue
): Promise<Payment | null> {
  const existing = await findPaymentByTransactionId(transactionId);
  if (!existing) return null;

  return prisma.payment.update({
    where: { id: existing.id },
    data: {
      status,
      ...(payload && { payload }),
    },
  });
}

/**
 * Mark payment as paid
 */
export async function markPaymentAsPaid(
  paymentId: string,
  transactionId?: string,
  payload?: Prisma.JsonValue
): Promise<Payment | null> {
  return updatePaymentStatus(paymentId, "PAID", { transactionId, payload });
}

/**
 * Mark payment as failed
 */
export async function markPaymentAsFailed(
  paymentId: string,
  payload?: Prisma.JsonValue
): Promise<Payment | null> {
  return updatePaymentStatus(paymentId, "FAILED", { payload });
}

/**
 * Get successful payment for order
 */
export async function getSuccessfulPayment(orderId: string): Promise<Payment | null> {
  return prisma.payment.findFirst({
    where: { orderId, status: "PAID" },
  });
}

/**
 * Check if order has successful payment
 */
export async function orderHasSuccessfulPayment(orderId: string): Promise<boolean> {
  const payment = await getSuccessfulPayment(orderId);
  return payment !== null;
}
