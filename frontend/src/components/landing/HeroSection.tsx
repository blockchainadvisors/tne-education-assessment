import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-blue-50 pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            <Sparkles className="h-4 w-4" />
            AI-Powered Quality Assessment
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Elevate Transnational Education Standards
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            A comprehensive platform that combines structured assessment
            frameworks with AI-powered scoring, automated reporting, and peer
            benchmarking to drive continuous improvement in TNE quality.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="btn-primary px-6 py-3 text-base animate-pulse-ring"
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary px-6 py-3 text-base"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Dashboard mock-up */}
        <DashboardMockup />
      </div>
    </section>
  );
}
