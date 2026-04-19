"use client";

import { LandingNavbar } from "@/components/LandingNavbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { LandingFooter } from "@/components/LandingFooter";

export default function LandingPage() {
    return (
        <main className="bg-[#0a0a0a] min-h-screen overflow-x-hidden">
            <LandingNavbar />
            <HeroSection />
            <FeaturesSection />
            <PricingSection />
            <TestimonialsSection />
            <CTASection />
            <LandingFooter />
        </main>
    );
}
