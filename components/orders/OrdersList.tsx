/**
 * Orders List Component
 *
 * Client component that handles filtering and pagination of orders.
 * Uses actual OrderStatus enum values from Prisma:
 * PENDING | PAID | CANCELED | SHIPPED | DELIVERED
 */

"use client";

import { useState, useMemo } from "react";
import { OrderFilters } from "./OrderFilters";
import { OrderCard } from "./OrderCard";
import { EmptyOrders } from "./EmptyOrders";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
  };
}

interface Payment {
  id: string;
  status: string;
  provider: string;
  amount: number;
}

interface Shipment {
  id: string;
  status: string;
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

interface AddressSnapshot {
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderData {
  id: string;
  status: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  createdAt: Date;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
  addressSnapshot: AddressSnapshot | null;
}

// Actual OrderStatus enum values from Prisma schema
type OrderStatus = "ALL" | "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";

interface OrdersListProps {
  initialOrders: OrderData[];
}

const ITEMS_PER_PAGE = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...initialOrders];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter(order => order.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => {
        // Search by order ID
        if (order.id.toLowerCase().includes(query)) return true;
        // Search by product name
        if (order.items.some(item => item.product.name.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    return result;
  }, [initialOrders, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: OrderStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  if (initialOrders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
      />

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {filteredOrders.length === initialOrders.length ? (
          <span>Mostrando {filteredOrders.length} pedidos</span>
        ) : (
          <span>
            Mostrando {filteredOrders.length} de {initialOrders.length} pedidos
          </span>
        )}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">
            Nenhum pedido encontrado com os filtros selecionados.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
            className="mt-4 text-sm text-primary-green hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                  ? "bg-primary-green text-white"
                  : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
