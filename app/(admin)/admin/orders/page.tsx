import { adminService } from "@/services/admin.service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrdersTable } from "./OrdersTable";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
}

/**
 * Página de listagem de pedidos (Admin)
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const status = params.status as OrderStatus | undefined;

  const ordersData = await adminService.getOrders({
    search: params.search,
    status,
    page,
    pageSize: 10,
  });

  // Status counts
  const statusCounts = {
    pending: ordersData.orders.filter((o) => o.status === "PENDING").length,
    paid: ordersData.orders.filter((o) => o.status === "PAID").length,
    shipped: ordersData.orders.filter((o) => o.status === "SHIPPED").length,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pedidos"
        description={`${ordersData.total} pedido(s) no total`}
      />

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-border p-4">
          <span className="text-sm text-text-secondary">Total</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {ordersData.total}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <span className="text-sm text-yellow-700">Pendentes</span>
          <p className="text-2xl font-bold text-yellow-800 mt-1">
            {statusCounts.pending}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <span className="text-sm text-blue-700">Pagos</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {statusCounts.paid}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <span className="text-sm text-purple-700">Enviados</span>
          <p className="text-2xl font-bold text-purple-800 mt-1">
            {statusCounts.shipped}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={ordersData.orders}
        pagination={{
          page: ordersData.page,
          pageSize: ordersData.pageSize,
          total: ordersData.total,
          totalPages: ordersData.totalPages,
        }}
        filters={{
          search: params.search || "",
          status: params.status || "",
        }}
      />
    </div>
  );
}
