"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UsersGrowthChartProps {
  data: {
    month: string;
    users: number;
    cumulative: number;
  }[];
}

export function UsersGrowthChart({ data }: UsersGrowthChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-border p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Crescimento de Usuários
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name) => [
                value ?? 0,
                name === "users" ? "Novos usuários" : "Total acumulado",
              ]}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ fill: "#22C55E", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#7C3AED"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-green" />
          <span className="text-sm text-text-secondary">Novos usuários</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary-purple" style={{ width: 12 }} />
          <span className="text-sm text-text-secondary">Total acumulado</span>
        </div>
      </div>
    </div>
  );
}
