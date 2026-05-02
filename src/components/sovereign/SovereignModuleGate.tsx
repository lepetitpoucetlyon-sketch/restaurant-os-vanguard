"use client";

import React, { useState, useEffect, Suspense } from "react";
import { auth } from "@/lib/firebase";

interface SovereignModuleGateProps {
    requiredRole?: string;
    requiredPlan?: string[];
    moduleFactory: () => Promise<{ default: React.ComponentType<unknown> }>;
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

                const role = typeof claims.role === "string" ? claims.role : "";
                const plan = typeof claims.plan === "string" ? claims.plan : "";
                const clientId = typeof claims.clientId === "string" ? claims.clientId : "";

                if (!clientId) {
                    console.error("[SovereignModuleGate] FATAL: Missing clientId claim.");
                    setIsAuthorized(false);
                    return;
                }

                if (requiredRole && role !== requiredRole && role !== 'SUPER_ADMIN') {
                    setIsAuthorized(false);
                    return;
                }

                if (requiredPlan && requiredPlan.length > 0 && !requiredPlan.includes(plan)) {
                    setIsAuthorized(false);
                    return;
                }

                setIsAuthorized(true);
                setModuleComponent(() => React.lazy(moduleFactory));

            } catch (error) {
                console.error("[SovereignModuleGate] Verification failed", error);
                setIsAuthorized(false);
            }
        });

        return () => unsubscribe();
    }, [requiredRole, requiredPlan, moduleFactory]);

    if (isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-black text-white font-mono text-xs tracking-widest">
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
            <div className="flex items-center justify-center min-h-[50vh] bg-black text-white font-mono text-xs tracking-widest">
                [ DOWNLOADING_SECURE_PAYLOAD... ]
            </div>
        }>
            <ModuleComponent />
        </Suspense>
    );
}
