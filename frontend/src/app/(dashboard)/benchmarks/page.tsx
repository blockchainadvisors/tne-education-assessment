"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageHeader, Spinner, Alert, EmptyState } from "@/components/ui";
import { BenchmarkComparison } from "@/components/dashboard/BenchmarkComparison";
import type {
  Assessment,
  User,
  BenchmarkComparison as BenchmarkData,
} from "@/lib/types";

export default function BenchmarksPage() {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<
    string | null
  >(null);
  const [countryFilter, setCountryFilter] = useState<string>("tenant");

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => apiClient.get<User>("/users/me"),
  });

  const assessmentsQuery = useQuery({
    queryKey: ["assessments"],
    queryFn: () => apiClient.get<Assessment[]>("/assessments"),
  });

  const tenantCountry = userQuery.data?.tenant?.country;

  // Only scored or report_generated assessments have benchmark data
  const scoredAssessments = (assessmentsQuery.data || [])
    .filter((a) => a.status === "scored" || a.status === "report_generated")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  // Default to latest scored assessment
  const activeId = selectedAssessmentId || scoredAssessments[0]?.id;

  const country =
    countryFilter === "global"
      ? "Global"
      : countryFilter === "tenant"
        ? tenantCountry
        : undefined;

  const benchmarkQuery = useQuery({
    queryKey: ["benchmarks", activeId, country],
    queryFn: () => {
      const params = country ? `?country=${encodeURIComponent(country)}` : "";
      return apiClient.get<BenchmarkData>(
        `/benchmarks/compare/${activeId}${params}`
      );
    },
    enabled: !!activeId,
  });

  const isLoading =
    assessmentsQuery.isLoading || userQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Benchmarks"
          description="Compare your institution's performance against peer institutions."
        />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (scoredAssessments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Benchmarks"
          description="Compare your institution's performance against peer institutions."
        />
        <div className="card">
          <EmptyState
            icon={BarChart3}
            title="No Scored Assessments"
            description="Benchmark comparisons are available once an assessment has been scored. Submit an assessment and have it scored to see how you compare against peers."
          />
        </div>
      </div>
    );
  }

  const activeAssessment = scoredAssessments.find((a) => a.id === activeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benchmarks"
        description="Compare your institution's performance against peer institutions."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Assessment
          </label>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            value={activeId || ""}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
          >
            {scoredAssessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.academic_year} — {a.status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Compare against
          </label>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            {tenantCountry && (
              <option value="tenant">{tenantCountry} peers</option>
            )}
            <option value="global">Global peers</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      {benchmarkQuery.isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : benchmarkQuery.data ? (
        <BenchmarkComparison data={benchmarkQuery.data} />
      ) : benchmarkQuery.isError ? (
        <Alert variant="error">
          Failed to load benchmark data. Please try again.
        </Alert>
      ) : null}

      {/* Context info */}
      {activeAssessment && benchmarkQuery.data?.metrics?.length ? (
        <div className="text-xs text-slate-500">
          Showing {activeAssessment.academic_year} benchmark comparison
          {country ? ` for ${country}` : ""}.
          Sample sizes vary by theme (
          {benchmarkQuery.data.metrics
            .map((m) => `n=${m.sample_size}`)
            .join(", ")}
          ).
        </div>
      ) : null}
    </div>
  );
}
