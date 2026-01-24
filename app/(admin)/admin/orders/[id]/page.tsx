import { adminService } from "@/services/admin.service";
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatusUpdater } from "./OrderStatusUpdater";
import { cn } from "@/lib/utils";
import { PaymentStatus, ShipmentStatus, PaymentProvider } from "@prisma/client";
import { ApprovePaymentButton } from "@/components/admin/orders/ApprovePaymentButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Types for order details
interface OrderItem {
  id: string;
  title: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
  product: {
    name: string;
    slug: string;
  };
}

interface OrderPayment {
  id: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId: string | null;
  amount: number;
}

interface OrderShipment {
  id: string;
  status: ShipmentStatus;
  carrier: string | null;
  trackingCode: string | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELED: "Cancelado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
};

const shipmentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  LABEL_CREATED: "Etiqueta criada",
  IN_TRANSIT: "Em trânsito",
  DELIVERED: "Entregue",
  LOST: "Extraviado",
  RETURNED: "Devolvido",
};

/**
 * Página de detalhes do pedido (Admin)
 */
export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await adminService.getOrderById(id);

  if (!order) {
    notFound();
  }

  // Type cast for items, payments, shipments
  const items = order.items as OrderItem[];
  const payments = order.payments as OrderPayment[];
  const shipments = order.shipments as OrderShipment[];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para pedidos
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Criado em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-surface rounded-xl border border-default overflow-hidden">
            <div className="p-4 border-b border-default">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Package className="w-5 h-5" />
                Itens do Pedido
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item: OrderItem) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-bg rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-text-secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      target="_blank"
                      className="text-sm font-medium text-text-primary hover:text-primary-purple"
                    >
                      {item.title}
                    </Link>
                    {item.sku && (
                      <p className="text-xs text-text-secondary">SKU: {item.sku}</p>
                    )}
                    <p className="text-sm text-text-secondary mt-1">
                      {item.quantity}x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text-primary">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-4 bg-gray-bg/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">{formatCurrency(order.subtotalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Desconto</span>
                  <span className="text-primary-green">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Frete</span>
                <span className="text-text-primary">
                  {order.shippingAmount > 0 ? formatCurrency(order.shippingAmount) : "Grátis"}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-default">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          {payments.length > 0 && (
            <div className="bg-surface rounded-xl border border-default overflow-hidden">
              <div className="p-4 border-b border-default">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pagamento
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {payments.map((payment: OrderPayment) => (
                  <div key={payment.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {payment.provider.replace("_", " ")}
                      </p>
                      {payment.transactionId && (
                        <p className="text-xs text-text-secondary font-mono">
                          ID: {payment.transactionId}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            payment.status === "PAID"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {paymentStatusLabels[payment.status]}
                        </span>
                      </div>
                      {/* Botão para aprovar pagamento manualmente (só aparece se PENDING) */}
                      {payment.status === "PENDING" && (
                        <ApprovePaymentButton
                          orderId={order.id}
                          paymentId={payment.id}
                          transactionId={payment.transactionId}
                          currentStatus={payment.status}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipment */}
          {shipments.length > 0 && (
            <div className="bg-surface rounded-xl border border-default overflow-hidden">
              <div className="p-4 border-b border-default">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Envio
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {shipments.map((shipment: OrderShipment) => (
                  <div key={shipment.id}>
                    <div className="flex justify-between items-center">
                      <div>
                        {shipment.carrier && (
                          <p className="text-sm font-medium text-text-primary">
                            {shipment.carrier}
                          </p>
                        )}
                        {shipment.trackingCode && (
                          <p className="text-xs text-text-secondary font-mono">
                            Rastreio: {shipment.trackingCode}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          shipment.status === "DELIVERED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : shipment.status === "IN_TRANSIT"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        )}
                      >
                        {shipmentStatusLabels[shipment.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-surface rounded-xl border border-default overflow-hidden">
            <div className="p-4 border-b border-default">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <User className="w-5 h-5" />
                Cliente
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-text-primary">
                {order.user.fullName}
              </p>
              <p className="text-sm text-text-secondary">{order.user.email}</p>
              {order.user.whatsapp && (
                <p className="text-sm text-text-secondary">{order.user.whatsapp}</p>
              )}
              <Link
                href={`/admin/users/${order.user.id}`}
                className="text-sm text-primary-purple hover:underline inline-block mt-2"
              >
                Ver perfil completo
              </Link>
            </div>
          </div>

          {/* Shipping Address */}
          {order.addressSnapshot && (
            <div className="bg-surface rounded-xl border border-default overflow-hidden">
              <div className="p-4 border-b border-default">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço de Entrega
                </h2>
              </div>
              <div className="p-4 space-y-1 text-sm">
                <p className="font-medium text-text-primary">
                  {order.addressSnapshot.fullName}
                </p>
                <p className="text-text-secondary">
                  {order.addressSnapshot.street}, {order.addressSnapshot.number}
                  {order.addressSnapshot.complement && ` - ${order.addressSnapshot.complement}`}
                </p>
                <p className="text-text-secondary">
                  {order.addressSnapshot.neighborhood}
                </p>
                <p className="text-text-secondary">
                  {order.addressSnapshot.city} - {order.addressSnapshot.state}
                </p>
                <p className="text-text-secondary">
                  CEP: {order.addressSnapshot.zipCode}
                </p>
                {order.addressSnapshot.whatsapp && (
                  <p className="text-text-secondary mt-2">
                    Tel: {order.addressSnapshot.whatsapp}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-surface rounded-xl border border-default overflow-hidden">
              <div className="p-4 border-b border-default">
                <h2 className="text-lg font-semibold text-text-primary">
                  Observações
                </h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
