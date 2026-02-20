"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  BookOpen,
  Target,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { Report, ReportSection } from "@/lib/types";

interface ReportViewerProps {
  report: Report;
}

function SectionIcon({ title }: { title: string }) {
  const lower = title.toLowerCase();
  if (lower.includes("executive")) return <BookOpen className="h-5 w-5" />;
  if (lower.includes("recommendation")) return <Target className="h-5 w-5" />;
  return <BarChart3 className="h-5 w-5" />;
}

function extractScore(title: string): number | null {
  const match = title.match(/\((\d+(?:\.\d+)?)\/100\)/);
  return match ? parseFloat(match[1]) : null;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-700";
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80)
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 60)
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Developing";
  return "Needs improvement";
}

/** Strip the first heading(s) from the markdown content since the
 *  section card already shows the title. Removes leading `#` or `##`
 *  lines at the very start of the content. */
function stripLeadingHeadings(md: string): string {
  const lines = md.split("\n");
  let i = 0;
  // Skip blank lines then skip h1/h2 headings at the top
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      i++;
      continue;
    }
    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      i++;
      continue;
    }
    break;
  }
  return lines.slice(i).join("\n").trim();
}

function MarkdownContent({ content }: { content: string }) {
  const cleaned = stripLeadingHeadings(content);
  return (
    <div className="report-markdown">
      <ReactMarkdown>{cleaned}</ReactMarkdown>
    </div>
  );
}

function SectionCard({
  section,
  isExpanded,
  onToggle,
  accentColor,
}: {
  section: ReportSection;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor?: string;
}) {
  const score = extractScore(section.title);
  const cleanTitle = section.title.replace(/\s*\(\d+(?:\.\d+)?\/100\)/, "");

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md ${
        accentColor
          ? `border-l-4 ${accentColor} border-slate-200`
          : "border-slate-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/50"
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-brand-50 p-2 text-brand-600">
          <SectionIcon title={section.title} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.95rem] font-semibold text-slate-900">
            {cleanTitle}
          </h3>
        </div>
        {score !== null && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${scoreBadgeClasses(score)}`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-sm font-bold">{score.toFixed(1)}</span>
            <span className="text-xs opacity-60">/100</span>
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 px-6 py-6">
          {/* Score summary bar for theme sections */}
          {score !== null && (
            <div className="mb-5 flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Theme Score
                  </span>
                  <span
                    className={`text-xs font-semibold ${scoreColor(score)}`}
                  >
                    {scoreLabel(score)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      score >= 80
                        ? "bg-emerald-500"
                        : score >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-2xl font-bold ${scoreColor(score)}`}>
                {score.toFixed(1)}
              </span>
            </div>
          )}

          <MarkdownContent content={section.content} />
        </div>
      )}
    </div>
  );
}

// Accent colors for the left border of theme sections
const THEME_ACCENT_COLORS = [
  "border-l-indigo-400",
  "border-l-emerald-400",
  "border-l-amber-400",
  "border-l-purple-400",
  "border-l-rose-400",
  "border-l-cyan-400",
  "border-l-orange-400",
];

export function ReportViewer({ report }: ReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0])
  );

  function toggleSection(index: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const allExpanded = expandedSections.size === report.sections.length;

  function toggleAll() {
    if (allExpanded) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(report.sections.map((_, idx) => idx)));
    }
  }

  // Separate sections by type
  const execSummary = report.sections.find((s) =>
    s.title.toLowerCase().includes("executive")
  );
  const themeSections = report.sections.filter(
    (s) =>
      !s.title.toLowerCase().includes("executive") &&
      !s.title.toLowerCase().includes("recommendation")
  );
  const recommendations = report.sections.find((s) =>
    s.title.toLowerCase().includes("recommendation")
  );

  return (
    <div className="space-y-8">
      {/* Report header card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-brand-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-100 p-3">
              <FileText className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {report.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Generated{" "}
                {new Date(report.generated_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <Badge variant="default">
                  {report.report_type
                    .split("_")
                    .map(
                      (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
                    )
                    .join(" ")}
                </Badge>
                <Badge variant="default">Version {report.version}</Badge>
              </div>
            </div>
          </div>
          <button
            onClick={toggleAll}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      {execSummary && (
        <SectionCard
          section={execSummary}
          isExpanded={expandedSections.has(
            report.sections.indexOf(execSummary)
          )}
          onToggle={() =>
            toggleSection(report.sections.indexOf(execSummary))
          }
        />
      )}

      {/* Theme Analyses */}
      {themeSections.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <BarChart3 className="h-3.5 w-3.5" />
            Theme Analyses
          </h3>
          <div className="space-y-3">
            {themeSections.map((section, i) => {
              const idx = report.sections.indexOf(section);
              return (
                <SectionCard
                  key={idx}
                  section={section}
                  isExpanded={expandedSections.has(idx)}
                  onToggle={() => toggleSection(idx)}
                  accentColor={
                    THEME_ACCENT_COLORS[i % THEME_ACCENT_COLORS.length]
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <Target className="h-3.5 w-3.5" />
            Strategic Recommendations
          </h3>
          <SectionCard
            section={recommendations}
            isExpanded={expandedSections.has(
              report.sections.indexOf(recommendations)
            )}
            onToggle={() =>
              toggleSection(report.sections.indexOf(recommendations))
            }
          />
        </div>
      )}
    </div>
  );
}
