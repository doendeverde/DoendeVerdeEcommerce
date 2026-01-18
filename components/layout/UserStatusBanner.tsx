"use client";

import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStatusBannerProps {
  className?: string;
  planName: string;
  discountPercent: number;
  color: string;
  colorDark: string;
}

/**
 * Gradient banner showing user's active subscription status
 * Displays: current plan name and discount percentage
 * Colors are dynamic based on plan tier
 */
export function UserStatusBanner({
  className,
  planName,
  discountPercent,
  color,
  colorDark,
}: UserStatusBannerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl p-4 sm:p-6 transition-all duration-300",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${colorDark} 0%, ${color} 100%)`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Plan Info */}
        <div className="flex items-center gap-4">
          {/* Plan Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl">
            <Award className="w-6 h-6 text-white" />
          </div>

          {/* Plan Details */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {planName}
              </h3>
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-white rounded-full"
                  style={{ color: colorDark }}
                >
                  {discountPercent}% de desconto
                </span>
              )}
            </div>
            <p className="text-sm text-white/80 mt-0.5">
              {discountPercent > 0
                ? "Desconto aplicado automaticamente em todas as compras"
                : "Você está no plano básico"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
