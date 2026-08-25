"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LayoutResolver } from "./LayoutResolver";
import { OTABanner } from "@components/layout/OTABanner";
import { SovereignLock } from "@components/layout/SovereignLock";

// Lazy load system components
const DocumentationPortal = dynamic(
    () => import("@/shared/components/docs").then(mod => ({ default: mod.DocumentationPortal })),
    { ssr: false }
);
const TutorialBubble = dynamic(
    () => import("@/shared/components/TutorialBubble").then(mod => ({ default: mod.TutorialBubble })),
    { ssr: false }
);
const UniversalAssistantFrame = dynamic(
    () => import("@/modules/intelligence/components/UniversalAssistantFrame").then(mod => ({ default: mod.UniversalAssistantFrame })),
    { ssr: false }
);
// Map3DOverlay n'était monté NULLE PART : `SidebarNavigation` appelait bien
// `setIsMap3DOpen(true)` au clic sur « Cartographie 3D », mais aucun consommateur
// de l'atome n'existait dans l'arbre — le clic ne pouvait rien produire.
const Map3DOverlay = dynamic(
    () => import("@components/layout/Map3DOverlay").then(mod => ({ default: mod.Map3DOverlay })),
    { ssr: false }
);

const PUBLIC_MARKETING_PATHS = ['/verticales', '/pricing', '/signup', '/legal', '/landing', '/welcome', '/auth', '/login', '/demo', '/showcase'];

export function ClientComponents({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isPublic = pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/admin') || PUBLIC_MARKETING_PATHS.some(p => pathname?.startsWith(p));

    if (isPublic) {
        return <>{children}</>;
    }

    return (
        <LayoutResolver>
            <DocumentationPortal />
            <TutorialBubble />
            {children}
            <OTABanner />
            <SovereignLock />
            <UniversalAssistantFrame />
            <Map3DOverlay />
        </LayoutResolver>
    );
}

