/**
 * Shipping Selector Component
 *
 * Auto-loads and displays shipping options when CEP is provided.
 * Used in both subscription and product checkouts.
 * 
 * This component automatically fetches shipping quotes when the CEP changes
 * and allows users to select their preferred shipping option.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Loader2,
  AlertCircle,
  Package,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import type { ShippingOption, SelectedShippingOption } from "@/types/shipping";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ShippingSelectorProps {
  /** CEP do endereço selecionado */
  cep: string;
  /** IDs dos produtos no carrinho (para checkout de produtos) */
  productIds?: string[];
  /** ID do plano de assinatura (para checkout de assinatura) */
  subscriptionPlanId?: string;
  /** Opção de frete selecionada */
  selectedOption: SelectedShippingOption | null;
  /** Callback quando uma opção é selecionada */
  onSelectOption: (option: SelectedShippingOption | null) => void;
  /** Callback quando o carregamento termina (para controle de loading no parent) */
  onLoadingChange?: (isLoading: boolean) => void;
  /** Optional class name */
  className?: string;
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

export function ShippingSelector({
  cep,
  productIds,
  subscriptionPlanId,
  selectedOption,
  onSelectOption,
  onLoadingChange,
  className = "",
}: ShippingSelectorProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Fetch shipping options
  const fetchShippingOptions = useCallback(async () => {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      setOptions([]);
      setError(null);
      setHasLoaded(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { cep: cleanCep };

      if (productIds && productIds.length > 0) {
        payload.productIds = productIds;
      }

      if (subscriptionPlanId) {
        payload.planId = subscriptionPlanId;
      }

      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao calcular frete");
      }

      // API returns { success, data: { options } }
      const shippingOptions = data.data?.options || data.options || [];
      setOptions(shippingOptions);
      setHasLoaded(true);

      // Auto-select cheapest option if no option is selected yet
      if (!selectedOption && shippingOptions.length > 0) {
        const cheapest = shippingOptions.reduce((min: ShippingOption, opt: ShippingOption) =>
          opt.price < min.price ? opt : min
        );
        onSelectOption({
          id: cheapest.id,
          carrier: cheapest.carrier,
          service: cheapest.service,
          name: cheapest.name,
          price: cheapest.price,
          deliveryDays: cheapest.estimatedDays,
        });
      }

      if (shippingOptions.length === 0) {
        setError("Não encontramos opções de frete para este CEP");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao calcular frete");
      setOptions([]);
      onSelectOption(null);
    } finally {
      setIsLoading(false);
    }
  }, [cep, productIds, subscriptionPlanId, selectedOption, onSelectOption]);

  // Auto-fetch when CEP changes
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      fetchShippingOptions();
    } else {
      setOptions([]);
      setError(null);
      setHasLoaded(false);
      onSelectOption(null);
    }
  }, [cep]); // Only re-fetch when CEP changes

  // Handle option selection
  const handleSelectOption = (option: ShippingOption) => {
    onSelectOption({
      id: option.id,
      carrier: option.carrier,
      service: option.service,
      name: option.name,
      price: option.price,
      deliveryDays: option.estimatedDays,
    });
  };

  // No CEP provided - don't render
  if (!cep || cep.replace(/\D/g, "").length !== 8) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary-green" />
          <h3 className="font-semibold text-gray-900">Opções de Entrega</h3>
        </div>
        {hasLoaded && !isLoading && (
          <button
            type="button"
            onClick={fetchShippingOptions}
            className="p-1.5 text-gray-400 hover:text-primary-green hover:bg-gray-50 rounded-lg transition-colors"
            title="Recalcular frete"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Calculando frete...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchShippingOptions}
            className="ml-auto text-red-700 hover:text-red-800 underline text-xs"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Shipping Options */}
      {!isLoading && !error && options.length > 0 && (
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedOption?.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isSelected
                    ? "border-primary-green bg-green-50"
                    : "border-gray-200 hover:border-primary-green/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-primary-green" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="text-left">
                    <p
                      className={`font-medium ${isSelected ? "text-primary-green" : "text-gray-900"
                        }`}
                    >
                      {option.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {option.estimatedDays === 1
                        ? "Entrega em 1 dia útil"
                        : `Entrega em até ${option.estimatedDays} dias úteis`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {option.price === 0 ? (
                    <span className="font-bold text-primary-green">Grátis</span>
                  ) : (
                    <span
                      className={`font-bold ${isSelected ? "text-primary-green" : "text-gray-900"
                        }`}
                    >
                      {formatPrice(option.price)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No Options State */}
      {!isLoading && !error && hasLoaded && options.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma opção de frete disponível</p>
        </div>
      )}
    </div>
  );
}
