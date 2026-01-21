/**
 * Order Card Component
 * 
 * Displays a single order with all details, products, payment and delivery info.
 * Follows the design from the image reference.
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
  Check,
  Clock
} from "lucide-react";
import { DeliveryProgress } from "./DeliveryProgress";

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
  method?: string;
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatOrderNumber(id: string): string {
  // Format: #ORD-YYYY-XXX
  const year = new Date().getFullYear();
  const shortId = id.slice(0, 3).toUpperCase();
  return `#ORD-${year}-${shortId}`;
}

function getStatusConfig(status: string): { label: string; color: string; bgColor: string } {
  switch (status) {
    case "PENDING":
      return { label: "Pendente", color: "text-yellow-700", bgColor: "bg-yellow-100" };
    case "CONFIRMED":
      return { label: "Confirmado", color: "text-blue-700", bgColor: "bg-blue-100" };
    case "PROCESSING":
      return { label: "Processando", color: "text-blue-700", bgColor: "bg-blue-100" };
    case "SHIPPED":
      return { label: "Enviado", color: "text-indigo-700", bgColor: "bg-indigo-100" };
    case "DELIVERED":
      return { label: "Entregue", color: "text-green-700", bgColor: "bg-green-100" };
    case "CANCELED":
      return { label: "Cancelado", color: "text-red-700", bgColor: "bg-red-100" };
    default:
      return { label: status, color: "text-gray-700", bgColor: "bg-gray-100" };
  }
}

function getPaymentMethodLabel(method: string | undefined, provider: string): string {
  if (method === "pix" || provider.toLowerCase().includes("pix")) return "PIX";
  if (method === "credit_card") return "Cartão de Crédito";
  if (method === "debit_card") return "Cartão de Débito";
  return provider || "Não informado";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const payment = order.payments[0];
  const shipment = order.shipments[0];

  const formattedDate = new Date(order.createdAt).toLocaleDateString("pt-BR");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Order Number */}
            <div>
              <p className="text-xs text-gray-500">Pedido</p>
              <p className="font-semibold text-gray-900">{formatOrderNumber(order.id)}</p>
            </div>

            {/* Date */}
            <div>
              <p className="text-xs text-gray-500">Data</p>
              <p className="font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </p>
            </div>

            {/* Total */}
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-primary-green">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            {order.status === "DELIVERED" && <Check className="w-4 h-4" />}
            {order.status === "PENDING" && <Clock className="w-4 h-4" />}
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Products */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          Produtos
        </h4>

        <div className="space-y-3">
          {order.items.slice(0, isExpanded ? undefined : 2).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              {/* Product Image */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.product.images?.[0]?.url ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.product.name}
                </p>
                <p className="text-sm text-gray-500">
                  Quantidade: {item.quantity}
                </p>
              </div>

              {/* Price */}
              <p className="font-medium text-gray-900">
                {formatCurrency(item.totalPrice)}
              </p>
            </div>
          ))}

          {/* Show more button */}
          {order.items.length > 2 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 text-sm text-primary-green hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {isExpanded ? (
                <>
                  Ver menos <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver todos os {order.items.length} itens <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Payment & Delivery Grid */}
      <div className="grid md:grid-cols-2 gap-px bg-gray-100">
        {/* Payment */}
        <div className="bg-white p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            Pagamento
          </h4>

          {payment ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Método:</span>
                <span className="font-medium text-gray-900">
                  {getPaymentMethodLabel(payment.method, payment.provider)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-700">{formatCurrency(order.subtotalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-medium text-gray-900">Total:</span>
                <span className="font-semibold text-primary-green">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aguardando pagamento</p>
          )}
        </div>

        {/* Delivery */}
        <div className="bg-white p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            Entrega
          </h4>

          {shipment ? (
            <DeliveryProgress
              status={shipment.status as any}
              trackingCode={shipment.trackingCode}
              shippedAt={shipment.shippedAt}
              deliveredAt={shipment.deliveredAt}
            />
          ) : (
            <p className="text-sm text-gray-500">Aguardando envio</p>
          )}
        </div>
      </div>

      {/* Address */}
      {order.addressSnapshot && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            Endereço de entrega
          </h4>
          <p className="text-sm text-gray-600">
            {order.addressSnapshot.street}, {order.addressSnapshot.number}
            {order.addressSnapshot.complement && ` - ${order.addressSnapshot.complement}`}
          </p>
          <p className="text-sm text-gray-600">
            {order.addressSnapshot.neighborhood} - {order.addressSnapshot.city}/
            {order.addressSnapshot.state}
          </p>
          <p className="text-sm text-gray-500">
            CEP: {order.addressSnapshot.zipCode}
          </p>
        </div>
      )}
    </div>
  );
}
