"use client";

import { GaugeChart } from "@/components/charts/GaugeChart";
import type { ThemeScore } from "@/lib/types";

interface ThemeRadialBarsProps {
  themeScores: ThemeScore[];
}

export function ThemeRadialBars({ themeScores }: ThemeRadialBarsProps) {
  return (
    <div className="card flex flex-col py-6">
      <h3 className="mb-5 px-6 text-sm font-semibold text-slate-900">
        Theme Scores
      </h3>
      <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4 px-4">
        {themeScores.map((ts) => (
          <div key={ts.theme_id} className="flex flex-col items-center">
            <GaugeChart
              value={ts.percentage}
              label={ts.theme_name}
              size="sm"
              showTicks={false}
            />
            <p className="mt-1 max-w-[130px] text-center text-xs font-medium leading-tight text-slate-600">
              {ts.theme_name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
