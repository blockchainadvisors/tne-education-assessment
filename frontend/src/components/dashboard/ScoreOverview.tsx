"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { AssessmentScores } from "@/lib/types";
import { RadarChart } from "./RadarChart";

interface ScoreOverviewProps {
  assessmentId: string;
}

export function ScoreOverview({ assessmentId }: ScoreOverviewProps) {
  const { data: scores, isLoading } = useQuery({
    queryKey: ["scores", assessmentId],
    queryFn: () =>
      apiClient.get<AssessmentScores>(
        `/assessments/${assessmentId}/scores`
      ),
  });

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!scores) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Score gauge */}
      <div className="card flex flex-col items-center justify-center py-8">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(scores.overall_percentage / 100) * 314} 314`}
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-bold text-slate-900">
              {scores.overall_percentage.toFixed(0)}
            </span>
            <span className="text-lg text-slate-500">%</span>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">
          Overall Assessment Score
        </p>
        <p className="text-xs text-slate-400">
          {scores.overall_score} / {scores.overall_max_score} points
        </p>
      </div>

      {/* Theme breakdown */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Theme Scores
        </h3>
        <div className="space-y-3">
          {scores.theme_scores.map((ts) => (
            <div key={ts.theme_id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  {ts.theme_name}
                </span>
                <span className="text-slate-600">
                  {ts.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    ts.percentage >= 70
                      ? "bg-emerald-500"
                      : ts.percentage >= 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${ts.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      {scores.theme_scores.length >= 3 && (
        <div className="card lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Performance Radar
          </h3>
          <RadarChart themeScores={scores.theme_scores} />
        </div>
      )}
    </div>
  );
}
