// @ts-nocheck
import { useEffect } from 'react';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import { logger } from '@/lib/logger';

/**
 * 👁️ useVisibilityPurge - Restaurant OS (Phase 4)
 * Lifecycle-aware hook that tracks component usage of Nexus atoms.
 * Prevents memory leaks by enabling the GlobalRegistryService to purge unused data.
 */
export function useVisibilityPurge(atomId: string) {
    useEffect(() => {
        // 1. Mark atom as ACTIVE upon mount
        GlobalRegistryService.touch(atomId);
        logger.debug(`[useVisibilityPurge] Tracking ON: ${atomId}`);

        return () => {
            // 2. Mark atom as IDLE upon unmount
            GlobalRegistryService.release(atomId);
            logger.debug(`[useVisibilityPurge] Tracking OFF: ${atomId}`);
        };
    }, [atomId]);
}

/**
 * useInSightPurge
 * Advanced version using IntersectionObserver for ultra-aggressive memory management.
 */
export function useInSightPurge(atomId: string, ref: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                GlobalRegistryService.touch(atomId);
            } else {
                GlobalRegistryService.release(atomId);
            }
        });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [atomId, ref]);
}
