"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Eye, Pencil, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Assessment, PaginatedResponse } from "@/lib/types";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-purple-100 text-purple-700",
  scored: "bg-emerald-100 text-emerald-700",
  published: "bg-indigo-100 text-indigo-700",
};

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AssessmentsPage() {
  const {
    data: assessments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assessments"],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Assessment>>("/assessments"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage and track your institution&apos;s assessments.
          </p>
        </div>
        <Link href="/assessments/new" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Assessment
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load assessments. Please try again.
        </div>
      )}

      {assessments && assessments.items.length === 0 && (
        <div className="card flex flex-col items-center py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            No assessments found
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Create your first assessment to get started.
          </p>
          <Link href="/assessments/new" className="btn-primary mt-4">
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </div>
      )}

      {assessments && assessments.items.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 font-semibold text-slate-900">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-900">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 font-semibold text-slate-900">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assessments.items.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {assessment.academic_year}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          statusStyles[assessment.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatStatus(assessment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {assessment.overall_score != null
                        ? `${assessment.overall_score.toFixed(1)}%`
                        : "--"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(assessment.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(assessment.status === "draft" ||
                          assessment.status === "in_progress") && (
                          <Link
                            href={`/assessments/${assessment.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/assessments/${assessment.id}/review`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
