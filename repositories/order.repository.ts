/**
 * Order Repository
 * 
 * Database operations for orders.
 * Handles order creation, status updates, and queries.
 */

import { prisma } from "@/lib/prisma";
import type { Order, OrderItem, OrderStatus, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateOrderData {
  userId: string;
  subtotalAmount: number;
  discountAmount?: number;
  shippingAmount?: number;
  totalAmount: number;
  notes?: string;
  /** Shipping data to persist with the order */
  shippingData?: Record<string, unknown> | null;
}

export interface CreateOrderItemData {
  productId: string;
  variantId?: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderAddressSnapshotData {
  fullName: string;
  whatsapp: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payments: true;
    addressSnapshot: true;
    discounts: { include: { coupon: true } };
  };
}>;

// ─────────────────────────────────────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find order by ID
 */
export async function findOrderById(orderId: string): Promise<OrderWithRelations | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      addressSnapshot: true,
      discounts: { include: { coupon: true } },
    },
  });
}

/**
 * Find order by ID (ensuring it belongs to user)
 */
export async function findUserOrderById(
  orderId: string,
  userId: string
): Promise<OrderWithRelations | null> {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      payments: true,
      addressSnapshot: true,
      discounts: { include: { coupon: true } },
    },
  });
}

/**
 * Find user orders with pagination
 */
export async function findUserOrders(
  userId: string,
  options: { page?: number; limit?: number; status?: OrderStatus } = {}
): Promise<{ orders: OrderWithRelations[]; total: number }> {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = { userId };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        addressSnapshot: true,
        discounts: { include: { coupon: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

/**
 * Create a new order with items and address snapshot
 */
export async function createOrder(
  orderData: CreateOrderData,
  items: CreateOrderItemData[],
  addressSnapshot: CreateOrderAddressSnapshotData
): Promise<OrderWithRelations> {
  return prisma.order.create({
    data: {
      userId: orderData.userId,
      subtotalAmount: orderData.subtotalAmount,
      discountAmount: orderData.discountAmount || 0,
      shippingAmount: orderData.shippingAmount || 0,
      totalAmount: orderData.totalAmount,
      notes: orderData.notes,
      shippingData: orderData.shippingData ? JSON.parse(JSON.stringify(orderData.shippingData)) : undefined,
      items: {
        create: items,
      },
      addressSnapshot: {
        create: {
          ...addressSnapshot,
          country: addressSnapshot.country || "BR",
        },
      },
    },
    include: {
      items: true,
      payments: true,
      addressSnapshot: true,
      discounts: { include: { coupon: true } },
    },
  });
}

/**
 * Create order for subscription (simplified - 1 item)
 */
export async function createSubscriptionOrder(
  userId: string,
  planId: string,
  planName: string,
  planPrice: number,
  addressSnapshot: CreateOrderAddressSnapshotData,
  shippingAmount: number = 0,
  shippingData?: Record<string, unknown> | null
): Promise<OrderWithRelations> {
  const totalAmount = planPrice + shippingAmount;
  
  return createOrder(
    {
      userId,
      subtotalAmount: planPrice,
      discountAmount: 0,
      shippingAmount,
      totalAmount,
      notes: `Assinatura: ${planName}`,
      shippingData,
    },
    [
      {
        productId: planId, // Using planId as "productId" for subscription orders
        title: `Assinatura ${planName}`,
        quantity: 1,
        unitPrice: planPrice,
        totalPrice: planPrice,
      },
    ],
    addressSnapshot
  );
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order | null> {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

/**
 * Mark order as paid
 */
export async function markOrderAsPaid(orderId: string): Promise<Order | null> {
  return updateOrderStatus(orderId, "PAID");
}

/**
 * Mark order as canceled
 */
export async function cancelOrder(orderId: string): Promise<Order | null> {
  return updateOrderStatus(orderId, "CANCELED");
}

/**
 * Get order status by ID
 */
export async function getOrderStatus(orderId: string): Promise<OrderStatus | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  return order?.status || null;
}

/**
 * Check if order belongs to user
 */
export async function orderBelongsToUser(
  orderId: string,
  userId: string
): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true },
  });
  return order !== null;
}
