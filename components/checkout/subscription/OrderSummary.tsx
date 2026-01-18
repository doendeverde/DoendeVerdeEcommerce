/**
 * Order Summary Component
 * 
 * Sidebar showing plan details, benefits, and pricing.
 * Sticky on desktop for easy reference during checkout.
 */

"use client";

import { Crown, Check } from "lucide-react";
import type { PlanData } from "@/types/subscription-checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface OrderSummaryProps {
  plan: PlanData;
}

export function OrderSummary({ plan }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
      <h3 className="font-semibold text-gray-900 mb-4">Resumo</h3>

      {/* Plan Info */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-primary-green/10 rounded-xl flex items-center justify-center">
          <Crown className="w-6 h-6 text-primary-green" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{plan.name}</h4>
          <p className="text-sm text-gray-500">{plan.description}</p>
          {plan.badge && (
            <span
              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${plan.badge === "premium"
                  ? "bg-purple-100 text-primary-purple"
                  : "bg-green-100 text-primary-green"
                }`}
            >
              {plan.badge === "premium" ? "Premium" : "Mais popular"}
            </span>
          )}
        </div>
      </div>

      {/* Benefits preview */}
      <div className="py-4 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Inclui:</p>
        <ul className="space-y-1">
          {plan.benefits.slice(0, 3).map((benefit, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary-green flex-shrink-0 mt-0.5" />
              {benefit}
            </li>
          ))}
          {plan.benefits.length > 3 && (
            <li className="text-xs text-gray-500">
              +{plan.benefits.length - 3} benefícios
            </li>
          )}
        </ul>
      </div>

      {/* Pricing */}
      <div className="pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Plano mensal</span>
          <span className="text-gray-900">
            R$ {plan.price.toFixed(2).replace(".", ",")}
          </span>
        </div>
        {plan.discountPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Desconto em compras</span>
            <span className="text-primary-green font-medium">
              {plan.discountPercent}%
            </span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-primary-green">
            R$ {plan.price.toFixed(2).replace(".", ",")}/mês
          </span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Check className="w-4 h-4 text-primary-green" />
          Cancele quando quiser
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <Check className="w-4 h-4 text-primary-green" />
          Pagamento seguro
        </div>
      </div>
    </div>
  );
}
