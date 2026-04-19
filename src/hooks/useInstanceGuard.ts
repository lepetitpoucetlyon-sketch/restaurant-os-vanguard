/**
 * ==========================================
 * useInstanceGuard — React Sensor Hook
 * ==========================================
 * Phase Alpha : "La Soudure"
 * 
 * Bridges the InstanceGuard domain service to the React UI layer
 * via Jotai atoms. Zero Context dependency.
 * 
 * Usage:
 *   const { isAuthorized, verdict, host, tenantId } = useInstanceGuard();
 *   if (!isAuthorized) return <UnauthorizedScreen />;
 */

'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    instanceGuardResultAtom,
    instanceGuardInitializedAtom,
    instanceVerdictAtom,
    isInstanceAuthorizedAtom,
    resolvedTenantIdAtom,
    isDevModeAtom,
    validatedHostAtom,
    runInstanceValidationAtom,
    forceRevalidateInstanceAtom,
} from '@/store/instanceGuardAtoms';
import type { InstanceVerdict, InstanceGuardResult } from '@/domain/services/InstanceGuard';

export interface UseInstanceGuardReturn {
    /** Full validation result */
    result: InstanceGuardResult;
    /** Quick access: is the instance authorized? */
    isAuthorized: boolean;
    /** Current verdict */
    verdict: InstanceVerdict;
    /** Current host being validated */
    host: string;
    /** Resolved tenant ID (null if unauthorized) */
    tenantId: string | null;
    /** Is running in development mode? */
    isDevMode: boolean;
    /** Has the guard completed initial validation? */
    isInitialized: boolean;
    /** Force re-validate (cache bust) */
    revalidate: () => void;
}

export function useInstanceGuard(): UseInstanceGuardReturn {
    const result = useAtomValue(instanceGuardResultAtom);
    const isAuthorized = useAtomValue(isInstanceAuthorizedAtom);
    const verdict = useAtomValue(instanceVerdictAtom);
    const host = useAtomValue(validatedHostAtom);
    const tenantId = useAtomValue(resolvedTenantIdAtom);
    const isDevMode = useAtomValue(isDevModeAtom);
    const isInitialized = useAtomValue(instanceGuardInitializedAtom);

    const runValidation = useSetAtom(runInstanceValidationAtom);
    const forceRevalidate = useSetAtom(forceRevalidateInstanceAtom);

    // Auto-validate on mount
    useEffect(() => {
        if (!isInitialized) {
            runValidation();
        }
    }, [isInitialized, runValidation]);

    return {
        result,
        isAuthorized,
        verdict,
        host,
        tenantId,
        isDevMode,
        isInitialized,
        revalidate: forceRevalidate,
    };
}

export default useInstanceGuard;
