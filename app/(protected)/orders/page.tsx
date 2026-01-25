/**
 * Orders Page
 * 
 * User order history with filtering and detailed view.
 * Server component that fetches data and passes to client components.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userService } from "@/services";
import { OrdersHeader } from "@/components/orders/OrdersHeader";
import { OrdersList } from "@/components/orders/OrdersList";

export const metadata = {
  title: "Minhas Compras | Doende HeadShop",
  description: "Acompanhe todos os seus pedidos e histórico de compras",
};

// Helper to convert Decimal to number
function convertDecimalToNumber(value: { toNumber?: () => number } | number): number {
  if (typeof value === "number") return value;
  return value?.toNumber?.() ?? 0;
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ordersData = await userService.getUserOrdersWithImages(session.user.id);

  // Convert Decimal values to numbers for client components
  const orders = ordersData.map((order) => ({
    id: order.id,
    status: order.status,
    totalAmount: convertDecimalToNumber(order.totalAmount),
    subtotalAmount: convertDecimalToNumber(order.subtotalAmount),
    discountAmount: convertDecimalToNumber(order.discountAmount),
    shippingAmount: convertDecimalToNumber(order.shippingAmount),
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: convertDecimalToNumber(item.unitPrice),
      totalPrice: convertDecimalToNumber(item.totalPrice),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        images: item.product.images,
      },
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      status: payment.status,
      provider: payment.provider,
      amount: convertDecimalToNumber(payment.amount),
      transactionId: payment.transactionId,
      pixQrCode: payment.pixQrCode,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      pixTicketUrl: payment.pixTicketUrl,
      pixExpiresAt: payment.pixExpiresAt,
    })),
    shipments: order.shipments.map((shipment) => ({
      id: shipment.id,
      status: shipment.status,
      carrier: shipment.carrier,
      trackingCode: shipment.trackingCode,
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
    })),
    addressSnapshot: order.addressSnapshot,
  }));

  return (
    <div className="page-content">
      {/* Header with gradient */}
      <OrdersHeader totalOrders={orders.length} />

      {/* Orders list with filters */}
      <OrdersList initialOrders={orders} />
    </div>
  );
}
