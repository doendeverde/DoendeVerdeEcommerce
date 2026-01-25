/**
 * Badge Component
 *
 * Componente de badge para status, tags e indicadores.
 * Usa tokens semânticos de tema para consistência.
 *
 * @example
 * // Success badge
 * <Badge variant="success">Ativo</Badge>
 *
 * // With icon
 * <Badge variant="warning" icon={<AlertTriangle />}>Pendente</Badge>
 *
 * // Pill style
 * <Badge variant="info" pill>Novo</Badge>
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "premium";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Icon to show before text */
  icon?: ReactNode;
  /** Pill style (more rounded) */
  pill?: boolean;
  /** Additional class names */
  className?: string;
  /** Badge content */
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const baseStyles = "inline-flex items-center gap-1 font-medium";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-bg text-text-secondary border border-gray-border",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  error: "bg-error-bg text-error-text",
  info: "bg-info-bg text-info-text",
  premium: "bg-premium-bg text-premium-text",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function Badge({
  variant = "default",
  size = "md",
  icon,
  pill = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        pill ? "rounded-full" : "rounded-md",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge (Specialized)
// ─────────────────────────────────────────────────────────────────────────────

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "error";

const statusConfig: Record<StatusType, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Ativo" },
  inactive: { variant: "default", label: "Inativo" },
  pending: { variant: "warning", label: "Pendente" },
  processing: { variant: "info", label: "Processando" },
  completed: { variant: "success", label: "Concluído" },
  cancelled: { variant: "error", label: "Cancelado" },
  error: { variant: "error", label: "Erro" },
};

export interface StatusBadgeProps {
  /** Status type */
  status: StatusType;
  /** Custom label (overrides default) */
  label?: string;
  /** Size of the badge */
  size?: BadgeSize;
  /** Pill style */
  pill?: boolean;
  /** Additional class names */
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "md",
  pill = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      pill={pill}
      className={className}
    >
      {label || config.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Status Badge
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

const orderStatusConfig: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: "warning", label: "Pendente" },
  PAID: { variant: "info", label: "Pago" },
  SHIPPED: { variant: "premium", label: "Enviado" },
  DELIVERED: { variant: "success", label: "Entregue" },
  CANCELED: { variant: "error", label: "Cancelado" },
};

export interface OrderStatusBadgeProps {
  /** Order status */
  status: OrderStatus;
  /** Size of the badge */
  size?: BadgeSize;
  /** Additional class names */
  className?: string;
}

export function OrderStatusBadge({
  status,
  size = "md",
  className,
}: OrderStatusBadgeProps) {
  const config = orderStatusConfig[status] || {
    variant: "default" as BadgeVariant,
    label: status,
  };

  return (
    <Badge variant={config.variant} size={size} pill className={className}>
      {config.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Status Badge
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELED" | "EXPIRED";

const subscriptionStatusConfig: Record<
  SubscriptionStatus,
  { variant: BadgeVariant; label: string }
> = {
  ACTIVE: { variant: "success", label: "Ativa" },
  PAUSED: { variant: "warning", label: "Pausada" },
  CANCELED: { variant: "error", label: "Cancelada" },
  EXPIRED: { variant: "default", label: "Expirada" },
};

export interface SubscriptionStatusBadgeProps {
  /** Subscription status */
  status: SubscriptionStatus;
  /** Size of the badge */
  size?: BadgeSize;
  /** Additional class names */
  className?: string;
}

export function SubscriptionStatusBadge({
  status,
  size = "md",
  className,
}: SubscriptionStatusBadgeProps) {
  const config = subscriptionStatusConfig[status] || {
    variant: "default" as BadgeVariant,
    label: status,
  };

  return (
    <Badge variant={config.variant} size={size} pill className={className}>
      {config.label}
    </Badge>
  );
}
