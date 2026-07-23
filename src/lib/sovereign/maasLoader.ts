import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import * as React from 'react';
import { useState, useEffect } from 'react';

export type PlanType = 'free' | 'pro' | 'enterprise' | 'vanguard';

export interface MaasClaims {
    role: string;
    plan: PlanType;
    orgId: string;
    tenantId: string;
}

const MODULE_PLAN_MATRIX: Record<string, PlanType[]> = {
    'analytics': ['pro', 'enterprise', 'vanguard'],
    'marketing': ['enterprise', 'vanguard'],
    'export': ['pro', 'enterprise', 'vanguard'],
    'simulator': ['enterprise', 'vanguard'],
    'core': ['free', 'pro', 'enterprise', 'vanguard'],
};

export async function dispatchMaasAlert(claims: MaasClaims, type: 'technical' | 'business', message: string, moduleName: string) {
    if (!claims.tenantId) {
        logger.warn('No tenantId provided for dispatchMaasAlert');
        return;
    }
    
    try {
        const alertPayload = {
            message,
            moduleName,
            orgId: claims.orgId,
            role: claims.role,
            plan: claims.plan,
            type: 'maas_violation',
            timestamp: Nexus.adapter.serverTimestamp(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        };

        const collectionPath = type === 'technical' ? 'mcc/alerts' : `clients/${claims.orgId}/alerts`;
        const alertId = Nexus.adapter.generateId(collectionPath);
        await Nexus.adapter.create(`${collectionPath}/${alertId}`, alertPayload);
    } catch (err) {
        logger.error('Failed to dispatch MaaS alert', err);
    }
}

/**
 * Moteur MaaS (Modules as a Service) - Dynamic Importer.
 * Golden Rule: Unpaid module chunks must NEVER be downloaded.
 */
export async function loadMaasModule<T>(
    moduleName: string,
    claims: MaasClaims,
    importFn: () => Promise<T>
): Promise<T | null> {
    const allowedPlans = MODULE_PLAN_MATRIX[moduleName] || ['enterprise', 'vanguard'];

    if (!allowedPlans.includes(claims.plan)) {
        logger.warn(`[MaaS] Blocked chunk download for module '${moduleName}'. Plan: ${claims.plan}`);
        
        const technicalMsg = `[MaaS] Blocked chunk download for module ${moduleName} (Plan mismatch: ${claims.plan})`;
        const businessMsg = `Tentative d'accès au module ${moduleName} non-inclus dans votre plan ${claims.plan}.`;
        
        dispatchMaasAlert(claims, 'technical', technicalMsg, moduleName).catch(console.error);
        dispatchMaasAlert(claims, 'business', businessMsg, moduleName).catch(console.error);

        return null;
    }

    try {
        return await importFn();
    } catch (err) {
        logger.error(`[MaaS] Failed to load allowed module ${moduleName}`, err);
        return null;
    }
}

interface MaasGuardProps {
    moduleName: string;
    claims: MaasClaims;
    importFn: () => Promise<{ default: React.ComponentType<unknown> }>;
    fallback?: React.ReactNode;
    [key: string]: unknown;
}

/**
 * React Component Wrapper for MaaS modules.
 * Only triggers the importFn if the user has the required plan.
 */
export function MaasComponentGuard({ moduleName, claims, importFn, fallback, ...props }: MaasGuardProps) {
    const [Component, setComponent] = useState<React.ComponentType<unknown> | null>(null);
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;

        loadMaasModule(moduleName, claims, importFn).then((mod) => {
            if (isMounted) {
                if (mod) {
                    setIsAllowed(true);
                    setComponent(() => mod.default);
                } else {
                    setIsAllowed(false);
                }
            }
        });

        return () => {
            isMounted = false;
        };
    }, [moduleName, claims.plan, claims.orgId]); // Don't put importFn in deps to avoid loops

    if (isAllowed === false) {
        return React.createElement(React.Fragment, null, fallback || React.createElement('div', { className: "p-4 border border-red-500 text-red-500 rounded bg-red-50" }, `Module ${moduleName} non inclus dans votre plan.`));
    }

    if (!Component) {
        return React.createElement('div', { className: "p-4 animate-pulse" }, "Chargement du module sécurisé...");
    }

    return React.createElement(Component, props);
}
