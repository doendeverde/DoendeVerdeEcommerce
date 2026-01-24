/**
 * Shipping Calculator Component
 *
 * Allows users to calculate shipping costs by entering their CEP.
 * Used in both product checkout and subscription checkout.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Loader2, AlertCircle, MapPin, Package, ChevronDown, ChevronUp } from "lucide-react";
import type { ShippingOption, ShippingQuoteResponse } from "@/types/shipping";

interface ShippingCalculatorProps {
  /** Product IDs for regular checkout */
  productIds?: string[];
  /** Subscription plan ID */
  subscriptionPlanId?: string;
  /** Pre-filled CEP (e.g., from user's address) */
  initialCep?: string;
  /** Callback when user selects a shipping option */
  onSelectOption: (option: ShippingOption) => void;
  /** Currently selected option */
  selectedOption?: ShippingOption | null;
  /** Optional class name */
  className?: string;
}

/**
 * Format price for display
 */
function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format CEP for display (00000-000)
 */
function formatCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

export function ShippingCalculator({
  productIds,
  subscriptionPlanId,
  initialCep = "",
  onSelectOption,
  selectedOption,
  className = "",
}: ShippingCalculatorProps) {
  const [cep, setCep] = useState(initialCep);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);

  // Number of options to show before "Ver mais"
  const VISIBLE_OPTIONS_COUNT = 5;

  // Auto-calculate if initial CEP is provided
  useEffect(() => {
    if (initialCep && initialCep.replace(/\D/g, "").length === 8) {
      calculateShipping(initialCep);
    }
  }, [initialCep]);

  const calculateShipping = useCallback(async (cepToUse: string) => {
    const cleanCep = cepToUse.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      setError("CEP deve ter 8 dígitos");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

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

      const data: ShippingQuoteResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao calcular frete");
      }

      // API may return options directly or nested in data
      const apiData = (data as { data?: { options: ShippingOption[] } }).data;
      setOptions(apiData?.options || data.options || []);

      // If no options, show error
      if (!data.options || data.options.length === 0) {
        setError("Não encontramos opções de frete para este CEP");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao calcular frete");
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [productIds, subscriptionPlanId]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 8) {
      setCep(formatCep(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateShipping(cep);
  };

  const handleSelectOption = (option: ShippingOption) => {
    onSelectOption(option);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-border dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-primary-green" />
        <h3 className="font-semibold text-text-primary">Calcular Frete</h3>
      </div>

      {/* CEP Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={cep}
            onChange={handleCepChange}
            placeholder="00000-000"
            className="w-full pl-10 pr-4 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
            maxLength={9}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || cep.replace(/\D/g, "").length !== 8}
          className="px-4 py-2 bg-primary-green text-white font-medium rounded-lg hover:bg-primary-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Calcular"
          )}
        </button>
      </form>

      {/* Help Link */}
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary-green hover:underline"
      >
        Não sei meu CEP
      </a>

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shipping Options */}
      {hasSearched && !isLoading && options.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-text-secondary">Opções de entrega:</p>

          {(showAllOptions ? options : options.slice(0, VISIBLE_OPTIONS_COUNT)).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectOption(option)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${selectedOption?.id === option.id
                ? "border-primary-green bg-green-50"
                : "border-gray-border hover:border-primary-green/50"
                }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-text-muted" />
                <div className="text-left">
                  <p className="font-medium text-text-primary">{option.name}</p>
                  <p className="text-sm text-text-secondary">
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
                  <span className="font-bold text-text-primary">
                    {formatPrice(option.price)}
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Show More / Show Less Button */}
          {options.length > VISIBLE_OPTIONS_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllOptions(!showAllOptions)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-600 hover:text-primary-green transition-colors"
            >
              {showAllOptions ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Ver mais {options.length - VISIBLE_OPTIONS_COUNT} opções
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* No Options Message */}
      {hasSearched && !isLoading && options.length === 0 && !error && (
        <div className="mt-4 text-center py-6 text-text-muted">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma opção de frete disponível</p>
        </div>
      )}
    </div>
  );
}
