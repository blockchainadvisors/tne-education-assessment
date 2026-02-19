"use client";

import { BarChart3, Info } from "lucide-react";
import { PageHeader, Alert, EmptyState } from "@/components/ui";

export default function BenchmarksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Benchmarks"
        description="Compare your institution's performance against peer institutions."
      />

      <div className="card">
        <EmptyState
          icon={BarChart3}
          title="Insufficient Peer Data"
          description="Benchmark comparisons require a minimum number of peer institutions to have completed assessments. As more institutions join the platform and submit assessments, comparative data will become available."
        />
        <Alert variant="info" className="mt-6">
          <strong>Phase 1:</strong> Benchmarking features will be fully
          activated once sufficient peer data is collected. Your submitted
          assessments contribute to building the benchmark dataset.
        </Alert>
      </div>
    </div>
  );
}
