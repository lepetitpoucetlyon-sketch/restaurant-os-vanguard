"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
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

export function ClientComponents({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

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
        </LayoutResolver>
    );
}

