"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, AlertCircle, Download } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type {
  Assessment,
  AssessmentTemplate,
  AssessmentResponse,
  AssessmentScores,
} from "@/lib/types";

export default function AssessmentReviewPage() {
  const params = useParams();
  const assessmentId = params.id as string;

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => apiClient.get<Assessment>(`/assessments/${assessmentId}`),
  });

  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ["template", assessment?.template_id],
    queryFn: () =>
      apiClient.get<AssessmentTemplate>(
        `/templates/${assessment!.template_id}`
      ),
    enabled: !!assessment?.template_id,
  });

  const { data: responses } = useQuery({
    queryKey: ["responses", assessmentId],
    queryFn: () =>
      apiClient.get<AssessmentResponse[]>(
        `/assessments/${assessmentId}/responses`
      ),
  });

  const { data: scores } = useQuery({
    queryKey: ["scores", assessmentId],
    queryFn: () =>
      apiClient.get<AssessmentScores>(
        `/assessments/${assessmentId}/scores`
      ),
    enabled: assessment?.status === "scored" || assessment?.status === "published",
  });

  const isLoading = loadingAssessment || loadingTemplate;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!assessment || !template) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Assessment not found
        </h2>
        <Link href="/assessments" className="btn-secondary mt-4">
          Back to Assessments
        </Link>
      </div>
    );
  }

  const responseMap: Record<string, unknown> = {};
  responses?.forEach((r) => {
    responseMap[r.item_id] = r.value;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/assessments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            {template.name} - {assessment.academic_year}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Read-only review of submitted responses
          </p>
        </div>
        <button className="btn-secondary">
          <Download className="mr-1.5 h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Scores summary */}
      {scores && (
        <div className="card bg-gradient-to-r from-indigo-50 to-blue-50">
          <h2 className="text-lg font-semibold text-slate-900">
            Assessment Scores
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Overall Score</p>
              <p className="text-3xl font-bold text-indigo-600">
                {scores.overall_percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">
                {scores.overall_score} / {scores.overall_max_score}
              </p>
            </div>
            {scores.theme_scores.map((ts) => (
              <div key={ts.theme_id} className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">{ts.theme_name}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {ts.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">
                  {ts.score} / {ts.max_score}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responses by theme */}
      {template.themes.map((theme) => (
        <div key={theme.id} className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {theme.name}
          </h2>
          {theme.description && (
            <p className="mb-4 text-sm text-slate-600">{theme.description}</p>
          )}
          <div className="space-y-4">
            {theme.items.map((item) => {
              const value = responseMap[item.id];
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        <span className="mr-2 text-slate-400">
                          {item.code}
                        </span>
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {item.field_type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {value !== undefined && value !== null && value !== "" ? (
                      typeof value === "object" ? (
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value)
                      )
                    ) : (
                      <span className="italic text-slate-400">
                        No response
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
