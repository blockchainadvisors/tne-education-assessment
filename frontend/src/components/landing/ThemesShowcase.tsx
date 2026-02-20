import {
  BookOpen,
  Users,
  Shield,
  Database,
  Banknote,
} from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const themes = [
  {
    key: "TL",
    name: "Teaching & Learning",
    weight: 25,
    icon: BookOpen,
    color: "bg-indigo-500",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    items: 12,
  },
  {
    key: "SE",
    name: "Student Experience",
    weight: 20,
    icon: Users,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    items: 11,
  },
  {
    key: "GV",
    name: "Governance",
    weight: 25,
    icon: Shield,
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
    textColor: "text-amber-600",
    items: 10,
  },
  {
    key: "IM",
    name: "Information Management",
    weight: 15,
    icon: Database,
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
    items: 9,
  },
  {
    key: "FN",
    name: "Finance",
    weight: 15,
    icon: Banknote,
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
    items: 10,
  },
];

export function ThemesShowcase() {
  return (
    <section id="themes" className="bg-gradient-to-b from-slate-50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Five quality themes, one holistic view
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Assessments cover every dimension of transnational education
              quality, weighted by importance.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {themes.map((theme, i) => (
            <ScrollReveal key={theme.key} delay={i * 80}>
              <div className="card group text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${theme.lightColor} ${theme.textColor}`}
                >
                  <theme.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  {theme.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {theme.items} items
                </p>
                <div className="mt-3 text-2xl font-bold text-slate-800">
                  {theme.weight}%
                </div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Weight
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Stacked weight bar */}
        <ScrollReveal>
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="flex h-3 overflow-hidden rounded-full">
              {themes.map((theme) => (
                <div
                  key={theme.key}
                  className={`${theme.color} transition-all duration-500`}
                  style={{ width: `${theme.weight}%` }}
                  title={`${theme.name}: ${theme.weight}%`}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              {themes.map((theme) => (
                <div key={theme.key} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${theme.color}`} />
                  <span className="text-xs text-slate-500">{theme.key}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
