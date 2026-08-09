"use client";

import { useEffect } from 'react';
import { useSetAtom, useStore } from 'jotai';
import { activeTenantSlotsAtom, activeFleetTenantAtom } from '@nexus/state/SovereignGenome';
import { GlobalRegistryService } from '@/lib/GlobalRegistryService';
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
        setSlots((prev) => {
            const next = new Map<string, import('@/shared/types/empire').EmpireInstance>(prev);
            if (!next.has(tenantId)) {
                next.set(tenantId, { 
                    id: tenantId, 
                    key: tenantId,
                    name: `Tenant ${tenantId}`,
                    status: 'ONLINE',
                    tier: 'STANDARD',
                    version: '1.0.0',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastHeartbeat: new Date().toISOString(),
                    metrics: { activeUsers: 0, dailyRevenue: 0, revenue24h: 0, aiUsageCost: 0, healthScore: 100, complianceScore: 100, lowStockAlerts: 0, expiringItemsCount: 0 },
                    branding: { primaryColor: '#6366f1' },
                    featureFlags: {},
                    security: { twoFactorEnabled: true, nf525Certified: true, maintenanceAccessGranted: false, supportAccessGranted: false }
                } as import('@/shared/types/empire').EmpireInstance);
            }
            return next;
        });

        // TRIGGER: Hydration sequence (Grade VI)
        // Signal all domain nodes that they need to reload for this new tenantId
        GlobalRegistryService.getInventory().forEach(domainId => {
            const entry = GlobalRegistryService.getEntry(domainId);
            if (entry) {
                // We set loading to true to trigger re-fetch in components
                store.set(entry.atom as import('jotai').PrimitiveAtom<import('@/store/base').NexusNode<unknown>>, (prev) => {
                    const node = prev || { data: [], loading: true, lastUpdated: 0, id: 'unknown', error: null };
                    return {
                        ...node,
                        data: [],
                        loading: true,
                        lastUpdated: Date.now()
                    };
                });
            }
        });

        return () => {

            logger.info(`[Lifecycle] Unmounting tenant slot: ${tenantId}`);
            
            // Remove from active slots to free memory
            setSlots((prev) => {
                const next = new Map<string, import('@/shared/types/empire').EmpireInstance>(prev);
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
