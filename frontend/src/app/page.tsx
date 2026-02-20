import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { ThemesShowcase } from "@/components/landing/ThemesShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BenchmarkingHighlight } from "@/components/landing/BenchmarkingHighlight";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesGrid />
        <ThemesShowcase />
        <HowItWorks />
        <BenchmarkingHighlight />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
