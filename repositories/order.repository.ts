/**
 * Order Repository
 * 
 * Database operations for orders.
 * Handles order creation, status updates, and queries.
 */

import { prisma } from "@/lib/prisma";
import type { Order, OrderItem, OrderStatus, Prisma } from "@prisma/client";
import type { CreateOrderShippingInfoData } from "@/types/shipping";

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
  /** Shipping data to persist with the order (JSON blob - legacy) */
  shippingData?: Record<string, unknown> | null;
  /** Structured shipping info (new) */
  shippingInfo?: CreateOrderShippingInfoData;
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
    shippingInfo: true;
    discounts: { include: { coupon: true } };
  };
}>;

// Default include for queries
const orderInclude = {
  items: true,
  payments: true,
  addressSnapshot: true,
  shippingInfo: true,
  discounts: { include: { coupon: true } },
} satisfies Prisma.OrderInclude;

// ─────────────────────────────────────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find order by ID
 */
export async function findOrderById(orderId: string): Promise<OrderWithRelations | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
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
    include: orderInclude,
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
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

/**
 * Create a new order with items, address snapshot, and optional shipping info
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
      // Create structured shipping info if provided
      ...(orderData.shippingInfo && {
        shippingInfo: {
          create: {
            carrier: orderData.shippingInfo.carrier,
            serviceCode: orderData.shippingInfo.serviceCode,
            serviceName: orderData.shippingInfo.serviceName,
            estimatedDays: orderData.shippingInfo.estimatedDays,
            shippingCost: orderData.shippingInfo.shippingCost,
            packageWeight: orderData.shippingInfo.packageWeight,
            packageDimensions: orderData.shippingInfo.packageDimensions
              ? JSON.parse(JSON.stringify(orderData.shippingInfo.packageDimensions))
              : undefined,
            quotedAt: orderData.shippingInfo.quotedAt,
          },
        },
      }),
    },
    include: orderInclude,
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
  shippingData?: Record<string, unknown> | null,
  shippingInfo?: CreateOrderShippingInfoData
): Promise<OrderWithRelations> {
  console.log("[Order Repository] Creating subscription order...");
  console.log("[Order Repository] Plan ID:", planId);
  console.log("[Order Repository] Plan Name:", planName);
  
  const totalAmount = Math.round((planPrice + shippingAmount) * 100) / 100;
  
  // Para assinaturas, não criamos OrderItem porque não há productId real
  // O planId não está na tabela Product, então não podemos usar como productId
  // A informação da assinatura fica em order.notes e metadata
  console.log("[Order Repository] Creating order WITHOUT items (subscription-only)");
  
  return createOrder(
    {
      userId,
      subtotalAmount: planPrice,
      discountAmount: 0,
      shippingAmount,
      totalAmount,
      notes: `Assinatura: ${planName} (Plan ID: ${planId})`,
      shippingData,
      shippingInfo,
    },
    [], // SEM items - assinatura não tem produto físico associado
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

/**
 * Create order for subscription renewal (automatically triggered by webhook)
 * 
 * This is called when Mercado Pago processes a recurring payment.
 * Creates a minimal order record for accounting/reconciliation purposes.
 */
export async function createRenewalOrder(data: {
  userId: string;
  planName: string;
  amount: number;
  mpPaymentId: string;
  subscriptionId: string;
}): Promise<OrderWithRelations> {
  console.log("[Order Repository] Creating renewal order...");
  console.log("[Order Repository] User:", data.userId);
  console.log("[Order Repository] Plan:", data.planName);
  console.log("[Order Repository] Amount:", data.amount);
  console.log("[Order Repository] MP Payment ID:", data.mpPaymentId);
  
  // Para renovações, criamos uma order simplificada
  // O endereço é obtido do usuário (mais recente ou padrão)
  const userAddress = await prisma.address.findFirst({
    where: { userId: data.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  // Cria order com dados mínimos
  return prisma.order.create({
    data: {
      userId: data.userId,
      subtotalAmount: data.amount,
      discountAmount: 0,
      shippingAmount: 0, // Renovação não tem frete novo
      totalAmount: data.amount,
      status: "PAID", // Já está pago (veio do webhook)
      notes: `Renovação automática: ${data.planName} (Subscription ID: ${data.subscriptionId}, MP Payment: ${data.mpPaymentId})`,
      // Cria snapshot de endereço se existir
      ...(userAddress && {
        addressSnapshot: {
          create: {
            fullName: "", // Será preenchido pelo user se necessário
            whatsapp: "",
            street: userAddress.street,
            number: userAddress.number,
            complement: userAddress.complement || undefined,
            neighborhood: userAddress.neighborhood,
            city: userAddress.city,
            state: userAddress.state,
            zipCode: userAddress.zipCode,
            country: userAddress.country,
          },
        },
      }),
    },
    include: orderInclude,
  });
}
