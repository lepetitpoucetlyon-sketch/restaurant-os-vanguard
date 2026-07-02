"use client";

import { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import { logger } from '@/lib/axiom';

/**
 * 🛰️ Pulse instance → MCC : pousse l'état de santé du nœud vers
 * fleet-telemetry/{tenantId} (stream bufferisé, flush 5 min max).
 */
function pushInstancePulse(tenantId: string, store: ReturnType<typeof useStore>): void {
    import('@domain/services/FleetTelemetryService').then(async ({ fleetTelemetry }) => {
        const { pendingOrdersAtom } = await import('@/store/pillars/ops');
        const activeOrders = (() => {
            try { return (store.get(pendingOrdersAtom) as unknown[])?.length ?? 0; }
            catch { return 0; }
        })();
        fleetTelemetry.pushSiteTelemetry(tenantId as import('@domain/types/brands').TenantID, {
            status: 'ONLINE',
            lastHeartbeat: new Date().toISOString(),
            healthScore: 100,
            activeOrders,
            version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
        });
    }).catch((err) => logger.warn('[NexusInitializer] Instance pulse failed', { error: String(err) }));
}

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
        
        // 2. Initial Fleet Discover + enregistrement du nœud auprès du MCC
        if (typeof window !== 'undefined') {
            import('@domain/services/FleetTelemetryService').then(({ fleetTelemetry }) => {
                fleetTelemetry.discoverRealFleet().then(_data => {
                   // This logic is simplified here as useNexusFleet will handle the atom update
                });
                fleetTelemetry.registerNode(tenantId as import('@domain/types/brands').TenantID);
                pushInstancePulse(tenantId, store);
            });
        }

        // 3. Global Purge Registry
        const purgeInterval = setInterval(() => {
            GlobalRegistryService.purgeInactive(store);
        }, 120000);

        // 4. Fleet Heartbeat (2 min) — télémétrie montante vers le MCC
        //    (fleet-telemetry/{tenantId} : santé, commandes actives, version).
        //    Le flux descendant (décrets/config) est déjà assuré par
        //    NexusBridge.listen sur tenants/{t}/config/master.
        const fleetInterval = setInterval(() => {
            pushInstancePulse(tenantId, store);
        }, 120000);

        return () => {
            logger.info('[NexusInitializer] Stopping Services...');
            NexusSyncService.stopAll();
            clearInterval(purgeInterval);
            clearInterval(fleetInterval);
        };
    }, [tenantId, store]);

    return null; // Side-effect only component
}
