import { Star } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const testimonials = [
  {
    quote:
      "The AI scoring has transformed our review process. What used to take weeks now takes hours, with more consistent and transparent results.",
    name: "Dr Sarah Mitchell",
    role: "Quality Director",
    org: "University of Western Australia",
    initials: "SM",
    bg: "bg-brand-600",
  },
  {
    quote:
      "Benchmarking against peer institutions gave us the evidence we needed to secure additional funding for our TNE programme improvements.",
    name: "Prof James Okonkwo",
    role: "TNE Programme Lead",
    org: "University of Lagos",
    initials: "JO",
    bg: "bg-emerald-600",
  },
  {
    quote:
      "The platform brought rigour and consistency to our quality assurance. The automated reports alone save our team dozens of hours each cycle.",
    name: "Dame Helen Carter",
    role: "Vice-Chancellor",
    org: "Northumbria University",
    initials: "HC",
    bg: "bg-amber-600",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Trusted by quality leaders
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              See how institutions are using the platform to elevate their TNE
              standards.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="card flex h-full flex-col justify-between">
                {/* Stars */}
                <div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-slate-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${t.bg} text-sm font-semibold text-white`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.role}, {t.org}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
