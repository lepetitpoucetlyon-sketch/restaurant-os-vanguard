"use client";

import { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { NexusSyncService } from '@/infrastructure/services/NexusSyncService';
import { GlobalRegistryService } from '@/infrastructure/services/GlobalRegistryService';
import { logger } from '@/lib/axiom';

/**
 * ⚛️ NexusServiceInitializer (Grade VI)
 * Centralizes all root-level side effects and background services.
 * Eradicates the need for multiple logic-less context providers.
 */
export function NexusServiceInitializer(): null {
    const tenantId = useAtomValue(tenantIdAtom);
    const store = useStore();

    useEffect(() => {
        // Boot marker — no longer purges localStorage (LS-015: destroyed printer/terminal configs)
        if (typeof window !== 'undefined' && !sessionStorage.getItem('nexus_boot_purged')) {
            sessionStorage.setItem('nexus_boot_purged', 'true');
        }

        if (!tenantId) {
            logger.debug('[NexusInitializer] Waiting for tenant session...');
            return;
        }
        
        logger.info(`[NexusInitializer] Initializing Service Layer for Tenant: ${tenantId}`);
        
        // 1. Initialize Sync Engine
        NexusSyncService.init(tenantId);
        
        // 2. Initial Fleet Discover — gated on Firebase auth.
        //    Without a signed-in user, discoverRealFleet() 403s against the
        //    fleet-telemetry Firestore rules; NexusFleetProvider already re-runs
        //    it on auth-state-change, so no need to fire it here without a user.
        if (typeof window !== 'undefined') {
            Promise.all([
                import('@/lib/firebase'),
                import('@/shared/nexus/engines/Intelligence/ia/fleet/FleetTelemetryService'),
            ]).then(([{ auth }, { fleetTelemetry }]) => {
                if (auth.currentUser) {
                    fleetTelemetry.discoverRealFleet().catch(() => { /* silent */ });
                }
            }).catch(() => { /* firebase absent — skip */ });
        }

        // 3. Global Purge Registry
        const purgeInterval = setInterval(() => {
            GlobalRegistryService.purgeInactive(store);
        }, 120000);

        return () => {
            logger.info('[NexusInitializer] Stopping Services...');
            NexusSyncService.stopAll();
            clearInterval(purgeInterval);
        };
    }, [tenantId, store]);

    return null; // Side-effect only component
}
