"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Bot,
  RefreshCw,
  Download,
  Loader2,
  Eye,
} from "lucide-react";
import { Spinner, Alert, Badge } from "@/components/ui";
import { ReportViewer } from "@/components/reports/ReportViewer";
import { apiClient } from "@/lib/api-client";
import type { Assessment, Report, AIJob } from "@/lib/types";

export default function AssessmentReportPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const queryClient = useQueryClient();
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const token = apiClient.getAccessToken();
      const res = await fetch(`/api/v1/assessments/${assessmentId}/report/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TNE-Report-${assessmentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF not available. Generate a report first.");
    } finally {
      setPdfLoading(false);
    }
  }, [assessmentId]);

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => apiClient.get<Assessment>(`/assessments/${assessmentId}`),
  });

  const { data: report, isLoading: loadingReport, error: reportError } = useQuery({
    queryKey: ["report", assessmentId],
    queryFn: () =>
      apiClient.get<Report>(`/assessments/${assessmentId}/report`),
    enabled:
      assessment?.status === "scored" ||
      assessment?.status === "report_generated",
    retry: false,
  });

  // Check for active job on page load (handles navigation away and back)
  const { data: activeJob } = useQuery({
    queryKey: ["active-report-job", assessmentId],
    queryFn: () =>
      apiClient.get<AIJob | null>(
        `/assessments/${assessmentId}/report/active-job`
      ),
    enabled:
      !pollingJobId &&
      (assessment?.status === "scored" ||
        assessment?.status === "report_generated"),
    staleTime: 0,
  });

  // Resume polling if an active job is found
  useEffect(() => {
    if (activeJob?.id && !pollingJobId) {
      setPollingJobId(activeJob.id);
    }
  }, [activeJob, pollingJobId]);

  // Poll job status while generating
  const { data: jobStatus } = useQuery({
    queryKey: ["ai-job", pollingJobId],
    queryFn: () => apiClient.get<AIJob>(`/jobs/${pollingJobId}`),
    enabled: !!pollingJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") {
        return false;
      }
      return 3000;
    },
  });

  // When job completes or fails, refresh queries and stop polling
  useEffect(() => {
    if (!pollingJobId) return;
    if (jobStatus?.status === "completed") {
      setPollingJobId(null);
      queryClient.invalidateQueries({ queryKey: ["report", assessmentId] });
      queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
      queryClient.invalidateQueries({ queryKey: ["active-report-job", assessmentId] });
    } else if (jobStatus?.status === "failed") {
      setPollingJobId(null);
      queryClient.invalidateQueries({ queryKey: ["active-report-job", assessmentId] });
    }
  }, [jobStatus?.status, pollingJobId, assessmentId, queryClient]);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient.post<AIJob>(
        `/assessments/${assessmentId}/report/generate`,
        {}
      ),
    onSuccess: (job) => {
      setPollingJobId(job.id);
      queryClient.invalidateQueries({ queryKey: ["active-report-job", assessmentId] });
    },
  });

  const isLoading = loadingAssessment;
  const isGenerating =
    generateMutation.isPending ||
    (pollingJobId && jobStatus?.status !== "failed") ||
    !!activeJob?.id;
  const canGenerate =
    assessment?.status === "scored" || assessment?.status === "report_generated";
  const hasReport = !!report && !reportError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Assessment not found
        </h2>
        <Link href="/assessments" className="btn-secondary mt-4 inline-block">
          Back to Assessments
        </Link>
      </div>
    );
  }

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
            Assessment Report &mdash; {assessment.academic_year}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {hasReport
              ? "AI-generated quality assessment report"
              : "Generate an AI-powered assessment report"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/assessments/${assessmentId}/review`}
            className="btn-secondary text-sm"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            View Scores
          </Link>
          {canGenerate && (
            <button
              onClick={() => generateMutation.mutate()}
              disabled={!!isGenerating}
              className="btn-primary text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : hasReport ? (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Bot className="mr-1.5 h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>
          )}
          <button
            className="btn-secondary text-sm"
            disabled={pdfLoading || !hasReport}
            title={hasReport ? "Download report as PDF" : "Generate a report first"}
            onClick={handleExportPdf}
          >
            {pdfLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Generation progress */}
      {isGenerating && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
            <div className="flex-1">
              <p className="font-medium text-brand-800">
                Generating report...
              </p>
              <p className="mt-0.5 text-sm text-brand-600">
                {jobStatus?.progress
                  ? `Progress: ${(jobStatus.progress * 100).toFixed(0)}%`
                  : "Queued — AI is analyzing your assessment data"}
              </p>
            </div>
          </div>
          {jobStatus?.progress !== undefined && jobStatus.progress > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${jobStatus.progress * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Job failed */}
      {jobStatus?.status === "failed" && (
        <Alert variant="error">
          Report generation failed: {jobStatus.error_message || "Unknown error"}.
          Please try again.
        </Alert>
      )}

      {/* Not scored yet */}
      {!canGenerate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <FileText className="mx-auto h-10 w-10 text-amber-400" />
          <h3 className="mt-3 font-semibold text-slate-900">
            Assessment Not Yet Scored
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Reports can only be generated after the assessment has been scored
            by AI. Current status:{" "}
            <Badge variant="warning">{assessment.status}</Badge>
          </p>
        </div>
      )}

      {/* Loading report */}
      {loadingReport && canGenerate && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* No report yet */}
      {!loadingReport && !hasReport && canGenerate && !isGenerating && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <Bot className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-semibold text-slate-900">
            No Report Generated Yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Click &ldquo;Generate Report&rdquo; to create an AI-powered
            assessment report with executive summary, theme analyses, and
            strategic recommendations.
          </p>
          <button
            onClick={() => generateMutation.mutate()}
            className="btn-primary mt-4"
          >
            <Bot className="mr-1.5 h-4 w-4" />
            Generate Report
          </button>
        </div>
      )}

      {/* Report viewer */}
      {hasReport && <ReportViewer report={report} />}

      {/* Generation error */}
      {generateMutation.isError && (
        <Alert variant="error">
          Failed to trigger report generation. Please try again.
        </Alert>
      )}
    </div>
  );
}
