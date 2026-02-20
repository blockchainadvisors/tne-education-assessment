import {
  ClipboardCheck,
  Layers,
  Sparkles,
  Timer,
} from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const stats = [
  { icon: ClipboardCheck, value: "52", label: "Assessment Items" },
  { icon: Layers, value: "5", label: "Quality Themes" },
  { icon: Sparkles, value: "4", label: "AI Dimensions" },
  { icon: Timer, value: "<2 min", label: "Scoring Time" },
];

export function StatsBar() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 100}>
              <div className="flex flex-col items-center gap-2 text-center">
                <stat.icon className="h-6 w-6 text-brand-400" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
