"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Alert } from "@/components/ui";
import type { YearScore } from "@/hooks/useDashboardData";

interface YearOverYearTrendProps {
  data: YearScore[];
}

export function YearOverYearTrend({ data }: YearOverYearTrendProps) {
  if (data.length < 2) {
    return (
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Year-over-Year Trend
        </h3>
        <Alert variant="info">
          Complete assessments for at least 2 academic years to see trend data.
        </Alert>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">
        Year-over-Year Trend
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="academicYear"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
            />
            <ReferenceLine
              y={70}
              stroke="#94a3b8"
              strokeDasharray="6 4"
              label={{
                value: "Target (70%)",
                position: "right",
                fontSize: 11,
                fill: "#94a3b8",
              }}
            />
            <Area
              type="monotone"
              dataKey="overallPercentage"
              stroke="var(--brand)"
              strokeWidth={2}
              fill="url(#brandGradient)"
              dot={{ r: 5, fill: "var(--brand)", strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
