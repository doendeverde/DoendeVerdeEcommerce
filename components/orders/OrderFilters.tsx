/**
 * Order Filters Component
 *
 * Search bar and status filter for orders.
 * Uses actual OrderStatus enum values from Prisma:
 * PENDING | PAID | CANCELED | SHIPPED | DELIVERED
 */

"use client";

import { Search, Filter, X } from "lucide-react";

// Actual OrderStatus enum values from Prisma schema
type OrderStatus = "ALL" | "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "PENDING", label: "Aguardando Pagamento" },
  { value: "PAID", label: "Pago" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelado" },
];

export function OrderFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: OrderFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por pedido ou produto..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent bg-card-bg text-text-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-hover-bg rounded-full"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent appearance-none bg-card-bg text-text-primary"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
