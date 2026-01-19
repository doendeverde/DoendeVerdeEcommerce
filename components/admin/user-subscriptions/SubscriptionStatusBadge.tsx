"use client";

import { CheckCircle, PauseCircle, XCircle } from "lucide-react";

interface SubscriptionStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  ACTIVE: {
    label: "Ativa",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  PAUSED: {
    label: "Pausada",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <PauseCircle className="w-3.5 h-3.5" />,
  },
  CANCELED: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

/**
 * Badge visual para status de assinatura
 */
export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
