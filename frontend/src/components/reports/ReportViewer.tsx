"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { Report } from "@/lib/types";

interface ReportViewerProps {
  report: Report;
}

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

  function expandAll() {
    setExpandedSections(
      new Set(report.sections.map((_, idx) => idx))
    );
  }

  function collapseAll() {
    setExpandedSections(new Set());
  }

  return (
    <div className="space-y-4">
      {/* Report header */}
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">
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
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {report.report_type
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              Expand all
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible sections */}
      {report.sections.map((section, idx) => {
        const isExpanded = expandedSections.has(idx);
        return (
          <div key={idx} className="card p-0 overflow-hidden">
            <button
              onClick={() => toggleSection(idx)}
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900">
                  {section.title}
                </h3>
                {section.theme_code && (
                  <span className="text-xs text-slate-500">
                    Theme: {section.theme_code}
                  </span>
                )}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-slate-200 px-6 py-4">
                <div
                  className="prose prose-sm prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
