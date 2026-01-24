/**
 * Order Summary Component
 * 
 * Sidebar showing plan details, benefits, pricing, and shipping.
 * Sticky on desktop for easy reference during checkout.
 */

"use client";

import { Crown, Check, Truck, Loader2 } from "lucide-react";
import type { PlanData } from "@/types/subscription-checkout";
import type { SelectedShippingOption } from "@/types/shipping";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OrderSummaryProps {
  plan: PlanData;
  /** Opção de frete selecionada */
  shippingOption?: SelectedShippingOption | null;
  /** Se está carregando opções de frete */
  isLoadingShipping?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OrderSummary({
  plan,
  shippingOption,
  isLoadingShipping = false,
}: OrderSummaryProps) {
  // Calculate total with shipping
  const shippingPrice = shippingOption?.price || 0;
  const total = plan.price + shippingPrice;

  return (
    <div className="bg-surface rounded-xl shadow-sm p-6 sticky top-6">
      <h3 className="font-semibold text-default mb-4">Resumo</h3>

      {/* Plan Info */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 bg-primary-green/10 rounded-xl flex items-center justify-center">
          <Crown className="w-6 h-6 text-primary-green" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-default">{plan.name}</h4>
          <p className="text-sm text-muted">{plan.description}</p>
          {plan.badge && (
            <span
              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${plan.badge === "premium"
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                }`}
            >
              {plan.badge === "premium" ? "Premium" : "Mais popular"}
            </span>
          )}
        </div>
      </div>

      {/* Benefits preview */}
      <div className="py-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-muted mb-2">Inclui:</p>
        <ul className="space-y-1">
          {plan.benefits.slice(0, 3).map((benefit, i) => (
            <li key={i} className="text-xs text-muted flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary-green flex-shrink-0 mt-0.5" />
              {benefit}
            </li>
          ))}
          {plan.benefits.length > 3 && (
            <li className="text-xs text-muted">
              +{plan.benefits.length - 3} benefícios
            </li>
          )}
        </ul>
      </div>

      {/* Pricing */}
      <div className="pt-4 space-y-2">
        {/* Plan price */}
        <div className="flex justify-between text-sm">
          <span className="text-muted">Plano mensal</span>
          <span className="text-default">{formatPrice(plan.price)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-muted flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            Frete
          </span>
          {isLoadingShipping ? (
            <span className="text-muted flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Calculando...
            </span>
          ) : shippingOption ? (
            shippingOption.price === 0 ? (
              <span className="text-primary-green font-medium">Grátis</span>
            ) : (
              <span className="text-default">{formatPrice(shippingOption.price)}</span>
            )
          ) : (
            <span className="text-muted text-xs">Selecione o endereço</span>
          )}
        </div>

        {/* Discount info */}
        {plan.discountPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Desconto em compras</span>
            <span className="text-primary-green font-medium">
              {plan.discountPercent}%
            </span>
          </div>
        )}

        {/* Shipping details */}
        {shippingOption && (
          <div className="flex justify-between text-xs text-muted bg-page rounded-lg p-2 -mx-2">
            <span>{shippingOption.name}</span>
            <span>
              {shippingOption.deliveryDays === 1
                ? "1 dia útil"
                : `${shippingOption.deliveryDays} dias úteis`}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between text-lg font-bold pt-2 border-t ">
          <span>Total</span>
          <span className="text-primary-green">
            {formatPrice(total)}/mês
          </span>
        </div>

        {shippingOption && shippingOption.price > 0 && (
          <p className="text-xs text-muted text-center">
            Frete cobrado mensalmente por entrega
          </p>
        )}
      </div>

      {/* Trust badges */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Check className="w-4 h-4 text-primary-green" />
          Cancele quando quiser
        </div>
        <div className="flex items-center gap-2 text-xs text-muted mt-1">
          <Check className="w-4 h-4 text-primary-green" />
          Pagamento seguro
        </div>
      </div>
    </div>
  );
}
