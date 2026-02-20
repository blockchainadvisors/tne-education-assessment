"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Assessment,
  AssessmentScores,
  BenchmarkComparison,
  User,
} from "@/lib/types";

export interface StatusCounts {
  draft: number;
  underReview: number;
  scored: number;
  completed: number;
}

export interface YearScore {
  academicYear: string;
  overallPercentage: number;
}

export function useDashboardData() {
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => apiClient.get<User>("/users/me"),
  });

  const assessmentsQuery = useQuery({
    queryKey: ["assessments"],
    queryFn: () => apiClient.get<Assessment[]>("/assessments"),
  });

  const items = assessmentsQuery.data || [];

  const statusCounts: StatusCounts = {
    draft: items.filter((a) => a.status === "draft").length,
    underReview: items.filter(
      (a) => a.status === "submitted" || a.status === "under_review"
    ).length,
    scored: items.filter((a) => a.status === "scored").length,
    completed: items.filter((a) => a.status === "report_generated").length,
  };

  // Find latest scored assessment (most recently updated scored/report_generated)
  const scoredAssessments = items
    .filter((a) => a.status === "scored" || a.status === "report_generated")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  const latestScored = scoredAssessments[0];

  const latestScoresQuery = useQuery({
    queryKey: ["scores", latestScored?.id],
    queryFn: () =>
      apiClient.get<AssessmentScores>(
        `/assessments/${latestScored!.id}/scores`
      ),
    enabled: !!latestScored,
  });

  // Fetch scores for all scored assessments (for YoY trend)
  const allScoreQueries = useQueries({
    queries: scoredAssessments.map((a) => ({
      queryKey: ["scores", a.id],
      queryFn: () =>
        apiClient.get<AssessmentScores>(`/assessments/${a.id}/scores`),
    })),
  });

  const allYearScores: YearScore[] = scoredAssessments
    .map((a, i) => {
      const scores = allScoreQueries[i]?.data;
      if (!scores) return null;
      return {
        academicYear: a.academic_year,
        overallPercentage: scores.overall_percentage,
      };
    })
    .filter((x): x is YearScore => x !== null)
    .sort((a, b) => a.academicYear.localeCompare(b.academicYear));

  const benchmarksQuery = useQuery({
    queryKey: ["benchmarks", latestScored?.id],
    queryFn: () =>
      apiClient.get<BenchmarkComparison>(
        `/benchmarks/compare/${latestScored!.id}`
      ),
    enabled: !!latestScored,
  });

  return {
    user: userQuery.data,
    assessments: items,
    latestScores: latestScoresQuery.data,
    allYearScores,
    benchmarks: benchmarksQuery.data,
    statusCounts,
    loading: {
      user: userQuery.isLoading,
      assessments: assessmentsQuery.isLoading,
      scores: latestScoresQuery.isLoading,
      yearScores: allScoreQueries.some((q) => q.isLoading),
      benchmarks: benchmarksQuery.isLoading,
    },
  };
}
