"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui.foundations";
import { useAuth } from "@/kernel/hooks";
import { PinLogin } from "./PinLogin";
import { useUI } from "@/kernel/hooks";
import { useTenant } from "@/kernel/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { TwoFactorChallenge } from "./TwoFactorChallenge";
import { useAtomValue } from "jotai";
import { tenantConfigAtom } from "@nexus/state/SovereignGenome";
import { SovereignLockout } from "./SovereignLockout";

interface AuthGateProps {
    children: React.ReactNode;
}

const PUBLIC_PATH_PREFIXES = ['/landing', '/showcase', '/reserve', '/auth', '/login'] as const;

function isPublicPath(pathname: string | null): boolean {
    return pathname === '/' || PUBLIC_PATH_PREFIXES.some(p => pathname?.startsWith(p));
}

/**
 * AuthGate - Specialized security layer for Identity & Session.
 * Only handles PIN Authentication and 2FA Challenges.
 */
export function AuthGate({ children }: AuthGateProps) {
    const { isAuthenticated, require2FAChallenge } = useAuth();
    const { isMobileMenuOpen, closeMobileMenu } = useUI();
    const { activeTenantId: _activeTenantId } = useTenant();
    const tenantConfig = useAtomValue(tenantConfigAtom);
    const pathname = usePathname();

    // 0. SOVEREIGN KILL SWITCH (Highest Priority)
    const isKillSwitchActive = (tenantConfig as { status?: { killSwitch?: boolean } })?.status?.killSwitch === true;

    // Bypass for MCC area to allow admin recovery if needed
    const isMccArea = pathname?.startsWith('/admin');

    if (isKillSwitchActive && !isMccArea) {
        return <SovereignLockout />;
    }

    // 1. PUBLIC ROUTES BYPASS
    if (isPublicPath(pathname)) {
        return <>{children}</>;
    }

    // 2. PIN ENFORCEMENT
    if (!isAuthenticated) {
        return <PinLogin />;
    }

    // 4. 2FA CHALLENGE
    if (require2FAChallenge) {
        // EXCEPTION: Always allow access to Master Console for rescue
        if (!isMccArea) {
            return <TwoFactorChallenge />;
        }
    }

    // 3. LAYOUT WRAPPERS (Pure UI)
    const isMccFullWidth = pathname?.startsWith('/admin/mcc');
    const isAuthPage = pathname?.startsWith('/auth') || pathname === '/login';
    const isFullWidth = isMccFullWidth || isAuthPage;

    return (
        <div className="flex min-h-screen bg-bg-primary transition-colors duration-500 overflow-x-hidden">
            <AnimatePresence>
                {!isFullWidth && isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMobileMenu}
                        className="fixed inset-0 bg-surface-sidebar/60 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-500 min-w-0"
            )}>
                <main className={cn(
                    "flex-1 overflow-y-auto",
                    !isFullWidth ? "p-4 pb-32 md:p-8" : "p-0"
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}
