"use client";

import React, { useState } from 'react';
import { usePathname } from "next/navigation";
import { useNexusCore, useUI } from "@/shared/hooks";
import { NAV_SECTIONS, filterNavSections, filterByCapabilities, filterByRole } from "@/config/navConfig";
import { PERMISSION_ROLE_LEVELS } from "@/kernel/contracts/rbac";
import { APP_MODE } from "@/config/instance";
import { SidebarBranding } from "./sidebar/SidebarBranding";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarProfile } from "./sidebar/SidebarProfile";
import { SidebarQuickActions } from "./sidebar/SidebarQuickActions";
import { cn } from "@/lib/ui.foundations";
import { useAtom } from 'jotai';
import { isSidebarCollapsedAtom } from '@/store/pillars/sovereign';

export function DesktopSidebar() {
    const pathname = usePathname();
    const { auth, tenant } = useNexusCore();
    const { currentUser, logout } = auth;
    // Le vrai setter partagé (atome `isMap3DOpenAtom` via UIThemeProvider).
    // Il était remplacé par `() => {}` : le clic sur « Cartographie 3D » appelait
    // donc un no-op et n'ouvrait jamais rien.
    const { setIsMap3DOpen } = useUI();

    const [isSidebarCollapsed, setSidebarCollapsed] = useAtom(isSidebarCollapsedAtom);
    const [_isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [_isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);

    // Sidebar interaction states
    const [_isInteracting, setIsInteracting] = useState(false);

    const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

    const capabilities = (tenant.activeTenantConfig as { capabilities?: Record<string, boolean> })?.capabilities;
    const userRole = currentUser?.role as string | undefined;
    const userLevel = userRole ? (PERMISSION_ROLE_LEVELS as Record<string, number>)[userRole] : undefined;
    const accessibleSections = filterByRole(
        filterByCapabilities(
            filterNavSections(NAV_SECTIONS, APP_MODE),
            capabilities,
        ),
        userLevel,
        userRole,
    );

    return (
        <aside 
            className={cn(
                "h-dvh sticky top-0 border-r border-border/40 bg-bg-primary/80 backdrop-blur-3xl transition-all duration-700 ease-[0.16, 1, 0.3, 1] z-50 flex flex-col group/sidebar",
                isSidebarCollapsed ? "w-[80px]" : "w-[300px]"
            )}
        >
            <SidebarBranding 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobileMenuOpen={false}
                toggleSidebar={toggleSidebar}
                closeMobileMenu={() => {}}
                onMouseDown={() => setIsInteracting(true)}
                onMouseUp={() => setIsInteracting(false)}
                onMouseLeave={() => setIsInteracting(false)}
            />

            <SidebarQuickActions 
                isSidebarCollapsed={isSidebarCollapsed}
                setIsExpenseModalOpen={setIsExpenseModalOpen}
            />

            <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
                <SidebarNavigation 
                    accessibleSections={accessibleSections}
                    pathname={pathname}
                    isSidebarCollapsed={isSidebarCollapsed}
                    isMobileMenuOpen={false}
                    setSidebarCollapsed={setSidebarCollapsed}
                    setIsMap3DOpen={setIsMap3DOpen}
                />
            </div>

            <SidebarProfile 
                currentUser={currentUser}
                isSidebarCollapsed={isSidebarCollapsed}
                canSwitchProfiles={true}
                setIsProfileSwitcherOpen={setIsProfileSwitcherOpen}
                logout={logout}
            />
        </aside>
    );
}
