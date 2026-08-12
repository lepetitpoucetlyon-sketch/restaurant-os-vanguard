'use client';

import { useAtomValue } from 'jotai';
import { AUTH_GENOME } from '@nexus/state/SovereignGenome';

export interface InstanceGuardResult {
    result: import('@/shared/nexus-contract').SovereignData;
    isAuthorized: boolean;
    verdict: 'AUTHORIZED' | 'DENIED' | 'PENDING';
    host: string;
    tenantId: string;
    isDevMode: boolean;
    isInitialized: boolean;
    revalidate: () => void;
}

export function useInstanceGuard(): InstanceGuardResult {
    const currentUser = useAtomValue(AUTH_GENOME.currentUser);

    return {
        result: {},
        isAuthorized: !!currentUser,
        verdict: currentUser ? 'AUTHORIZED' : 'DENIED',
        host: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        tenantId: currentUser?.tenantId ?? '',
        isDevMode: process.env.NODE_ENV === 'development',
        isInitialized: true,
        revalidate: () => {},
    };
}

export default useInstanceGuard;
