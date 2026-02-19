"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { AssessmentTemplate, Assessment } from "@/lib/types";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["templates"],
    queryFn: () => apiClient.get<AssessmentTemplate[]>("/templates"),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const assessment = await apiClient.post<Assessment>("/assessments", {
        template_id: templateId,
        academic_year: academicYear,
      });
      router.push(`/assessments/${assessment.id}/edit`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create assessment. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/assessments"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Create New Assessment
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Select a template and academic year to begin your assessment.
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="template" className="label">
              Assessment Template
            </label>
            {loadingTemplates ? (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates...
              </div>
            ) : (
              <select
                id="template"
                required
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="input-field mt-1.5"
              >
                <option value="">Select a template...</option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (v{t.version})
                  </option>
                ))}
              </select>
            )}
            {templates && templates.length === 0 && (
              <p className="mt-1.5 text-sm text-amber-600">
                No templates available. Please contact your administrator.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="academicYear" className="label">
              Academic Year
            </label>
            <input
              id="academicYear"
              type="text"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="input-field mt-1.5"
              placeholder="e.g. 2024-2025"
              pattern="\d{4}-\d{4}"
              title="Format: YYYY-YYYY (e.g. 2024-2025)"
            />
            <p className="mt-1 text-xs text-slate-500">
              Format: YYYY-YYYY (e.g. 2024-2025)
            </p>
          </div>

          {templateId && templates && (
            <div className="rounded-lg bg-indigo-50 px-4 py-3">
              <p className="text-sm font-medium text-indigo-900">
                Template details
              </p>
              {(() => {
                const selected = templates.find((t) => t.id === templateId);
                if (!selected) return null;
                return (
                  <div className="mt-1 text-sm text-indigo-700">
                    <p>{selected.description || "No description available."}</p>
                    <p className="mt-1">
                      {selected.themes.length} themes with a total of{" "}
                      {selected.themes.reduce(
                        (acc, t) => acc + t.items.length,
                        0
                      )}{" "}
                      items
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || !templateId}
              className="btn-primary"
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Assessment"
              )}
            </button>
            <Link href="/assessments" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
