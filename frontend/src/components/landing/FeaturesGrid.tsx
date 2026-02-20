import {
  Brain,
  FileText,
  BarChart3,
  FileSearch,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Scoring",
    description:
      "Claude AI evaluates text responses across four dimensions — completeness, evidence quality, strategic depth, and risk awareness — delivering consistent, transparent scores.",
  },
  {
    icon: FileText,
    title: "Automated Reports",
    description:
      "Generate comprehensive quality assessment reports with executive summaries, theme-by-theme analysis, and actionable recommendations.",
  },
  {
    icon: BarChart3,
    title: "Peer Benchmarking",
    description:
      "Compare your performance against anonymised peer institutions across themes and items to identify strengths and improvement areas.",
  },
  {
    icon: FileSearch,
    title: "Document Intelligence",
    description:
      "Upload supporting documents and let AI extract relevant evidence to pre-populate assessment responses and verify claims.",
  },
  {
    icon: ShieldAlert,
    title: "Predictive Risk Analysis",
    description:
      "Identify at-risk partnerships early with AI-driven trend analysis and risk scoring across governance and financial indicators.",
  },
  {
    icon: Lock,
    title: "Multi-Tenant Security",
    description:
      "Enterprise-grade isolation ensures each institution's data is completely separated with role-based access controls and row-level security.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need for TNE quality assurance
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              A purpose-built platform that combines AI intelligence with
              structured assessment frameworks.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="card group transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
