/**
 * Order Card Component
 *
 * Displays a single order with compact view and expandable details.
 * Compact view: product image, name, quantity, total, date, status
 * Expanded: full details with payment, delivery, and address
 */

"use client";

import { useState } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Truck,
  MapPin,
  Calendar,
  Clock,
  XCircle,
  PackageCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeliveryProgress } from "./DeliveryProgress";
import { OrderPixPayment, PixPendingBadge } from "./OrderPixPayment";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
  };
}

interface Payment {
  id: string;
  status: string;
  provider: string;
  amount: number;
  transactionId?: string | null;
  pixQrCode?: string | null;
  pixQrCodeBase64?: string | null;
  pixTicketUrl?: string | null;
  pixExpiresAt?: Date | null;
}

interface Shipment {
  id: string;
  status: string;
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

interface AddressSnapshot {
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderData {
  id: string;
  status: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  createdAt: Date;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
  addressSnapshot: AddressSnapshot | null;
}


interface OrderCardProps {
  order: OrderData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Configuration - Using actual OrderStatus enum values from Prisma
// PENDING | PAID | CANCELED | SHIPPED | DELIVERED
// ─────────────────────────────────────────────────────────────────────────────

type OrderStatusType = "PENDING" | "PAID" | "CANCELED" | "SHIPPED" | "DELIVERED";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const ORDER_STATUS_CONFIG: Record<OrderStatusType, StatusConfig> = {
  PENDING: {
    label: "Aguardando Pagamento",
    color: "text-yellow-text",
    bgColor: "bg-yellow-bg",
    icon: <Clock className="w-4 h-4" />,
  },
  PAID: {
    label: "Pago",
    color: "text-blue-text",
    bgColor: "bg-blue-bg",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  SHIPPED: {
    label: "Enviado",
    color: "text-purple-text",
    bgColor: "bg-purple-bg",
    icon: <Truck className="w-4 h-4" />,
  },
  DELIVERED: {
    label: "Entregue",
    color: "text-green-text",
    bgColor: "bg-green-bg",
    icon: <PackageCheck className="w-4 h-4" />,
  },
  CANCELED: {
    label: "Cancelado",
    color: "text-red-text",
    bgColor: "bg-red-bg",
    icon: <XCircle className="w-4 h-4" />,
  },
};

function getStatusConfig(status: string): StatusConfig {
  return (
    ORDER_STATUS_CONFIG[status as OrderStatusType] || {
      label: status,
      color: "text-text-secondary",
      bgColor: "bg-gray-bg",
      icon: <Loader2 className="w-4 h-4" />,
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPaymentMethodLabel(provider: string | undefined | null): string {
  if (!provider) return "Não informado";
  const lowerProvider = provider.toLowerCase();
  if (lowerProvider.includes("pix")) return "PIX";
  if (lowerProvider.includes("mercado")) return "Mercado Pago";
  if (lowerProvider.includes("stripe")) return "Cartão";
  return provider;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const payment = order.payments[0];
  const shipment = order.shipments[0];

  // Check if order has pending PIX payment
  const hasPendingPix =
    order.status === "PENDING" &&
    payment?.provider === "MERCADO_PAGO" &&
    payment?.pixQrCode;

  // Calculate totals
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const firstProduct = order.items[0];
  const hasMultipleProducts = order.items.length > 1;

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-default overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Compact View - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:ring-inset"
      >
        <div className="p-4 sm:p-5">
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Product Image */}
            <div className="w-20 h-20 bg-gray-bg rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {firstProduct?.product.images?.[0]?.url ? (
                <img
                  src={firstProduct.product.images[0].url}
                  alt={firstProduct.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Order Info */}
            <div className="flex-1 min-w-0">
              {/* Product Name(s) */}
              <h3 className="text-lg font-semibold text-text-primary truncate">
                {firstProduct?.product.name || "Pedido"}
                {hasMultipleProducts && (
                  <span className="text-text-secondary font-normal text-sm ml-2">
                    +{order.items.length - 1} {order.items.length === 2 ? "item" : "itens"}
                  </span>
                )}
              </h3>

              {/* Quantity and Date */}
              <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {totalItems} {totalItems === 1 ? "item" : "itens"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="text-right">
              <p className="text-xs text-muted">Total</p>
              <p className="text-xl font-bold text-primary-green">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>

            {/* PIX Badge - Desktop */}
            {hasPendingPix && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPixModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-bg text-green-text rounded-lg text-sm font-medium hover:bg-green-bg-hover transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Pagar PIX
              </button>
            )}

            {/* Status Badge */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium min-w-[140px] justify-center",
                statusConfig.bgColor,
                statusConfig.color
              )}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>

            {/* Expand Icon */}
            <div className="text-gray-400">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden space-y-3">
            {/* Top Row: Image, Info, Expand */}
            <div className="flex items-start gap-3">
              {/* Product Image */}
              <div className="w-16 h-16 bg-gray-bg rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {firstProduct?.product.images?.[0]?.url ? (
                  <img
                    src={firstProduct.product.images[0].url}
                    alt={firstProduct.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Order Info */}
              <div className="flex-1 min-w-0">
                {/* Product Name(s) */}
                <h3 className="text-sm font-semibold text-text-primary line-clamp-2">
                  {firstProduct?.product.name || "Pedido"}
                  {hasMultipleProducts && (
                    <span className="text-text-secondary font-normal ml-1">
                      +{order.items.length - 1}
                    </span>
                  )}
                </h3>

                {/* Meta Info */}
                <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {totalItems}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Total */}
                <p className="mt-1.5 text-base font-bold text-primary-green">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>

              {/* Expand Icon */}
              <div className="text-gray-400 mt-1">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Bottom Row: Status and PIX Button */}
            <div className="flex items-center gap-2">
              {/* Status Badge - Full width on mobile */}
              <div
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium flex-1",
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                {statusConfig.icon}
                <span className="truncate">{statusConfig.label}</span>
              </div>

              {/* PIX Button - Mobile */}
              {hasPendingPix && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPixModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-bg text-green-text rounded-lg text-xs font-medium hover:bg-green-bg-hover transition-colors whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Pagar
                </button>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t border-gray-border">
          {/* All Products */}
          <div className="p-5 bg-gray-bg/50">
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos do pedido
            </h4>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-card-bg rounded-lg border border-gray-border"
                >
                  {/* Image */}
                  <div className="w-12 h-12 bg-gray-bg rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product.images?.[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.quantity}x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="font-semibold text-text-primary text-sm">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Delivery Grid */}
          <div className="grid md:grid-cols-2 border-t border-gray-border">
            {/* Payment */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-gray-border">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamento
              </h4>

              {payment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Método:</span>
                    <span className="font-medium text-text-primary">
                      {getPaymentMethodLabel(payment.provider)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal:</span>
                    <span className="text-text-primary">
                      {formatCurrency(order.subtotalAmount)}
                    </span>
                  </div>
                  {order.shippingAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Frete:</span>
                      <span className="text-text-primary">
                        {formatCurrency(order.shippingAmount)}
                      </span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-border">
                    <span className="font-semibold text-text-primary">Total:</span>
                    <span className="font-bold text-primary-green">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Aguardando pagamento</p>
              )}
            </div>

            {/* Delivery */}
            <div className="p-5">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Entrega
              </h4>

              {shipment ? (
                <DeliveryProgress
                  status={shipment.status as any}
                  trackingCode={shipment.trackingCode}
                  shippedAt={shipment.shippedAt}
                  deliveredAt={shipment.deliveredAt}
                />
              ) : order.status === "PENDING" ? (
                <p className="text-sm text-text-secondary">Aguardando pagamento</p>
              ) : order.status === "PAID" ? (
                <p className="text-sm text-text-secondary">Preparando para envio</p>
              ) : (
                <p className="text-sm text-text-secondary">—</p>
              )}
            </div>
          </div>

          {/* Address */}
          {order.addressSnapshot && (
            <div className="p-5 bg-gray-bg/50 border-t border-gray-border">
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço de entrega
              </h4>
              <p className="text-sm text-text-secondary">
                {order.addressSnapshot.street}, {order.addressSnapshot.number}
                {order.addressSnapshot.complement &&
                  ` - ${order.addressSnapshot.complement}`}
              </p>
              <p className="text-sm text-text-secondary">
                {order.addressSnapshot.neighborhood} - {order.addressSnapshot.city}/
                {order.addressSnapshot.state}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                CEP: {order.addressSnapshot.zipCode}
              </p>
            </div>
          )}

          {/* PIX Payment Button - Show when order has pending PIX */}
          {hasPendingPix && (
            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 googletag.7 googletag7 353.7 411.5L searching.5 334.5C searching1 329.1 searching1 319.8 searching.5 314.4L262.5 219.5C257.1 214.1 247.8 214.1 242.4 219.5L165.4 296.5C151.2 310.7 151.2 333.3 165.4 347.5L242.4 424.5C247.8 429.9 257.1 429.9 262.5 424.5L339.5 347.5C353.7 333.3 353.7 310.7 339.5 296.5L314.4 271.4" />
                    </svg>
                    Pagamento PIX Pendente
                  </h4>
                  <p className="text-xs text-green-600 mt-1">
                    Clique para visualizar o QR Code e finalizar o pagamento
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPixModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Pagar com PIX
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIX Payment Modal */}
      {showPixModal && payment && (
        <OrderPixPayment
          orderId={order.id}
          paymentId={payment.id}
          amount={order.totalAmount}
          qrCode={payment.pixQrCode || null}
          qrCodeBase64={payment.pixQrCodeBase64 || null}
          ticketUrl={payment.pixTicketUrl || null}
          expiresAt={payment.pixExpiresAt || null}
          transactionId={payment.transactionId || null}
          onClose={() => setShowPixModal(false)}
        />
      )}
    </div>
  );
}
