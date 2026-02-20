"use client";

import Link from "next/link";
import { Eye, Plus, ClipboardList } from "lucide-react";
import type { Assessment } from "@/lib/types";
import { StatusBadge, EmptyState } from "@/components/ui";

interface RecentAssessmentsTableProps {
  assessments: Assessment[];
  loading: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export function RecentAssessmentsTable({
  assessments,
  loading,
}: RecentAssessmentsTableProps) {
  const recent = [...assessments]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5);

  if (!loading && assessments.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Get started by creating your first assessment."
          action={
            <Link href="/assessments/new" className="btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create first assessment
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Recent Assessments
        </h3>
      </div>
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
                Last Updated
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              recent.map((a) => (
                <tr
                  key={a.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {a.academic_year}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {a.overall_score != null
                      ? `${a.overall_score.toFixed(1)}%`
                      : "--"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(a.updated_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/assessments/${a.id}/review`}
                      className="btn-ghost btn-sm"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
