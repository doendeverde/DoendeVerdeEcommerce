/**
 * Card Component
 *
 * Componente de card para containers de conteúdo.
 * Usa tokens de tema para consistência.
 *
 * @example
 * // Basic card
 * <Card>Content here</Card>
 *
 * // Elevated card
 * <Card variant="elevated">Highlighted content</Card>
 *
 * // Interactive card
 * <Card variant="interactive" onClick={handleClick}>Click me</Card>
 *
 * // With header
 * <Card header={<CardHeader title="Title" />}>Content</Card>
 */

import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CardVariant = "default" | "elevated" | "interactive" | "outline";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Optional header */
  header?: ReactNode;
  /** Optional footer */
  footer?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Card content */
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const baseStyles = cn(
  "bg-card-bg rounded-xl",
  "border border-gray-border"
);

const variantStyles: Record<CardVariant, string> = {
  default: "",
  elevated: "shadow-sm",
  interactive: cn(
    "shadow-sm transition-all duration-200",
    "hover:shadow-md hover:-translate-y-0.5",
    "cursor-pointer"
  ),
  outline: "bg-transparent",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function Card({
  variant = "default",
  padding = "md",
  header,
  footer,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        !header && !footer && paddingStyles[padding],
        className
      )}
      {...props}
    >
      {header && (
        <div className={cn("border-b border-gray-border", paddingStyles[padding])}>
          {header}
        </div>
      )}

      <div className={cn((header || footer) && paddingStyles[padding])}>
        {children}
      </div>

      {footer && (
        <div className={cn("border-t border-gray-border", paddingStyles[padding])}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Header
// ─────────────────────────────────────────────────────────────────────────────

export interface CardHeaderProps {
  /** Card title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional action element (button, link, etc) */
  action?: ReactNode;
  /** Additional class names */
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Footer
// ─────────────────────────────────────────────────────────────────────────────

export interface CardFooterProps {
  /** Footer content */
  children: ReactNode;
  /** Alignment */
  align?: "left" | "center" | "right" | "between";
  /** Additional class names */
  className?: string;
}

export function CardFooter({
  children,
  align = "right",
  className,
}: CardFooterProps) {
  const alignStyles = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div className={cn("flex items-center gap-3", alignStyles[align], className)}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card (Specialized)
// ─────────────────────────────────────────────────────────────────────────────

export interface StatCardProps {
  /** Stat title */
  title: string;
  /** Stat value */
  value: string | number;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Color variant for icon background */
  variant?: "default" | "success" | "warning" | "error" | "info" | "premium";
  /** Additional class names */
  className?: string;
}

const statVariantStyles = {
  default: {
    bg: "bg-gray-bg",
    icon: "text-text-secondary",
  },
  success: {
    bg: "bg-success-bg",
    icon: "text-success-text",
  },
  warning: {
    bg: "bg-warning-bg",
    icon: "text-warning-text",
  },
  error: {
    bg: "bg-error-bg",
    icon: "text-error-text",
  },
  info: {
    bg: "bg-info-bg",
    icon: "text-info-text",
  },
  premium: {
    bg: "bg-premium-bg",
    icon: "text-premium-text",
  },
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = statVariantStyles[variant];

  return (
    <Card variant="elevated" padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-secondary">{title}</span>
          <span className="mt-1 text-2xl font-bold text-text-primary">{value}</span>
          {description && (
            <span className="mt-1 text-xs text-text-secondary">{description}</span>
          )}
        </div>

        {icon && (
          <div className={cn("p-2.5 rounded-lg", styles.bg)}>
            <div className={cn("w-5 h-5", styles.icon)}>{icon}</div>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-error"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-text-secondary">vs último período</span>
        </div>
      )}
    </Card>
  );
}
