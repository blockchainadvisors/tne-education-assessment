import { Check } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const benefits = [
  "Compare across all five quality themes",
  "Anonymised peer data preserves confidentiality",
  "Filter by region, institution type, or partnership model",
  "Track year-over-year improvement trends",
];

const bars = [
  { label: "Teaching", yours: 82, peer: 71 },
  { label: "Student Exp", yours: 75, peer: 68 },
  { label: "Governance", yours: 80, peer: 77 },
  { label: "Info Mgmt", yours: 68, peer: 72 },
  { label: "Finance", yours: 85, peer: 74 },
];

export function BenchmarkingHighlight() {
  return (
    <section className="bg-slate-900 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left text */}
          <ScrollReveal>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Benchmark against your peers
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                Understand where your institution stands relative to peers
                delivering similar programmes. Our benchmarking engine
                anonymises and aggregates data to give you actionable
                comparative insights.
              </p>
              <ul className="mt-8 space-y-3">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-slate-300"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Right mock chart */}
          <ScrollReveal delay={200}>
            <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-slate-700">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">
                  Your Institution vs Peer Median
                </h3>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" />
                    Yours
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-500" />
                    Peer Median
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {bars.map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {bar.label}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {bar.yours}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-slate-700">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
                        style={{ width: `${bar.yours}%` }}
                      />
                      {/* Peer median marker */}
                      <div
                        className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-slate-400"
                        style={{ left: `${bar.peer}%` }}
                        title={`Peer median: ${bar.peer}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
