"use client";

import { useEffect } from 'react';
import { useSetAtom, useStore } from 'jotai';
import { activeTenantSlotsAtom, activeFleetTenantAtom } from '@/store/fleetAtoms';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import { logger } from '@/lib/logger';

/**
 * useTenantLifecycle (Grade VI)
 * Manages the "Slot" lifecycle for a specific tenant.
 * Mount: Adds tenant to active slots + fetches baseline.
 * Unmount: Removes from slots + triggers immediate RAM purge.
 */
export function useTenantLifecycle(tenantId: string | null) {
    const setSlots = useSetAtom(activeTenantSlotsAtom);
    const setActiveTenant = useSetAtom(activeFleetTenantAtom);
    const store = useStore();

    useEffect(() => {
        if (!tenantId) return;

        logger.info(`[Lifecycle] Mounting tenant slot: ${tenantId}`);
        setActiveTenant(tenantId);
        
        // Add to active slots
        setSlots(prev => {
            const next = new Map(prev);
            if (!next.has(tenantId)) {
                next.set(tenantId, { id: tenantId, lastActive: Date.now(), status: 'active' });
            }
            return next;
        });

        // TRIGGER: Hydration sequence (Grade VI)
        // Signal all domain nodes that they need to reload for this new tenantId
        GlobalRegistryService.getInventory().forEach(domainId => {
            const entry = GlobalRegistryService.getEntry(domainId);
            if (entry) {
                // We set loading to true to trigger re-fetch in components
                store.set(entry.atom, (prev: any) => ({
                    ...prev,
                    data: [],
                    loading: true
                }));
            }
        });

        return () => {

            logger.info(`[Lifecycle] Unmounting tenant slot: ${tenantId}`);
            
            // Remove from active slots to free memory
            setSlots(prev => {
                const next = new Map(prev);
                next.delete(tenantId);
                return next;
            });

            // Trigger Global Purge for all domains associated with this tenant
            // Note: Since domain IDs include the tenantId (e.g. "inventory-tenantA"), 
            // the GlobalRegistryService will purge them if their usageCount reached 0.
            GlobalRegistryService.forceNuclearPurge(store);
        };
    }, [tenantId, setSlots, setActiveTenant, store]);
}
