'use client';

import { useEffect, useState } from 'react';

export function useInstanceGuard(): any {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setIsInitialized(true);
    }, []);

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
