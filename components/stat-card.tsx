"use client";

import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: number; // positive = up, negative = down
  color?: "blue" | "green" | "purple" | "orange";
};

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
};

export function StatCard({ label, value, sub, icon, trend, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {icon && (
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium mb-0.5 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
