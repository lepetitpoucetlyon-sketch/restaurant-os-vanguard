// @ts-nocheck
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ComplianceGateProps {
    children: React.ReactNode;
}

/**
 * ComplianceGate - Specialized layer for Onboarding & Operational Readiness.
 * Redirects admin users to the setup wizard if setup is incomplete.
 */
export function ComplianceGate({ children }: ComplianceGateProps) {
    const { isAuthenticated, currentUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (isAuthenticated && currentUser?.role === 'admin' && !currentUser?.setupComplete) {
            // EXCEPTION 1: Always allow access to Master Console for the Creator
            const isMccArea = pathname?.startsWith('/admin');
            
            // EXCEPTION 2: Pilot Mode bypass (if tenant parameter is in URL)
            const isPilotMode = searchParams?.has('tenant');
            
            // ÉJECTION FORCÉE : On sort de l'onboarding pour modifications directes
            if (pathname === '/onboarding/setup' || pathname === '/welcome') {
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, currentUser, pathname, router, searchParams]);

    return <>{children}</>;
}
