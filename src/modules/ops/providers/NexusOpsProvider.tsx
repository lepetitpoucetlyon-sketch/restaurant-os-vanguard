"use client";

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { SovereignNode } from '@/shared/nexus-contract';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { TelemetryHook } from '@/modules/intelligence/analytique/TelemetryHook';
import { logger } from '@/lib/logger';
import { GlobalRegistryService } from '@/lib/GlobalRegistryService';
import { EmpireInstance } from '@/shared/types/empire';
import { SovereignStorage } from '@/shared/services/SovereignStorage';
import { TenantIdSchema } from '@/shared/schemas/ui';
import { useTaskContext } from '@/lib/icm/useTaskContext';
import { tenantIdAtom, fleetSnapshotAtom } from '@/store/pillars/sovereign';

import { useFloorOpsValue } from './hooks';
import { isMCCMode } from '@/config/instance';

/**
 * 🛰️ NexusOpsProvider — orchestrateur React du pilier Ops.
 *
 * Découpé (god file, fan-out 27) : les helpers vivent dans `opsCore`, les hooks de
 * données dans `hooks/{floor,kitchen,commerce,catalog}Hooks`. Ce fichier ne garde que
 * le Provider (cycle de vie sync + switch tenant + floorOps) et réexporte les hooks
 * pour préserver la compatibilité des imports `@/modules/ops/providers`.
 */

export interface NexusOpsState {
    switchTenant: (id: string) => Promise<void>;
    tenantId: string;
    floorOps: {
        operationalNodes: SovereignNode[];
        allocations: SovereignNode[];
        areas: SovereignNode[];
        isLoading: boolean;
        updateNodeStatus: (id: string, status: Partial<SovereignNode>) => Promise<void>;
        updateAreaStatus: (id: string, status: Partial<SovereignNode>) => Promise<void>;
    };
}

const NexusOpsContext = createContext<NexusOpsState | undefined>(undefined);

export const NexusOpsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const tenantId = useAtomValue(tenantIdAtom) as string;
    const setTenantId = useSetAtom(tenantIdAtom);
    const store = useStore();
    const taskContext = useTaskContext();

    useEffect(() => {
        if (isMCCMode()) {
            logger.info('[NexusOpsProvider] MCC mode — tenant sync engines disabled');
            return;
        }
        NexusSyncService.init(tenantId as string, taskContext);
        TelemetryHook.emit('CORE', 'module_accessed', { context: 'NexusOpsProvider', tenantId: tenantId as string, task: taskContext.taskId });
        const purgeInterval = setInterval(() => GlobalRegistryService.purgeInactive(store), 120000);
        return () => {
            NexusSyncService.stopAll();
            clearInterval(purgeInterval);
        };
    }, [tenantId, taskContext, store]);

    const switchTenant = useCallback(async (newTenantId: string) => {
        try {
            await NexusSyncService.stopAll();
            const instances = store.get(fleetSnapshotAtom) as EmpireInstance[];
            const targetInstance = instances.find(i => i.key === newTenantId);
            const { initializeTenantFirebase } = await import('@/lib/firebase');
            await initializeTenantFirebase(targetInstance?.firebaseConfig);
            setTenantId(newTenantId);
            SovereignStorage.set('nexus_tenant_id', newTenantId, TenantIdSchema);
            await NexusSyncService.init(newTenantId, taskContext);
        } catch (error) {
            logger.error('[NexusOpsProvider] SaaS Switch failed', error);
        }
    }, [setTenantId, store]);

    const floorOps = useFloorOpsValue(tenantId);

    const contextValue = useMemo(() => ({
        switchTenant,
        tenantId,
        floorOps,
    }), [switchTenant, tenantId, floorOps]);

    return (
        <NexusOpsContext.Provider value={contextValue}>
            {children}
        </NexusOpsContext.Provider>
    );
};

export const useNexusOps = (): NexusOpsState => {
    const context = useContext(NexusOpsContext);
    if (!context) throw new Error('useNexusOps must be used within NexusOpsProvider');
    return context;
};

export const useFloorOps = () => useNexusOps().floorOps;

// ── Réexports de compatibilité (les hooks vivent désormais dans ./hooks/*) ──────────
export {
    useOperationalNodes, useTables,
    useOrders, useRecipes, useKitchen,
    useAllocations, useReservations, useGroups, useMarketing, useCRM, useManagement, useQuotes,
    useProducts, useCategories, useFiscal, useHR, useIntelligence, useInventory,
} from './hooks';
