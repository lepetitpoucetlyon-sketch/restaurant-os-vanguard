import { Metadata } from 'next';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { PricingSection } from './components/PricingSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CTASection } from './components/CTASection';
import { LandingFooter } from './components/LandingFooter';

export const metadata: Metadata = {
    title: "Restaurant OS | Le Système d'Exploitation Souverain pour la Restauration",
    description: "Le premier OS Local-First, Stateless et Grade X pour les restaurateurs exigeants. Automatisation, Intelligence Artificielle et Souveraineté totale.",
    keywords: ["Restaurant OS", "Stateless Restaurant", "Local-First ERP", "IA Restauration", "Vanguard Architecture"],
    openGraph: {
        title: "Restaurant OS - L'Empire Technologique",
        description: "Reprenez le contrôle total de votre restaurant avec une technologie indestructible.",
        images: ['/images/vanguard-banner.jpg'],
    },
};

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
