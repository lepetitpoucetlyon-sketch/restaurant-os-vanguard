// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/axiom';

/**
 * 🛰️ useConnectivity - Restaurant OS
 * Hook permettant de suivre l'état de la connexion internet.
 */
export function useConnectivity() {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof window !== 'undefined' ? window.navigator.onLine : true
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            logger.info('Connectivity: Internet connection restored');
            setIsOnline(true);
        };

        const handleOffline = () => {
            logger.warn('Connectivity: Internet connection lost. Switching to Offline Mode.');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

import { checkOnlineStatus } from './status';

/**
 * Statis check for connectivity (outside components)
 */
export { checkOnlineStatus };
