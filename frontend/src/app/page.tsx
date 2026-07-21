import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ProcessWorkflow } from "@/components/landing/ProcessWorkflow";
import { PerformanceStats } from "@/components/landing/PerformanceStats";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";
export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeatureGrid />
      <ProcessWorkflow />
      <PerformanceStats />
      <Testimonials />
      <FAQ />
      <CTASection />
    </>
  );
}
