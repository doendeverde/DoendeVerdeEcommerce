import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "green" | "purple" | "orange" | "red";
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-gray-bg",
    icon: "text-text-secondary",
  },
  green: {
    bg: "bg-green-bg",
    icon: "text-green-text",
  },
  purple: {
    bg: "bg-purple-bg",
    icon: "text-purple-text",
  },
  orange: {
    bg: "bg-orange-bg",
    icon: "text-orange-text",
  },
  red: {
    bg: "bg-red-bg",
    icon: "text-red-text",
  },
};

/**
 * Card de estatística para dashboard admin
 * Exibe métricas com ícone, valor e tendência opcional
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-surface rounded-xl border-default p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted">
            {title}
          </span>
          <span className="mt-1 text-2xl font-bold text-default">
            {value}
          </span>
          {description && (
            <span className="mt-1 text-xs text-muted">
              {description}
            </span>
          )}
        </div>

        {/* Icon */}
        <div className={cn("p-2.5 rounded-lg", styles.bg)}>
          <Icon className={cn("w-5 h-5", styles.icon)} />
        </div>
      </div>

      {/* Trend */}
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-primary-green" : "text-red-500"
            )}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-muted">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
}
