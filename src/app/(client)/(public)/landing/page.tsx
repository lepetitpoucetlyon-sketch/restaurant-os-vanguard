import { Metadata } from 'next';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { PricingSection } from './components/PricingSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CTASection } from './components/CTASection';
import { LandingFooter } from './components/LandingFooter';

import { getBrandAsset } from '@/shared/nexus/tokens/assets';

export const metadata: Metadata = {
    title: "Restaurant OS | Plateforme de Gestion pour la Restauration",
    description: "Caisse tactile, cuisine KDS, gestion des stocks et conformité fiscale NF525 pour la restauration. Fonctionnement hors-ligne et multi-établissements.",
    keywords: ["Restaurant OS", "Caisse Enregistreuse", "Local-First ERP", "Logiciel Restauration", "Gestion Restaurant NF525"],
    openGraph: {
        title: "Restaurant OS - La Plateforme de Gestion pour la Restauration",
        description: "Reprenez le contrôle de votre établissement avec une solution fiable, rapide et conforme NF525.",
        images: [getBrandAsset('banner')],
    },
    icons: {
        icon: getBrandAsset('favicon'),
    },
};

export default function LandingPage() {
    return (
        <main className="bg-surface-bg min-h-[100dvh] overflow-x-hidden">
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
