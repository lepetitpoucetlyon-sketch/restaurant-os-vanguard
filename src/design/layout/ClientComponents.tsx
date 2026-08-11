/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LayoutResolver } from "./LayoutResolver";
import { OTABanner } from "@components/layout/OTABanner";
import { NeuralShield } from "@components/layout/NeuralShield";
import { SovereignLock } from "@components/layout/SovereignLock";

// Lazy load system components
const VoiceCommandListener = dynamic(
    () => import("@/shared/components/voice/VoiceCommandListener").then(mod => ({ default: mod.VoiceCommandListener })),
    { ssr: false }
);
const DocumentationPortal = dynamic(
    () => import("@/shared/components/DocumentationPortal").then(mod => ({ default: mod.DocumentationPortal })),
    { ssr: false }
);
const TutorialBubble = dynamic(
    () => import("@/shared/components/TutorialBubble").then(mod => ({ default: mod.TutorialBubble })),
    { ssr: false }
);
const OracleChatDrawer = dynamic(
    () => import("@/modules/intelligence/analytique/analytics/components/OracleChatDrawer").then(mod => ({ default: mod.OracleChatDrawer })),
    { ssr: false }
);

export function ClientComponents({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [oracleOpen, setOracleOpen] = useState(false);

    if (pathname === '/welcome' || pathname.startsWith('/admin')) {
        return <>{children}</>;
    }

    return (
        <LayoutResolver>
            <VoiceCommandListener />
            <DocumentationPortal />
            <TutorialBubble />
            {children}
            <NeuralShield />
            <OTABanner />
            <SovereignLock />
            <button
                onClick={() => setOracleOpen(true)}
                className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
                aria-label="Ouvrir Oracle"
            >
                <Sparkles className="w-5 h-5" />
            </button>
            <OracleChatDrawer isOpen={oracleOpen} onClose={() => setOracleOpen(false)} />
        </LayoutResolver>
    );
}

