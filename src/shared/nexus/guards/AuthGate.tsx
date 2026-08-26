"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui.foundations";
import { useAuth } from "@/shared/hooks";
import { PinLogin } from "./PinLogin";
import { useUI } from "@/shared/hooks";
import { useTenant } from "@/shared/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { TwoFactorChallenge } from "./TwoFactorChallenge";
import { useAtomValue } from "jotai";
import { tenantConfigAtom } from "@nexus/state/SovereignGenome";
import { SovereignLockout } from "./SovereignLockout";

interface AuthGateProps {
    children: React.ReactNode;
}

const PUBLIC_PATH_PREFIXES = ['/landing', '/showcase', '/reserve', '/auth', '/login', '/verticales', '/pricing', '/signup', '/legal', '/welcome', '/demo'] as const;

function isPublicPath(pathname: string | null): boolean {
    return pathname === '/' || PUBLIC_PATH_PREFIXES.some(p => pathname?.startsWith(p));
}

/**
 * AuthGate - Specialized security layer for Identity & Session.
 * Only handles PIN Authentication and 2FA Challenges.
 */
export function AuthGate({ children }: AuthGateProps) {
    const { isAuthenticated, isAuthLoading, require2FAChallenge } = useAuth();
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

    // 1.5. LOADING FENCE — do not render PinLogin while session hydration
    // is still in flight (users list loading, Firebase auth initial resolve,
    // permissions subscription). Rendering PinLogin during this window flashes
    // the login screen on top of a valid session and can trigger the guard's
    // downstream effects before the real state settles.
    if (isAuthLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg-primary">
                <div className="w-10 h-10 rounded-full border-2 border-accent-gold/20 border-t-accent-gold animate-spin" />
            </div>
        );
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-500 min-w-0"
            )}>
                <main className={cn(
                    "flex-1 overflow-y-auto",
                    "p-0"
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}
