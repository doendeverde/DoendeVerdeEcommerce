"use client";

import { useSession } from "next-auth/react";
import { Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStatusBannerProps {
  className?: string;
  // TODO: These will come from user data/subscription
  planName?: string;
  discountPercent?: number;
  // points?: number; // FEATURE DISABLED: Will be implemented in the future
}

/**
 * Purple gradient banner showing user's subscription status
 * Displays: current plan and discount
 */
export function UserStatusBanner({
  className,
  planName = "Doende Prata",
  discountPercent = 20,
  // points = 2850, // FEATURE DISABLED: Will be implemented in the future
}: UserStatusBannerProps) {
  const { data: session, status } = useSession();

  // Don't show banner if not logged in or loading
  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full bg-gradient-to-r from-primary-purple-dark to-primary-purple rounded-xl p-4 sm:p-6",
        className
      )}
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
              <span className="px-2 py-0.5 text-xs font-medium text-primary-purple bg-white rounded-full">
                {discountPercent}% de desconto
              </span>
            </div>
            <p className="text-sm text-white/80 mt-0.5">
              Desconto aplicado automaticamente em todas as compras
            </p>
          </div>
        </div>

        {/* FEATURE DISABLED: Points will be implemented in the future */}
        {/* <div className="flex items-center gap-3 sm:text-right">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl">
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <div>
              <p className="text-xl font-bold text-white">
                {points.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-white/80">
                pontos disponíveis
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
