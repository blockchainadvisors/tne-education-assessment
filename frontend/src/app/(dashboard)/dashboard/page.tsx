"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Assessment, PaginatedResponse, User } from "@/lib/types";
import { ScoreOverview } from "@/components/dashboard/ScoreOverview";

export default function DashboardPage() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => apiClient.get<User>("/auth/me"),
  });

  const { data: assessments, isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Assessment>>("/assessments"),
  });

  const items = assessments?.items || [];
  const draftCount = items.filter((a) => a.status === "draft").length;
  const inProgressCount = items.filter(
    (a) => a.status === "in_progress"
  ).length;
  const submittedCount = items.filter((a) => a.status === "submitted").length;
  const scoredCount = items.filter((a) => a.status === "scored").length;

  const scoredAssessment = items.find(
    (a) => a.status === "scored" || a.status === "published"
  );

  const statusCards = [
    {
      label: "Draft",
      count: draftCount,
      icon: ClipboardList,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "In Progress",
      count: inProgressCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Submitted",
      count: submittedCount,
      icon: AlertCircle,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Scored",
      count: scoredCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Here is an overview of your institution&apos;s assessment activity.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`rounded-lg p-3 ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-8 animate-pulse rounded bg-slate-200" />
                ) : (
                  card.count
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Score overview */}
      {scoredAssessment && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Latest Assessment Score
          </h2>
          <ScoreOverview assessmentId={scoredAssessment.id} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="card flex flex-col items-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            No assessments yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            Get started by creating your first assessment. Select a template and
            academic year to begin.
          </p>
          <a href="/assessments/new" className="btn-primary mt-6">
            Create your first assessment
          </a>
        </div>
      )}
    </div>
  );
}
