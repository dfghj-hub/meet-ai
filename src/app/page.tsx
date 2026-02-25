"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PlatformShowcase } from "@/components/landing/PlatformShowcase";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-36 top-1/4 h-[32rem] w-[32rem] rounded-full bg-orange-600/20 blur-[140px] animate-float-slow" />
        <div className="absolute -right-36 top-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-600/15 blur-[120px] animate-float-slower" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-600/10 blur-[90px] animate-float-slow" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-12">
        <div className="animate-slide-up">
          <HeroSection />
        </div>
        <HowItWorks />
        <PlatformShowcase />
        <Footer />
      </div>
    </main>
  );
}
