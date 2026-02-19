"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Eye, Pencil, ClipboardList } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Assessment } from "@/lib/types";
import { Spinner, Alert, PageHeader, EmptyState, StatusBadge } from "@/components/ui";

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
    queryFn: () => apiClient.get<Assessment[]>("/assessments"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Manage and track your institution's assessments."
        actions={
          <Link href="/assessments/new" className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Alert variant="error">
          Failed to load assessments. Please try again.
        </Alert>
      )}

      {assessments && assessments.length === 0 && (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No assessments found"
            description="Create your first assessment to get started."
            action={
              <Link href="/assessments/new" className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Link>
            }
          />
        </div>
      )}

      {assessments && assessments.length > 0 && (
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
                {assessments.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {assessment.academic_year}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={assessment.status} />
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
                      <div className="flex items-center justify-end gap-1">
                        {(assessment.status === "draft" ||
                          assessment.status === "in_progress") && (
                          <Link
                            href={`/assessments/${assessment.id}/edit`}
                            className="btn-ghost btn-sm text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/assessments/${assessment.id}/review`}
                          className="btn-ghost btn-sm"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
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
