"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isMCCMode } from "@/config/instance";
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

    // The MCC console is a separate operator deployment (APP_MODE=mcc). It must NOT
    // wear the tenant restaurant shell (sidebar with POS/KDS/Résa/… categories) —
    // MCC pages bring their own full-screen chrome. Render bare in MCC mode, and
    // also bare-render the /admin/mcc route itself as a safety net in any mode.
    if (pathname === '/welcome' || isMCCMode() || pathname.startsWith('/admin/mcc')) {
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

