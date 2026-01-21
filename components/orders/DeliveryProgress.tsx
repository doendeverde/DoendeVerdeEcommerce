/**
 * Delivery Progress Component
 * 
 * Shows order/shipment progress as a visual progress bar.
 */

"use client";

import { Check, Package, Truck, Home, Clock, X } from "lucide-react";

type ShipmentStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RETURNED" | "LOST";

interface DeliveryProgressProps {
  status: ShipmentStatus;
  trackingCode?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}

const PROGRESS_STEPS = [
  { status: "PROCESSING", label: "Processando", icon: Package },
  { status: "SHIPPED", label: "Enviado", icon: Truck },
  { status: "IN_TRANSIT", label: "Em trânsito", icon: Truck },
  { status: "OUT_FOR_DELIVERY", label: "Saiu para entrega", icon: Truck },
  { status: "DELIVERED", label: "Entregue", icon: Home },
];

function getProgressPercentage(status: ShipmentStatus): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "PROCESSING":
      return 20;
    case "SHIPPED":
      return 40;
    case "IN_TRANSIT":
      return 60;
    case "OUT_FOR_DELIVERY":
      return 80;
    case "DELIVERED":
      return 100;
    case "RETURNED":
    case "LOST":
      return 0;
    default:
      return 0;
  }
}

function getStatusColor(status: ShipmentStatus): string {
  switch (status) {
    case "DELIVERED":
      return "text-green-600 bg-green-100";
    case "RETURNED":
    case "LOST":
      return "text-red-600 bg-red-100";
    case "PENDING":
      return "text-yellow-600 bg-yellow-100";
    default:
      return "text-blue-600 bg-blue-100";
  }
}

function getStatusLabel(status: ShipmentStatus): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "PROCESSING":
      return "Processando";
    case "SHIPPED":
      return "Enviado";
    case "IN_TRANSIT":
      return "Em trânsito";
    case "OUT_FOR_DELIVERY":
      return "Saiu para entrega";
    case "DELIVERED":
      return "Entregue";
    case "RETURNED":
      return "Devolvido";
    case "LOST":
      return "Extraviado";
    default:
      return status;
  }
}

export function DeliveryProgress({
  status,
  trackingCode,
  shippedAt,
  deliveredAt,
}: DeliveryProgressProps) {
  const progress = getProgressPercentage(status);
  const isCompleted = status === "DELIVERED";
  const hasError = status === "RETURNED" || status === "LOST";

  if (hasError) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <X className="w-5 h-5" />
          {status === "RETURNED"
            ? "O pedido foi devolvido ao remetente."
            : "O pedido foi extraviado. Entre em contato conosco."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status badge and tracking */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(status)}`}>
          {getStatusLabel(status)}
        </span>
        {trackingCode && (
          <span className="text-sm text-gray-500">
            Código: <span className="font-mono font-medium text-gray-900">{trackingCode}</span>
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-primary-green"
              }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="absolute right-0 -top-6 text-xs text-gray-500">
          {progress}%
        </span>
      </div>

      {/* Dates */}
      <div className="flex justify-between text-xs text-gray-500">
        {shippedAt && (
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Enviado em {new Date(shippedAt).toLocaleDateString("pt-BR")}
          </span>
        )}
        {deliveredAt && (
          <span className="flex items-center gap-1 text-green-600">
            <Check className="w-3 h-3" />
            Entregue em {new Date(deliveredAt).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );
}
