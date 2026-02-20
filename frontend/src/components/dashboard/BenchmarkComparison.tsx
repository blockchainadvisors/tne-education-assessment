"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Alert } from "@/components/ui";
import type { BenchmarkComparison as BenchmarkData } from "@/lib/types";

interface BenchmarkComparisonProps {
  data: BenchmarkData;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const metric = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-md">
      <p className="mb-1.5 text-sm font-semibold text-slate-900">
        {metric?.fullName || label}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(1)}%
        </p>
      ))}
      {metric?.p25 != null && (
        <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-xs text-slate-500">
          P25: {metric.p25.toFixed(1)}% &middot; P75: {metric.p75.toFixed(1)}%
          &middot; n={metric.sampleSize}
        </p>
      )}
    </div>
  );
}

export function BenchmarkComparison({ data }: BenchmarkComparisonProps) {
  if (!data.metrics.length) {
    return (
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Benchmark Comparison
        </h3>
        <Alert variant="info">
          No benchmark data available yet. Benchmarks are generated when
          multiple institutions have completed assessments.
        </Alert>
      </div>
    );
  }

  const chartData = data.metrics.map((m) => {
    // Clean up metric names: "teaching_learning" → "Teaching & Learning"
    const pretty = m.metric_name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/ And /g, " & ");
    return {
      name: pretty.length > 14 ? pretty.substring(0, 12) + "..." : pretty,
      fullName: pretty,
      yourScore: m.institution_value ?? 0,
      peerMedian: m.percentile_50 ?? 0,
      p25: m.percentile_25,
      p75: m.percentile_75,
      sampleSize: m.sample_size,
    };
  });

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">
        Benchmark Comparison
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="yourScore"
              name="Your Score"
              stroke="var(--brand)"
              strokeWidth={2}
              dot={{ r: 5, fill: "var(--brand)", strokeWidth: 0 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="peerMedian"
              name="Peer Median"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: "#94a3b8", strokeWidth: 0 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
