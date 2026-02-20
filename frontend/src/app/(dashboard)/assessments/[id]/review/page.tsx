"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronRight,
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Spinner, Alert, Badge } from "@/components/ui";
import { ResponseDisplay } from "@/components/forms/ResponseDisplay";
import { apiClient } from "@/lib/api-client";
import type {
  Assessment,
  AssessmentTemplate,
  AssessmentResponse,
  AssessmentScores,
  ItemScore,
} from "@/lib/types";

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-50";
  if (score >= 80) return "bg-emerald-50";
  if (score >= 60) return "bg-amber-50";
  return "bg-red-50";
}

function ScoreIcon({ score }: { score: number | null }) {
  if (score === null) return <AlertCircle className="h-4 w-4 text-slate-400" />;
  if (score >= 80)
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (score >= 60)
    return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="default">Not scored</Badge>;
  const variant =
    score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  return <Badge variant={variant}>{score.toFixed(0)}/100</Badge>;
}

function AiFeedbackPanel({ feedback }: { feedback: string | null }) {
  if (!feedback) return null;

  // Parse structured feedback: "Strengths: ... | Areas for improvement: ... | general feedback"
  const sections = feedback.split(" | ");
  const strengths: string[] = [];
  const improvements: string[] = [];
  const general: string[] = [];

  for (const section of sections) {
    if (section.startsWith("Strengths: ")) {
      strengths.push(
        ...section
          .replace("Strengths: ", "")
          .split("; ")
          .filter(Boolean)
      );
    } else if (section.startsWith("Areas for improvement: ")) {
      improvements.push(
        ...section
          .replace("Areas for improvement: ", "")
          .split("; ")
          .filter(Boolean)
      );
    } else {
      general.push(section);
    }
  }

  const hasStructured = strengths.length > 0 || improvements.length > 0;

  return (
    <div className="mt-3 space-y-3">
      {hasStructured ? (
        <>
          {strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-emerald-700">
                Strengths
              </p>
              <ul className="space-y-1">
                {strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs leading-relaxed text-slate-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {improvements.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-amber-700">
                Areas for Improvement
              </p>
              <ul className="space-y-1">
                {improvements.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs leading-relaxed text-slate-700"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {general.length > 0 && (
            <div className="border-t border-slate-100 pt-2">
              <p className="text-xs leading-relaxed text-slate-600">
                {general.join(" ")}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs leading-relaxed text-slate-600">{feedback}</p>
      )}
    </div>
  );
}

export default function AssessmentReviewPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => apiClient.get<Assessment>(`/assessments/${assessmentId}`),
  });

  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ["template", assessment?.template_id],
    queryFn: () =>
      apiClient.get<AssessmentTemplate>(
        `/assessments/templates/${assessment!.template_id}`
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
    enabled:
      assessment?.status === "scored" ||
      assessment?.status === "report_generated",
  });

  const isLoading = loadingAssessment || loadingTemplate;

  // Build item score lookup: item_code -> ItemScore
  const itemScoreMap: Record<string, ItemScore> = {};
  if (scores) {
    for (const ts of scores.theme_scores) {
      for (const is_ of ts.item_scores) {
        itemScoreMap[is_.item_code] = is_;
      }
    }
  }

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandAll) {
      setExpandedItems(new Set());
      setExpandAll(false);
    } else {
      const allIds = new Set<string>();
      template?.themes.forEach((t) => t.items.forEach((i) => allIds.add(i.id)));
      setExpandedItems(allIds);
      setExpandAll(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
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

  // Build response map
  const responseMap: Record<string, unknown> = {};
  responses?.forEach((r) => {
    const v = r.value;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length === 1 && (keys[0] === "value" || keys[0] === "text")) {
        responseMap[r.item_id] = obj[keys[0]];
        return;
      }
    }
    responseMap[r.item_id] = v;
  });

  const hasScores = !!scores;

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
            {hasScores
              ? "Review AI scores and reasoning for each item"
              : "Read-only review of submitted responses"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasScores && (
            <button
              onClick={toggleAll}
              className="btn-secondary text-sm"
            >
              {expandAll ? "Collapse All" : "Expand All AI Detail"}
            </button>
          )}
          <button
            className="btn-secondary"
            disabled
            title="PDF export coming soon"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Scores summary */}
      {scores && (
        <div className="card bg-gradient-to-r from-brand-50 to-blue-50">
          <h2 className="text-lg font-semibold text-slate-900">
            Assessment Scores
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Overall Score</p>
              <p className="text-3xl font-bold text-brand-600">
                {scores.overall_percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">
                {scores.overall_score} / {scores.overall_max_score}
              </p>
            </div>
            {scores.theme_scores.map((ts) => (
              <div
                key={ts.theme_id}
                className="rounded-lg bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-600">{ts.theme_name}</p>
                <p className={`text-2xl font-bold ${scoreColor(ts.score)}`}>
                  {ts.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">
                  {ts.item_scores.length} items scored
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responses by theme with AI scoring detail */}
      {template.themes.map((theme) => {
        const themeScore = scores?.theme_scores.find(
          (ts) => ts.theme_id === theme.id
        );

        return (
          <div key={theme.id} className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {theme.name}
              </h2>
              {themeScore && (
                <span
                  className={`text-lg font-bold ${scoreColor(themeScore.score)}`}
                >
                  {themeScore.percentage.toFixed(1)}%
                </span>
              )}
            </div>
            {theme.description && (
              <p className="mb-4 mt-1 text-sm text-slate-600">
                {theme.description}
              </p>
            )}

            <div className="space-y-3">
              {theme.items.map((item) => {
                const value = responseMap[item.id];
                const itemScore = itemScoreMap[item.code];
                const isExpanded = expandedItems.has(item.id);
                const hasAiDetail =
                  itemScore?.ai_feedback && itemScore.ai_feedback.length > 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border transition-colors ${
                      itemScore
                        ? `border-l-4 ${
                            (itemScore.ai_score ?? 0) >= 80
                              ? "border-l-emerald-400 border-slate-200"
                              : (itemScore.ai_score ?? 0) >= 60
                                ? "border-l-amber-400 border-slate-200"
                                : "border-l-red-400 border-slate-200"
                          }`
                        : "border-slate-200"
                    }`}
                  >
                    {/* Item header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            <span className="mr-2 font-mono text-xs text-slate-400">
                              {item.code}
                            </span>
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {itemScore && (
                            <ScoreBadge score={itemScore.ai_score} />
                          )}
                          <Badge variant="default" className="hidden sm:inline-flex">
                            {item.field_type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>

                      {/* Response value */}
                      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2.5">
                        <ResponseDisplay item={item} value={value} />
                      </div>

                      {/* AI scoring toggle */}
                      {itemScore && (
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          <Bot className="h-3.5 w-3.5" />
                          AI Scoring Detail
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expanded AI detail panel */}
                    {isExpanded && itemScore && (
                      <div
                        className={`border-t border-slate-100 px-4 pb-4 pt-3 ${scoreBg(itemScore.ai_score)}`}
                      >
                        <div className="flex items-center gap-3">
                          <ScoreIcon score={itemScore.ai_score} />
                          <div>
                            <span
                              className={`text-sm font-bold ${scoreColor(itemScore.ai_score)}`}
                            >
                              {itemScore.ai_score !== null
                                ? `${itemScore.ai_score.toFixed(0)}/100`
                                : "Not scored"}
                            </span>
                            <span className="ml-2 text-xs text-slate-500">
                              {itemScore.field_type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {hasAiDetail && (
                          <AiFeedbackPanel feedback={itemScore.ai_feedback} />
                        )}

                        {!hasAiDetail && itemScore.ai_feedback && (
                          <p className="mt-2 text-xs text-slate-600">
                            {itemScore.ai_feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
