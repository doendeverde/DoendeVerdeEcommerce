/**
 * Orders Header Component
 * 
 * Hero-style header for the orders page with gradient.
 */

"use client";

import { Package } from "lucide-react";

interface OrdersHeaderProps {
  totalOrders: number;
}

export function OrdersHeader({ totalOrders }: OrdersHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
          <Package className="w-7 h-7 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Minhas Compras</h1>
          <p className="text-purple-200">
            Acompanhe todos os seus pedidos e histórico de compras
          </p>
        </div>

        {totalOrders > 0 && (
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold">{totalOrders}</p>
            <p className="text-sm text-purple-200">
              {totalOrders === 1 ? "pedido" : "pedidos"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
