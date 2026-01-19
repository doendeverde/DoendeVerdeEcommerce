"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopProductsChartProps {
  data: {
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  // Truncate product names for display
  const chartData = data.map((item) => ({
    ...item,
    shortName: item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-border p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Produtos Mais Vendidos
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [`${value ?? 0} unidades`, "Vendas"]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.shortName === label);
                return item?.name || String(label);
              }}
            />
            <Bar
              dataKey="sales"
              fill="#7C3AED"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
