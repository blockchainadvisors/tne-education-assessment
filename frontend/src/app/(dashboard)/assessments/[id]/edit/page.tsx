"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Send,
  AlertCircle,
} from "lucide-react";
import { Spinner, ConfirmDialog } from "@/components/ui";
import { useAssessment } from "@/hooks/useAssessment";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AssessmentForm } from "@/components/forms/AssessmentForm";
import { apiClient } from "@/lib/api-client";
import type { AssessmentResponse } from "@/lib/types";

export default function AssessmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const {
    assessment,
    template,
    responses,
    isLoading,
    error,
    refetch,
  } = useAssessment(assessmentId);

  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, unknown>
  >({});
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Build a map of item_id -> value from saved responses + pending changes.
  // Backend stores values wrapped in JSON objects like { value: X }, { text: X },
  // { selected: [...] }, { years: [...] }, etc. Unwrap simple wrappers so
  // renderers receive primitives; leave structured objects as-is.
  const responseMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    if (responses) {
      responses.forEach((r: AssessmentResponse) => {
        const v = r.value;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          const obj = v as Record<string, unknown>;
          const keys = Object.keys(obj);
          // Unwrap { value: X } or { text: X } single-key wrappers
          if (keys.length === 1 && (keys[0] === "value" || keys[0] === "text")) {
            map[r.item_id] = obj[keys[0]];
            return;
          }
        }
        map[r.item_id] = v;
      });
    }
    return { ...map, ...pendingChanges };
  }, [responses, pendingChanges]);

  // Save handler
  const saveChanges = useCallback(
    async (changes: Record<string, unknown>) => {
      if (Object.keys(changes).length === 0) return;
      setSaveStatus("saving");
      try {
        const responses = Object.entries(changes).map(([itemId, value]) => ({
          item_id: itemId,
          value: typeof value === "object" && value !== null ? value : { value },
        }));
        await apiClient.put(`/assessments/${assessmentId}/responses`, { responses });
        setPendingChanges({});
        setSaveStatus("saved");
        refetch();
        // Reset saved status after 3s
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("error");
      }
    },
    [assessmentId, refetch]
  );

  // Auto-save with 2s debounce
  useAutoSave(pendingChanges, saveChanges, 2000);

  function handleFieldChange(itemId: string, value: unknown) {
    setPendingChanges((prev) => ({ ...prev, [itemId]: value }));
    setSaveStatus("idle");
  }

  async function handleSubmit() {
    // Save any pending changes first
    if (Object.keys(pendingChanges).length > 0) {
      await saveChanges(pendingChanges);
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/assessments/${assessmentId}/submit`);
      router.push(`/assessments/${assessmentId}/review`);
    } catch {
      setSubmitting(false);
    }
  }

  // Calculate progress
  const progress = useMemo(() => {
    if (!template) return { completed: 0, total: 0, percentage: 0 };
    const allItems = template.themes.flatMap((t) => t.items);
    const total = allItems.length;
    const completed = allItems.filter((item) => {
      const val = responseMap[item.id];
      return val !== undefined && val !== null && val !== "";
    }).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [template, responseMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !assessment || !template) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Failed to load assessment
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {error?.message || "The assessment could not be found."}
        </p>
        <Link href="/assessments" className="btn-secondary mt-4">
          Back to Assessments
        </Link>
      </div>
    );
  }

  const themes = template.themes;
  const activeTheme = themes[activeThemeIndex];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/assessments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            {template.name} - {assessment.academic_year}
          </h1>
        </div>
        {/* Save status indicator */}
        <span className="flex items-center gap-1.5 text-sm">
          {saveStatus === "saving" && (
            <>
              <Spinner size="sm" className="text-slate-400" />
              <span className="text-slate-500">Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600">Saved</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Save failed</span>
            </>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="text-slate-600">
            {progress.completed} / {progress.total} items ({progress.percentage}
            %)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Main content area with theme sidebar */}
      <div className="flex gap-6">
        {/* Theme sidebar */}
        <nav className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Themes
            </p>
            {themes.map((theme, idx) => {
              const themeItems = theme.items;
              const themeCompleted = themeItems.filter((item) => {
                const val = responseMap[item.id];
                return val !== undefined && val !== null && val !== "";
              }).length;

              return (
                <button
                  key={theme.id}
                  onClick={() => setActiveThemeIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    idx === activeThemeIndex
                      ? "bg-brand-50 font-semibold text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{theme.name}</span>
                  <span
                    className={`ml-2 text-xs ${
                      themeCompleted === themeItems.length
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {themeCompleted}/{themeItems.length}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile theme selector */}
        <div className="lg:hidden">
          <select
            value={activeThemeIndex}
            onChange={(e) => setActiveThemeIndex(Number(e.target.value))}
            className="input-field"
          >
            {themes.map((theme, idx) => {
              const themeItems = theme.items;
              const themeCompleted = themeItems.filter((item) => {
                const val = responseMap[item.id];
                return val !== undefined && val !== null && val !== "";
              }).length;
              return (
                <option key={theme.id} value={idx}>
                  {theme.name} ({themeCompleted}/{themeItems.length})
                </option>
              );
            })}
          </select>
        </div>

        {/* Form content */}
        <div className="min-w-0 flex-1">
          {activeTheme && (
            <AssessmentForm
              theme={activeTheme}
              responseMap={responseMap}
              onFieldChange={handleFieldChange}
              disabled={assessment.status !== "draft"}
            />
          )}

          {/* Section navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
            <div>
              {activeThemeIndex > 0 && (
                <button
                  onClick={() => {
                    setActiveThemeIndex(activeThemeIndex - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="btn-secondary"
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeThemeIndex < themes.length - 1 ? (
                <button
                  onClick={() => {
                    setActiveThemeIndex(activeThemeIndex + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="btn-primary"
                >
                  Next
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => saveChanges(pendingChanges)}
                    disabled={
                      Object.keys(pendingChanges).length === 0 ||
                      saveStatus === "saving"
                    }
                    className="btn-secondary"
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" className="text-white" />
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-4 w-4" />
                        Submit Assessment
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showSubmitConfirm}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmit();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
        title="Submit Assessment"
        description="Are you sure you want to submit this assessment? Once submitted, you won't be able to edit your responses."
        confirmLabel="Submit Assessment"
        variant="default"
      />
    </div>
  );
}
