// @ts-nocheck
"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LayoutResolver } from "./LayoutResolver";
import { OTABanner } from "@/components/layout/OTABanner";
import { NeuralShield } from "@/components/layout/NeuralShield";
import { SovereignLock } from "@/components/layout/SovereignLock";

// Lazy load system components
const VoiceCommandListener = dynamic(
    () => import("@/components/system/VoiceCommandListener").then(mod => ({ default: mod.VoiceCommandListener })),
    { ssr: false }
);
const DocumentationPortal = dynamic(
    () => import("@/components/system/DocumentationPortal").then(mod => ({ default: mod.DocumentationPortal })),
    { ssr: false }
);
const TutorialBubble = dynamic(
    () => import("@/components/system/TutorialBubble").then(mod => ({ default: mod.TutorialBubble })),
    { ssr: false }
);

export function ClientComponents({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (pathname === '/welcome') {
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

