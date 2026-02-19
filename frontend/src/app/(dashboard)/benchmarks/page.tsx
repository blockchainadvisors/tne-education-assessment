"use client";

import { BarChart3, Info } from "lucide-react";

export default function BenchmarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Benchmarks</h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare your institution&apos;s performance against peer institutions.
        </p>
      </div>

      <div className="card flex flex-col items-center py-16 text-center">
        <div className="rounded-full bg-indigo-100 p-4">
          <BarChart3 className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-lg font-semibold text-slate-900">
          Insufficient Peer Data
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Benchmark comparisons require a minimum number of peer institutions to
          have completed assessments. As more institutions join the platform and
          submit assessments, comparative data will become available.
        </p>
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-left">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800">
            <strong>Phase 1:</strong> Benchmarking features will be fully
            activated once sufficient peer data is collected. Your submitted
            assessments contribute to building the benchmark dataset.
          </p>
        </div>
      </div>
    </div>
  );
}
