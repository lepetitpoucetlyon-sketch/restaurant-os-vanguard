'use client';


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
    const isInitialized = true;

    return {
        result: {},
        isAuthorized: true,
        verdict: 'AUTHORIZED',
        host: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        tenantId: 'mcc-master',
        isDevMode: true,
        isInitialized,
        revalidate: () => {},
    };
}

export default useInstanceGuard;
