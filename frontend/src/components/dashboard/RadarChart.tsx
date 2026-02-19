"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ThemeScore } from "@/lib/types";

interface RadarChartProps {
  themeScores: ThemeScore[];
}

export function RadarChart({ themeScores }: RadarChartProps) {
  const data = themeScores.map((ts) => ({
    theme: ts.theme_name.length > 15
      ? ts.theme_name.substring(0, 15) + "..."
      : ts.theme_name,
    fullName: ts.theme_name,
    score: ts.percentage,
    fullMark: 100,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="theme"
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickCount={6}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--brand)"
            fill="var(--brand)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
            labelFormatter={(label: string) => {
              const item = data.find((d) => d.theme === label);
              return item?.fullName || label;
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
