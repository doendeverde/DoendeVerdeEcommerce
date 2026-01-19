"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingCart, Eye } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  user: {
    fullName: string;
    email: string;
  };
  itemCount: number;
}

interface OrdersTableProps {
  orders: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status: string;
  };
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELED: "Cancelado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
};

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  CANCELED: "bg-red-100 text-red-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
};

/**
 * Tabela de pedidos com filtros
 */
export function OrdersTable({ orders, pagination, filters }: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(filters.search);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (!updates.page) {
      params.delete("page");
    }

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por ID, email ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:bg-white transition-colors"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="px-3 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20"
          >
            <option value="">Todos status</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="SHIPPED">Enviado</option>
            <option value="DELIVERED">Entregue</option>
            <option value="CANCELED">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Itens
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                    <p className="text-text-secondary">Nenhum pedido encontrado</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-bg/50 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-mono font-medium text-primary-purple hover:underline"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {order.user.fullName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {order.user.email}
                        </p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-secondary">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-primary">
                        {order.itemCount} item(ns)
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          statusStyles[order.status]
                        )}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-purple hover:bg-primary-purple/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-border">
            <span className="text-sm text-text-secondary">
              Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{" "}
              {pagination.total} pedidos
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-border rounded-lg hover:bg-gray-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-text-primary">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-border rounded-lg hover:bg-gray-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
