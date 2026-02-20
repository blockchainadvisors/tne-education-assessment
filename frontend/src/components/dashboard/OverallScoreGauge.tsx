"use client";

import { GaugeChart } from "@/components/charts/GaugeChart";
import type { AssessmentScores } from "@/lib/types";

interface OverallScoreGaugeProps {
  scores: AssessmentScores;
}

function getLabel(pct: number) {
  if (pct >= 70) return "Strong";
  if (pct >= 40) return "Developing";
  return "Needs Improvement";
}

export function OverallScoreGauge({ scores }: OverallScoreGaugeProps) {
  const pct = scores.overall_percentage;

  return (
    <div className="card flex flex-col items-center justify-center py-8">
      <GaugeChart value={pct} label="Overall Score" size="lg" />
      <p className="mt-2 text-sm font-semibold text-slate-700">
        {getLabel(pct)}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {scores.overall_score?.toFixed(1)} / {scores.overall_max_score} points
      </p>
    </div>
  );
}
