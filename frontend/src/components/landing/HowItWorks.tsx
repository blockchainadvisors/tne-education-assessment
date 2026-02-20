import {
  ClipboardList,
  Send,
  Brain,
  BarChart3,
} from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    icon: ClipboardList,
    title: "Create Assessment",
    description:
      "Select a partner institution and begin filling out 52 items across five quality themes.",
  },
  {
    icon: Send,
    title: "Submit for Review",
    description:
      "Submit your completed assessment for quality review and AI-powered scoring.",
  },
  {
    icon: Brain,
    title: "AI Scoring",
    description:
      "Claude AI scores text responses and validates quantitative data in under two minutes.",
  },
  {
    icon: BarChart3,
    title: "Reports & Benchmarks",
    description:
      "Receive detailed reports and benchmark your performance against peer institutions.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From assessment to insight in four steps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              A streamlined workflow designed for busy quality assurance teams.
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop horizontal / Mobile vertical */}
        <div className="mx-auto mt-14 max-w-4xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 150}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Connector line (desktop) */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-1/2 top-6 hidden h-0.5 w-full border-t-2 border-dashed border-slate-200 lg:block" />
                  )}

                  {/* Connector line (mobile) */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-1/2 top-12 h-8 w-0.5 -translate-x-1/2 border-l-2 border-dashed border-slate-200 lg:hidden" />
                  )}

                  {/* Step circle */}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                    <step.icon className="h-5 w-5" />
                  </div>

                  {/* Step number */}
                  <span className="mt-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>

                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
