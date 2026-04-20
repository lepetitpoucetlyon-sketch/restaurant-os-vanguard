"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@/store/masterAtoms';
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { GlobalFAB } from "@/components/layout/GlobalFAB";

/**
 * 🌀 LayoutResolver
 * Grade VIII Morphic Engine.
 * Decides the UI shell based on the Suzerain's signal.
 */
export function LayoutResolver({ children }: { children: React.ReactNode }) {
    const config = useAtomValue(tenantConfigAtom);
    const layout = config.status?.layoutType || 'default';

    // Morphing Logic
    switch (layout) {
        case 'sidebar':
            return (
                <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
                    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 hidden md:block">
                        {/* Sidebar content here */}
                        <div className="p-4 font-bold opacity-50">SIDEBAR MODE</div>
                    </aside>
                    <main className="flex-1 overflow-auto relative">
                        {children}
                    </main>
                </div>
            );

        case 'topbar':
            return (
                <div className="min-h-screen pt-16">
                    <nav className="fixed top-0 inset-x-0 h-16 bg-white dark:bg-slate-900 border-b z-50 flex items-center px-6">
                         <div className="font-bold opacity-50">TOPBAR MODE</div>
                    </nav>
                    {children}
                </div>
            );

        case 'kiosk':
            return (
                <div className="h-screen w-screen overflow-hidden bg-black text-white p-12">
                     <div className="text-center text-4xl font-black mb-8">KIOSK TERMINAL</div>
                     {children}
                </div>
            );

        case 'default':
        default:
            return (
                <div className="animate-fade-in pb-24">
                    <MobileHeader />
                    {children}
                    <MobileNavBar />
                    <GlobalFAB />
                </div>
            );
    }
}
