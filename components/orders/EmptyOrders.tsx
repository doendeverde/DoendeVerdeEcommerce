/**
 * Empty Orders Component
 * 
 * Shown when user has no orders.
 */

"use client";

import { Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function EmptyOrders() {
  return (
    <div className="bg-card-bg rounded-xl shadow-sm border border-gray-border p-12 text-center">
      <div className="w-20 h-20 bg-gray-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-10 h-10 text-text-secondary" />
      </div>

      <h3 className="text-xl font-semibold text-text-primary mb-2">
        Nenhum pedido encontrado
      </h3>

      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        Você ainda não fez nenhum pedido. Explore nossa loja e encontre produtos incríveis!
      </p>

      <Link
        href="/products"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
      >
        <ShoppingBag className="w-5 h-5" />
        Começar a Comprar
      </Link>
    </div>
  );
}
