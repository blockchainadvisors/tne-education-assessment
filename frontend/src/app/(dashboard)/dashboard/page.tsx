"use client";

import Link from "next/link";
import { Plus, ClipboardList, ChevronDown } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Spinner, PageHeader, EmptyState } from "@/components/ui";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { OverallScoreGauge } from "@/components/dashboard/OverallScoreGauge";
import { ThemeRadialBars } from "@/components/dashboard/ThemeRadialBars";
import { YearOverYearTrend } from "@/components/dashboard/YearOverYearTrend";
import { BenchmarkComparison } from "@/components/dashboard/BenchmarkComparison";
import { RecentAssessmentsTable } from "@/components/dashboard/RecentAssessmentsTable";
import { RadarChart } from "@/components/dashboard/RadarChart";

export default function DashboardPage() {
  const {
    user,
    assessments,
    latestScores,
    allYearScores,
    benchmarks,
    statusCounts,
    loading,
  } = useDashboardData();

  const hasAssessments = !loading.assessments && assessments.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.full_name ? `, ${user.full_name}` : ""}`}
        description="Here is an overview of your institution's assessment activity."
      />

      {/* Row 1: Status Cards */}
      <StatusCards counts={statusCounts} loading={loading.assessments} />

      {/* Loading state for initial load */}
      {loading.assessments && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading.assessments && assessments.length === 0 && (
        <div className="card">
          <EmptyState
            illustration="/illustrations/empty-assessments.png"
            title="No assessments yet"
            description="Get started by creating your first assessment. Select a template and academic year to begin."
            action={
              <Link href="/assessments/new" className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create your first assessment
              </Link>
            }
          />
        </div>
      )}

      {/* Row 2: Overall Score Gauge | Theme Radial Bars */}
      {hasAssessments && latestScores && (
        <div className="grid gap-6 lg:grid-cols-2">
          <OverallScoreGauge scores={latestScores} />
          <ThemeRadialBars themeScores={latestScores.theme_scores} />
        </div>
      )}

      {/* Skeleton while scores load */}
      {hasAssessments && loading.scores && !latestScores && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card flex items-center justify-center py-16">
            <Spinner />
          </div>
          <div className="card flex items-center justify-center py-16">
            <Spinner />
          </div>
        </div>
      )}

      {/* Row 3: YoY Trend | Benchmark Comparison */}
      {hasAssessments && (
        <div className="grid gap-6 lg:grid-cols-2">
          <YearOverYearTrend data={allYearScores} />
          {benchmarks ? (
            <BenchmarkComparison data={benchmarks} />
          ) : loading.benchmarks ? (
            <div className="card flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : null}
        </div>
      )}

      {/* Row 4: Recent Assessments Table */}
      {(hasAssessments || loading.assessments) && (
        <RecentAssessmentsTable
          assessments={assessments}
          loading={loading.assessments}
        />
      )}

      {/* Row 5: Radar Chart (collapsible) */}
      {latestScores && latestScores.theme_scores.length >= 3 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            Performance Radar
          </summary>
          <div className="card mt-3">
            <RadarChart themeScores={latestScores.theme_scores} />
          </div>
        </details>
      )}
    </div>
  );
}
