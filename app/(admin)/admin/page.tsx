import { adminService } from "@/services/admin.service";
import { StatCard } from "@/components/admin/StatCard";
import { DashboardCharts } from "@/components/admin/charts/DashboardCharts";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Dashboard administrativo
 * Exibe métricas principais, gráficos e atividades recentes
 */
export default async function AdminDashboardPage() {
  const [
    stats,
    recentOrders,
    topProducts,
    revenueData,
    ordersStatusData,
    topProductsChartData,
    usersGrowthData,
  ] = await Promise.all([
    adminService.getDashboardStats(),
    adminService.getRecentOrders(5),
    adminService.getTopProducts(5),
    adminService.getRevenueChartData(),
    adminService.getOrdersStatusChartData(),
    adminService.getTopProductsChartData(10),
    adminService.getUsersGrowthChartData(),
  ]);

  // Calcular trends
  const ordersTrend = stats.ordersLastMonth > 0
    ? Math.round(((stats.ordersThisMonth - stats.ordersLastMonth) / stats.ordersLastMonth) * 100)
    : 0;

  const revenueTrend = stats.revenueLastMonth > 0
    ? Math.round(((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100)
    : 0;

  const usersTrend = stats.usersLastMonth > 0
    ? Math.round(((stats.usersThisMonth - stats.usersLastMonth) / stats.usersLastMonth) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pedidos"
          value={stats.totalOrders}
          description={`${stats.ordersThisMonth} este mês`}
          icon={ShoppingCart}
          variant="purple"
          trend={ordersTrend !== 0 ? { value: ordersTrend, isPositive: ordersTrend > 0 } : undefined}
        />
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          description={`${formatCurrency(stats.revenueThisMonth)} este mês`}
          icon={DollarSign}
          variant="green"
          trend={revenueTrend !== 0 ? { value: revenueTrend, isPositive: revenueTrend > 0 } : undefined}
        />
        <StatCard
          title="Produtos"
          value={stats.totalProducts}
          description={`${stats.activeProducts} ativos`}
          icon={Package}
          variant="default"
        />
        <StatCard
          title="Usuários"
          value={stats.totalUsers}
          description={`${stats.usersThisMonth} novos este mês`}
          icon={Users}
          variant="default"
          trend={usersTrend !== 0 ? { value: usersTrend, isPositive: usersTrend > 0 } : undefined}
        />
      </div>

      {/* Alerts */}
      {stats.lowStockProducts > 0 && (
        <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              Produtos com estoque baixo
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              {stats.lowStockProducts} produto(s) estão com estoque abaixo do limite.{" "}
              <Link href="/admin/products?lowStock=true" className="underline font-medium">
                Ver produtos
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-surface rounded-xl border border-default">
          <div className="flex items-center justify-between p-4 border-b border-default">
            <h2 className="text-lg font-semibold text-text-primary">
              Pedidos Recentes
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary-purple hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                Nenhum pedido ainda
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-bg/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {order.user.fullName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {order.itemCount} item(ns) • {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-semibold text-text-primary">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-surface rounded-xl border border-default">
          <div className="flex items-center justify-between p-4 border-b border-default">
            <h2 className="text-lg font-semibold text-text-primary">
              Produtos Mais Vendidos
            </h2>
            <Link
              href="/admin/products"
              className="text-sm text-primary-purple hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                Nenhuma venda registrada
              </div>
            ) : (
              topProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-bg/50 transition-colors"
                >
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-semibold text-text-secondary bg-gray-bg rounded-full">
                    {index + 1}
                  </span>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-bg rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-text-secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {product.totalSold} vendidos
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary-green">
                    {formatCurrency(product.totalRevenue)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Análises e Gráficos
        </h2>
        <DashboardCharts
          revenueData={revenueData}
          ordersStatusData={ordersStatusData}
          topProductsData={topProductsChartData}
          usersGrowthData={usersGrowthData}
        />
      </div>
    </div>
  );
}

// Status badge component
function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    SHIPPED: "Enviado",
    DELIVERED: "Entregue",
    CANCELED: "Cancelado",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"}`}
    >
      {labels[status] || status}
    </span>
  );
}
