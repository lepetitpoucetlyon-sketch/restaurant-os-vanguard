"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { tenantIdAtom, fleetSnapshotAtom } from "@/store/operationalAtoms";
import { NexusSyncService } from "@/lib/NexusSyncService";
import { logger } from "@/lib/logger";

/**
 * 🕹️ useNexusOps - Grade VI Atomic Bridge
 * Master Controller pour la gestion des instances et du multitenancy.
 */
export function useNexusOps() {
    const tenantId = useAtomValue(tenantIdAtom);
    const setTenantId = useSetAtom(tenantIdAtom);
    const store = useStore();

    const switchTenant = useCallback(async (newTenantId: string) => {
        logger.info(`[NexusOps] Bridge: Switching to ${newTenantId}`);
        try {
            await NexusSyncService.stopAll(); 
            const instances = store.get(fleetSnapshotAtom);
            const targetInstance = instances.find(i => i.key === newTenantId);
            
            const { initializeTenantFirebase } = await import('@/lib/firebase');
            if (targetInstance?.firebaseConfig) {
                await initializeTenantFirebase(targetInstance.firebaseConfig);
            } else {
                await initializeTenantFirebase(); 
            }
            
            setTenantId(newTenantId);
            if (typeof window !== 'undefined') {
                localStorage.setItem('nexus_tenant_id', newTenantId);
            }
            await NexusSyncService.init(newTenantId);
        } catch (error) {
            logger.error('[NexusOps] Bridge: Switch failed', error);
        }
    }, [setTenantId, store]);

    return { 
        tenantId, 
        switchTenant 
    };
}
