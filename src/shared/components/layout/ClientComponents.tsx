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

const OPS_PREFIXES = [
    '/pos', '/pos-mobile', '/kds', '/kitchen', '/bar', '/floor-plan',
    '/reservations', '/staff', '/planning', '/timeclock', '/recruitment',
    '/leaves', '/finance', '/haccp', '/inventory', '/crm', '/marketing',
    '/analytics', '/intelligence', '/menu-builder', '/registre', '/operations',
    '/settings/branding', '/settings/security', '/facility', '/franchise',
    '/automations', '/mon-espace', '/welcome-staff', '/accounting-portal',
    '/migration', '/vanguard-simulator', '/aide', '/pms', '/suppliers',
    '/menu-engineering', '/hygiene', '/nf525', '/kiosk',
];

export function ClientComponents({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Le shell d'exploitation (Sidebar, MobileNavBar, Launchpad) est STRICTEMENT
    // réservé aux écrans internes du personnel (OPS_PREFIXES).
    // Les parcours convives (/order, /menu), publics (landing, marketing), et admin
    // ne doivent JAMAIS monter la coque d'exploitation.
    const isOpsRoute = pathname ? OPS_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)) : false;

    if (!isOpsRoute) {
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

