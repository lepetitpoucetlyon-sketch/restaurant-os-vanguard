"use client";

import React, { useState, useEffect, Suspense } from "react";
import { auth } from "@/lib/firebase";

interface SovereignModuleGateProps {
    requiredRole?: string;
    requiredPlan?: string[];
    moduleFactory: () => Promise<{ default: React.ComponentType<unknown> }>;
}

function extractClaim(c: unknown): string {
    return typeof c === 'string' ? c : '';
}

function checkAuthorization(
    role: string,
    plan: string,
    requiredRole?: string,
    requiredPlan?: string[],
): boolean {
    if (requiredRole && role !== requiredRole && !['super_admin', 'fleet_admin', 'SUPER_ADMIN'].includes(role)) return false;
    if (requiredPlan && requiredPlan.length > 0 && !requiredPlan.includes(plan)) return false;
    return true;
}

export function SovereignModuleGate({ requiredRole, requiredPlan, moduleFactory }: SovereignModuleGateProps) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [ModuleComponent, setModuleComponent] = useState<React.LazyExoticComponent<React.ComponentType<unknown>> | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setIsAuthorized(false);
                return;
            }

            try {
                const tokenResult = await user.getIdTokenResult(true);
                const claims = tokenResult.claims;

                const role     = extractClaim(claims.role);
                const plan     = extractClaim(claims.plan);
                const clientId = extractClaim(claims.clientId);

                if (!clientId) {
                    console.error("[SovereignModuleGate] FATAL: Missing clientId claim.");
                    setIsAuthorized(false);
                    return;
                }

                const authorized = checkAuthorization(role, plan, requiredRole, requiredPlan);
                setIsAuthorized(authorized);
                if (authorized) setModuleComponent(() => React.lazy(moduleFactory));

            } catch (error) {
                console.error("[SovereignModuleGate] Verification failed", error);
                setIsAuthorized(false);
            }
        });

        return () => unsubscribe();
    }, [requiredRole, requiredPlan, moduleFactory]);

    if (isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-surface-sidebar text-text-primary font-mono text-xs tracking-widest">
                [ VERIFYING_SOVEREIGN_CLAIMS... ]
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-error/10 text-error font-mono text-xs tracking-widest border border-error p-8 rounded-lg">
                [ CRITICAL: SOVEREIGN BOUNDARY BREACH DETECTED. ACCESS DENIED. ]
            </div>
        );
    }

    if (!ModuleComponent) return null;

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh] bg-surface-sidebar text-text-primary font-mono text-xs tracking-widest">
                [ DOWNLOADING_SECURE_PAYLOAD... ]
            </div>
        }>
            <ModuleComponent />
        </Suspense>
    );
}
