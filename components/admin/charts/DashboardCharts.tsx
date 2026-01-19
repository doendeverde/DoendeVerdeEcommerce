"use client";

import dynamic from "next/dynamic";

// Lazy load charts to avoid SSR issues with recharts
const RevenueChart = dynamic(
  () => import("./RevenueChart").then((mod) => mod.RevenueChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const OrdersStatusChart = dynamic(
  () => import("./OrdersStatusChart").then((mod) => mod.OrdersStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const TopProductsChart = dynamic(
  () => import("./TopProductsChart").then((mod) => mod.TopProductsChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const UsersGrowthChart = dynamic(
  () => import("./UsersGrowthChart").then((mod) => mod.UsersGrowthChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-border p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-[300px] bg-gray-100 rounded" />
    </div>
  );
}

interface DashboardChartsProps {
  revenueData: { date: string; revenue: number; orders: number }[];
  ordersStatusData: { name: string; value: number; color: string }[];
  topProductsData: { name: string; sales: number; revenue: number }[];
  usersGrowthData: { month: string; users: number; cumulative: number }[];
}

export function DashboardCharts({
  revenueData,
  ordersStatusData,
  topProductsData,
  usersGrowthData,
}: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Revenue Chart - Full Width */}
      <RevenueChart data={revenueData} />

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersStatusChart data={ordersStatusData} />
        <TopProductsChart data={topProductsData} />
      </div>

      {/* Users Growth - Full Width */}
      <UsersGrowthChart data={usersGrowthData} />
    </div>
  );
}
