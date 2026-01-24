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
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  PAUSED: {
    label: "Pausada",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    icon: <PauseCircle className="w-3.5 h-3.5" />,
  },
  CANCELED: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

/**
 * Badge visual para status de assinatura
 */
export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
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
