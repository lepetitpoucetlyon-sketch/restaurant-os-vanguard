"use client";

import { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
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
        // 🧪 ROOT PURGE (Grade VI) - Clear legacy state on first boot
        if (typeof window !== 'undefined' && !sessionStorage.getItem('nexus_boot_purged')) {
            localStorage.clear();
            sessionStorage.setItem('nexus_boot_purged', 'true');
            logger.info('[NexusInitializer] Nuclear Cache Purge: Success');
        }

        if (!tenantId) {
            logger.debug('[NexusInitializer] Waiting for tenant session...');
            return;
        }
        
        logger.info(`[NexusInitializer] Initializing Service Layer for Tenant: ${tenantId}`);
        
        // 1. Initialize Sync Engine
        NexusSyncService.init(tenantId);
        
        // 2. Initial Fleet Discover
        //    Le lien MCC ↔ instance (pulse montant + décrets descendants) vit
        //    dans NexusBridge — démarré par NexusSyncService.init → NexusBridge.init.
        if (typeof window !== 'undefined') {
            import('@domain/services/FleetTelemetryService').then(({ fleetTelemetry }) => {
                fleetTelemetry.discoverRealFleet().then(_data => {
                   // This logic is simplified here as useNexusFleet will handle the atom update
                });
            });
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
