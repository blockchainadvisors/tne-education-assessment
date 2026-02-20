"use client";

import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { StatusCounts } from "@/hooks/useDashboardData";

interface StatusCardsProps {
  counts: StatusCounts;
  loading: boolean;
}

const cards = [
  {
    key: "draft" as const,
    label: "Draft",
    icon: ClipboardList,
    color: "text-slate-600",
    bg: "bg-slate-100",
    ring: "ring-slate-200",
    border: "border-slate-400",
  },
  {
    key: "underReview" as const,
    label: "Under Review",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    border: "border-amber-400",
  },
  {
    key: "scored" as const,
    label: "Scored",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    border: "border-emerald-400",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    border: "border-blue-400",
  },
];

export function StatusCards({ counts, loading }: StatusCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl border-b-2 ${card.border} bg-white p-5 shadow-sm ring-1 ${card.ring} transition-shadow hover:shadow-md`}
        >
          <div className="flex items-center gap-4">
            <div className={`rounded-lg p-2.5 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? (
                  <span className="inline-block h-7 w-8 animate-pulse rounded bg-slate-200" />
                ) : (
                  counts[card.key]
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
