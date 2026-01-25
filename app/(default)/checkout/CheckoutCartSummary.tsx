/**
 * Checkout Cart Summary Component
 *
 * Displays cart items and totals during checkout.
 * Similar to OrderSummary but for products.
 */

"use client";

import Image from "next/image";
import { Package, Truck, Tag, ShoppingBag, Loader2 } from "lucide-react";
import type { SelectedShippingOption } from "@/types/shipping";

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

interface CheckoutCartSummaryProps {
  items: CartItem[];
  subtotal: number;
  /** Static shipping value OR calculated from shippingOption */
  shipping?: number;
  discount: number;
  /** Label explaining the discount (e.g., "Desconto Doende Bronze") */
  discountLabel?: string | null;
  total: number;
  /** Selected shipping option (for detailed display) */
  shippingOption?: SelectedShippingOption | null;
  /** If shipping is being calculated */
  isLoadingShipping?: boolean;
}

export function CheckoutCartSummary({
  items,
  subtotal,
  shipping: shippingProp = 0,
  discount,
  discountLabel,
  total: totalProp,
  shippingOption,
  isLoadingShipping = false,
}: CheckoutCartSummaryProps) {
  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Use shipping option price if available, otherwise use shipping prop
  const shippingPrice = shippingOption?.price ?? shippingProp;

  // Recalculate total with shipping option
  const total = shippingOption
    ? subtotal - discount + shippingPrice
    : totalProp;

  return (
    <div className="bg-surface rounded-xl border border-default overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-default bg-page">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-muted" />
          <h3 className="font-semibold text-default">Resumo do Pedido</h3>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId || ""}`}
            className="flex gap-3"
          >
            {/* Image */}
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-page">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-default truncate">
                {item.name}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Qtd: {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
              <p className="text-sm font-semibold text-default mt-1">
                {formatPrice(item.totalPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-4 border-t border-default space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="text-default">{formatPrice(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-muted flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Frete
          </span>
          {isLoadingShipping ? (
            <span className="text-muted flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Calculando...
            </span>
          ) : shippingOption ? (
            shippingPrice === 0 ? (
              <span className="text-primary-green font-medium">Grátis</span>
            ) : (
              <span className="text-default">{formatPrice(shippingPrice)}</span>
            )
          ) : (
            <span className="text-muted text-xs">Selecione o endereço</span>
          )}
        </div>

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

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-primary-purple flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {discountLabel || "Desconto"}
            </span>
            <span className="text-primary-purple font-medium">
              -{formatPrice(discount)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between">
            <span className="font-semibold text-default">Total</span>
            <span className="text-xl font-bold text-default">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center gap-2 p-3 bg-page rounded-lg text-xs text-muted">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Pagamento 100% seguro
        </div>
      </div>
    </div>
  );
}
