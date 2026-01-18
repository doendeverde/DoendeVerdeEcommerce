/**
 * Checkout Cart Summary Component
 *
 * Displays cart items and totals during checkout.
 * Similar to OrderSummary but for products.
 */

"use client";

import Image from "next/image";
import { Package, Truck, Tag, ShoppingBag } from "lucide-react";

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
  shipping: number;
  discount: number;
  total: number;
}

export function CheckoutCartSummary({
  items,
  subtotal,
  shipping,
  discount,
  total,
}: CheckoutCartSummaryProps) {
  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
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
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Qtd: {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {formatPrice(item.totalPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Frete
          </span>
          {shipping === 0 ? (
            <span className="text-primary-green font-medium">Grátis</span>
          ) : (
            <span className="text-gray-900">{formatPrice(shipping)}</span>
          )}
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-primary-green flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Desconto
            </span>
            <span className="text-primary-green font-medium">
              -{formatPrice(discount)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
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
