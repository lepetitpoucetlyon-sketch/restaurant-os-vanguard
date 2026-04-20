// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui.foundations";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { NAV_SECTIONS } from "@/config/navigation";

// Modular Sub-components
import { SidebarBranding } from "./sidebar/SidebarBranding";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarQuickActions } from "./sidebar/SidebarQuickActions";
import { SidebarProfile } from "./sidebar/SidebarProfile";

// External Modals/Overlays
import { AppLaunchpad } from "./AppLaunchpad";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { ExpenseClaimDialog } from "@/components/accounting/ExpenseClaimDialog";
import { Map3DOverlay } from "./Map3DOverlay";
import { empireAudit } from "@/lib/audit";

import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from "@/store/fleetAtoms";

const sidebarReveal: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

export function Sidebar() {
    const pathname = usePathname();
    const { currentUser, logout, hasAccess, canSwitchProfiles } = useAuth();
    const { 
        isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, 
        isMobileMenuOpen, closeMobileMenu, settings, 
        isLaunchpadOpen, setIsLaunchpadOpen, setIsMap3DOpen 
    } = useUI();

    const tenantConfig = useAtomValue(tenantConfigAtom);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
    
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    // Filtered navigation based on permissions, settings, and Suzerain Feature Flags
    const accessibleSections = useMemo(() => {
        const features: any = (tenantConfig as any)?.features || {};
        
        return (NAV_SECTIONS || []).map(section => ({
            ...section,
            items: (section.items || []).filter(item => {
                // 1. Core / Hardened modules (Always visible if role permits)
                if (['dashboard', 'settings', 'account-settings'].includes(item.category)) {
                    return hasAccess?.(item.category);
                }

                // 2. Hardware/Instance settings filter
                if (item.href === '/pms' && !settings?.pmsEnabled) return false;

                // 3. Suzerain Feature Flag Mapping
                const cat = item.category as string;
                let isFeatureEnabled = true;

                const featureMapping: Record<string, boolean> = {
                    'pos': features.pos,
                    'floor-plan': features.pos,
                    'kds': features.kds,
                    'kitchen': features.kds,
                    'inventory': features.inventory,
                    'haccp': features.inventory, // HACCP often coupled with Inventory/Stock
                    'staff': features.hr,
                    'planning': features.hr,
                    'recruitment': features.hr,
                    'onboarding': features.hr,
                    'reservations': features.reservations,
                    'crm': features.reservations,
                    'accounting': features.finance,
                    'finance': features.finance,
                    'analytics': features.marketing,
                    'marketing': features.marketing,
                    'registre': true, // Standard requirement
                };

                if (cat in featureMapping) {
                    isFeatureEnabled = featureMapping[cat];
                }

                // 4. Combined accessibility check
                return isFeatureEnabled && (hasAccess?.(item.category) ?? true);
            })
        })).filter(section => (section.items?.length || 0) > 0);
    }, [hasAccess, settings?.pmsEnabled, tenantConfig?.features]);

    // Cleanup and effects
    useEffect(() => {
        closeMobileMenu();
        setIsLaunchpadOpen(false);
        
        // Log navigation for observability
        empireAudit.log({
            module: 'system',
            action: 'PAGE_VIEW',
            details: { path: pathname },
            timestamp: new Date(),
            severity: 'low'
        });
    }, [pathname, closeMobileMenu, setIsLaunchpadOpen]);

    // Handle App Launchpad Long Press
    const handleButtonPressStart = () => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setIsLaunchpadOpen(true);
            empireAudit.log({ module: 'system', action: 'LAUNCHPAD_OPENED_LONGPRESS', timestamp: new Date() });
        }, 500);
    };

    const handleButtonPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleLogoClick = () => {
        if (isLongPress.current) return;
        toggleSidebar();
    };

    return (
        <>
            <motion.aside
                initial="hidden"
                animate="visible"
                variants={sidebarReveal}
                className={cn(
                    "h-screen bg-bg-secondary border-r border-border flex-col fixed left-0 top-0 z-50 transition-all duration-500 will-change-transform flex",
                    isMobileMenuOpen ? "shadow-2xl w-[280px]" : "hidden lg:flex",
                    !isMobileMenuOpen && (isSidebarCollapsed ? "w-[72px]" : "w-[240px]")
                )}
            >
                {/* 1. Branding Area */}
                <SidebarBranding 
                    isSidebarCollapsed={isSidebarCollapsed}
                    isMobileMenuOpen={isMobileMenuOpen}
                    toggleSidebar={handleLogoClick}
                    closeMobileMenu={closeMobileMenu}
                    onMouseDown={handleButtonPressStart}
                    onMouseUp={handleButtonPressEnd}
                    onMouseLeave={handleButtonPressEnd}
                />

                {/* 2. Primary Navigation */}
                <SidebarNavigation 
                    accessibleSections={accessibleSections}
                    pathname={pathname}
                    isSidebarCollapsed={isSidebarCollapsed}
                    isMobileMenuOpen={isMobileMenuOpen}
                    setSidebarCollapsed={setSidebarCollapsed}
                    setIsMap3DOpen={setIsMap3DOpen}
                />

                {/* 3. Quick Actions */}
                <SidebarQuickActions 
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsExpenseModalOpen={setIsExpenseModalOpen}
                />

                {/* 4. User Profile */}
                <SidebarProfile 
                    currentUser={currentUser}
                    isSidebarCollapsed={isSidebarCollapsed}
                    canSwitchProfiles={canSwitchProfiles}
                    setIsProfileSwitcherOpen={setIsProfileSwitcherOpen}
                    logout={logout}
                />
            </motion.aside>

            {/* Floating Toggle Button (Collapsed Mode) */}
            <AnimatePresence>
                {isSidebarCollapsed && !isMobileMenuOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -20 }}
                        whileHover={{ scale: 1.1, x: 4 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={toggleSidebar}
                        className="hidden lg:flex fixed top-8 left-[88px] z-40 w-10 h-10 rounded-xl bg-bg-secondary text-accent-gold items-center justify-center border border-accent-gold/20 shadow-premium cursor-pointer hover:shadow-glow transition-shadow"
                    >
                        <ChevronRight strokeWidth={2} className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Global Modals & Overlays */}
            <ExpenseClaimDialog isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
            <ProfileSwitcher isOpen={isProfileSwitcherOpen} onClose={() => setIsProfileSwitcherOpen(false)} />
            <Map3DOverlay />
            <AppLaunchpad 
                isOpen={isLaunchpadOpen} 
                onClose={() => setIsLaunchpadOpen(false)} 
                sections={accessibleSections} 
            />
        </>
    );
}
