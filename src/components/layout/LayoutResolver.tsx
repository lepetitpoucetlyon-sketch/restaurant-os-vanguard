"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { GlobalFAB } from "@/components/layout/GlobalFAB";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { DesktopTopbar } from "@/components/layout/DesktopTopbar";
import { Header } from "@/components/layout/Header";
import { AppLaunchpad } from "@/components/layout/AppLaunchpad";
import { NAV_SECTIONS, filterNavSections } from "@/config/navConfig";
import { APP_MODE } from "@/config/instance";
import { useUI } from "@/shared/hooks";
import { cn } from "@/lib/ui.foundations";
import { ConnectivityBanner } from "@/components/layout/ConnectivityBanner";

/**
 * 🌀 LayoutResolver
 * Grade VIII Morphic Engine.
 * Decides the UI shell based on the Suzerain's signal.
 */
export function LayoutResolver({ children }: { children: React.ReactNode }) {
    const config = useAtomValue(tenantConfigAtom);
    const layout = (config as { status?: { layoutType?: string } })?.status?.layoutType || 'default';
    const { isLaunchpadOpen, setIsLaunchpadOpen } = useUI();

    const launchpad = (
        <AppLaunchpad
            isOpen={isLaunchpadOpen}
            onClose={() => setIsLaunchpadOpen(false)}
            sections={filterNavSections(NAV_SECTIONS, APP_MODE)}
        />
    );

    // Morphing Logic
    switch (layout) {
        case 'sidebar':
            return (
                <>
                    <div className="flex min-h-screen bg-bg-primary selection:bg-accent-gold/30">
                        <div className="hidden lg:block">
                            <DesktopSidebar />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 relative">
                            <Header />
                            <MobileHeader />
                            <ConnectivityBanner />
                            <main className={cn("flex-1 overflow-auto relative scroll-smooth", "pb-24 lg:pb-0")}>
                                {children}
                                <GlobalFAB />
                            </main>
                            <MobileNavBar />
                        </div>
                    </div>
                    {launchpad}
                </>
            );

        case 'topbar':
            return (
                <div className="min-h-screen bg-bg-primary">
                    <div className="hidden lg:block">
                        <DesktopTopbar />
                    </div>
                    <MobileHeader />
                    <ConnectivityBanner />
                    <main className={cn("relative", "pb-24 lg:pb-0 lg:pt-20")}>
                        {children}
                        <GlobalFAB />
                    </main>
                    <MobileNavBar />
                </div>
            );

        case 'kiosk':
            return (
                <div className="h-screen w-screen overflow-hidden bg-surface-sidebar text-white p-12 flex flex-col">
                     <div className="flex justify-between items-center mb-12">
                        <div className="text-4xl font-serif italic font-black">TERMINAL <span className="text-accent-gold not-italic">OS</span></div>
                        <div className="px-6 py-2 rounded-full border border-default text-[10px] font-black tracking-widest animate-pulse">KIOSK MODE ACTIVE</div>
                     </div>
                     <div className="flex-1 overflow-auto">
                        {children}
                     </div>
                </div>
            );

        case 'default':
        default:
            return (
                <>
                    <div className="flex min-h-screen bg-bg-primary selection:bg-accent-gold/30">
                        {/* Desktop Sidebar (Only visible on Desktop) */}
                        <div className="hidden lg:block">
                            <DesktopSidebar />
                        </div>

                        <div className="flex-1 flex flex-col min-w-0 relative">
                            {/* Desktop Header with 5 toggles (hidden on mobile via md:flex internally) */}
                            <Header />
                            {/* Mobile Header (Hidden on Desktop via lg:hidden internally) */}
                            <MobileHeader />
                            <ConnectivityBanner />

                            <main className={cn(
                                "flex-1 overflow-auto relative scroll-smooth",
                                "pb-24 lg:pb-0" // Space for Mobile NavBar
                            )}>
                                {children}
                            </main>

                            {/* Mobile NavBar (Hidden on Desktop via lg:hidden internally) */}
                            <MobileNavBar />

                            <GlobalFAB />
                        </div>
                    </div>
                    {launchpad}
                </>
            );
    }
}
