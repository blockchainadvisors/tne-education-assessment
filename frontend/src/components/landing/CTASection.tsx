import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function CTASection() {
  return (
    <section className="bg-gradient-to-r from-brand-600 to-brand-800 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your TNE quality assurance?
            </h2>
            <p className="mt-4 text-lg text-brand-100">
              Join institutions that are using AI-powered assessment to elevate
              their transnational education standards.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
              >
                Register Your Institution
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
