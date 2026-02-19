"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Assessment, User } from "@/lib/types";
import { ScoreOverview } from "@/components/dashboard/ScoreOverview";
import { Spinner, PageHeader, EmptyState } from "@/components/ui";

export default function DashboardPage() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => apiClient.get<User>("/users/me"),
  });

  const { data: assessments, isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => apiClient.get<Assessment[]>("/assessments"),
  });

  const items = assessments || [];
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
      ring: "ring-slate-200",
    },
    {
      label: "In Progress",
      count: inProgressCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    },
    {
      label: "Submitted",
      count: submittedCount,
      icon: AlertCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
    },
    {
      label: "Scored",
      count: scoredCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.full_name ? `, ${user.full_name}` : ""}`}
        description="Here is an overview of your institution's assessment activity."
      />

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${card.ring}`}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoading ? (
                    <span className="inline-block h-7 w-8 animate-pulse rounded bg-slate-200" />
                  ) : (
                    card.count
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Score overview */}
      {scoredAssessment && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            Latest Assessment Score
          </h2>
          <ScoreOverview assessmentId={scoredAssessment.id} />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No assessments yet"
            description="Get started by creating your first assessment. Select a template and academic year to begin."
            action={
              <Link href="/assessments/new" className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create your first assessment
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
