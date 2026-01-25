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
    className: "bg-green-bg text-green-text border-green-border",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  PAUSED: {
    label: "Pausada",
    className: "bg-yellow-bg text-yellow-text border-yellow-border",
    icon: <PauseCircle className="w-3.5 h-3.5" />,
  },
  CANCELED: {
    label: "Cancelada",
    className: "bg-red-bg text-red-text border-red-border",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

/**
 * Badge visual para status de assinatura
 */
export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-bg text-muted border-default",
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
