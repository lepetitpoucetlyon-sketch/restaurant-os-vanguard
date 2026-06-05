"use client";

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { OperationalIdentity, SovereignNode, SovereignField } from '@/shared/nexus-contract';
import { NexusNode } from '@/store/base';
import { useInventory } from '@/modules/logistics/inventory/hooks/useInventory';
import { 
  Table, Order, Recipe, Quote, Campaign,
  toTable, toOrder, toProduct, toRecipe, toReservation, toQuote, toCampaign, toFloor, toZone, toGroup, toJournalEntry, toCategory, toCustomer
} from '@nexus/contracts/nexus-internal-mapper';
import { SovereignMath } from '@shared/services/SovereignMath';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TelemetryHook } from '@/lib/telemetry/TelemetryHook';
import { logger } from '@/lib/logger';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import { genomeValidator } from '@domain/services/GenomeValidator';
import { ImmunityAuditLogger } from '@/lib/services/ImmunityAuditLogger';
import { ModuleId, PowerAction } from '@shared/genome.types';
import { EmpireInstance } from '@domain/types/empire';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { SovereignStorage } from '@/shared/services/SovereignStorage';
import { TenantIdSchema } from '@/domain/schemas/ui';
import { useTaskContext } from '@/lib/icm/useTaskContext';

import { ordersNodeAtom, tablesNodeAtom } from '@/store/pillars/ops';
import { 
  recipesNodeAtom, 
  prepTasksNodeAtom,
  categoriesNodeAtom,
  productsNodeAtom,
  miseEnPlaceTargetSelector
} from '@/store/pillars/logistics';
import { 
  quotesNodeAtom, 
  reservationsNodeAtom, 
  groupsNodeAtom 
} from '@/store/pillars/commerce';
import { 
  fiscalLedgerNodeAtom 
} from '@/store/pillars/compliance';
import { 
  marketingCampaignsNodeAtom 
} from '@/store/pillars/marketing';
import { tenantIdAtom, fleetSnapshotAtom } from '@/store/pillars/sovereign';
import { leaveRequestsNodeAtom } from '@/store/pillars/human';



import { 
  crmsNodeAtom, 
  selectedCRMAtom 
} from '@/store/pillars/marketing';
import { 
  floorsAtom, 
  zonesAtom, 
  zonesLockedAtom, 
  currentFloorIdAtom 
} from '@/store/pillars/ops';
import {
  menuAnalysisSelector,
  staffPerformanceSelector,
  laborCostRatioSelector
} from '@/store/pillars/commerce';


/**
 * 🛡️ Grade IX: Guarded Action Wrapper
 */
async function guardedAction<T>(
    moduleId: ModuleId, 
    power: PowerAction, 
    action: () => T | Promise<T>
): Promise<T | undefined> {
    const result = genomeValidator.validatePower(moduleId, power);
    if (!result.allowed) {
        ImmunityAuditLogger.log({
            moduleId: result.moduleId,
            attemptedPower: result.action,
            reason: result.reason === 'AUTHORIZED' ? 'UNKNOWN' : result.reason,
            blockedDependency: result.blockedDependency,
        });
        return undefined;
    }
    return await action();
}

/**
 * 🏛️ sanitizeToSovereign - Molecular Scanner Grade X
 */
function sanitizeToSovereign<T extends object>(data: T): T {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'bigint') return Number(data) as unknown as T;
        return data;
    }
    if (Array.isArray(data)) return data.map(val => sanitizeToSovereign(val)) as unknown as T;

    const PROTECTED_KEYS = ['id', 'tenantId', 'createdAt', 'updatedAt', 'identifier', 'date'];
    const sanitized = { ...data } as Record<string, unknown>;

    for (const key in sanitized) {
        if (PROTECTED_KEYS.includes(key)) continue;
        const val = sanitized[key];
        if (typeof val === 'number') {
            sanitized[key] = Number(SovereignMath.toMicrounits(val));
        } else if (typeof val === 'bigint') {
            sanitized[key] = Number(val);
        } else if (typeof val === 'object' && val !== null) {
            sanitized[key] = sanitizeToSovereign(val as object);
        }
    }
    return sanitized as T;
}

/**
 * 🏛️ Domain Mappers - Unified via Nexus Internal Mapper Grade X
 */
// Local mappers removed to use centralized src/shared/types/nexus-internal-mapper.ts

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

    const operationalNodes = useAtomValue(tablesNodeAtom);
    const allocations = useAtomValue(reservationsNodeAtom);
    const areas = useAtomValue(zonesAtom) || [];

    const contextValue = useMemo(() => ({ 
        switchTenant, 
        tenantId,
        floorOps: {
            operationalNodes: (operationalNodes.data || []).map(toTable),
            allocations: (allocations.data || []).map(toReservation),
            areas: (areas || []),
            isLoading: operationalNodes.loading || allocations.loading,
            updateNodeStatus: (id: string, status: Partial<SovereignNode>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`, { 
                    ...status, 
                    updatedAt: new Date().toISOString() 
                });
            }),
            updateAreaStatus: (id: string, status: Partial<SovereignNode>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`, { 
                    ...status, 
                    updatedAt: new Date().toISOString() 
                });
            }),
        }
    }), [switchTenant, tenantId, operationalNodes, allocations, areas]);

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

// Generic Data Hook Generator
const createSovereignHook = <T,>(
    atom: import('jotai').Atom<NexusNode<unknown>>, 
    identity: OperationalIdentity, 
    mapper: (n: SovereignNode) => T = (n) => n as unknown as T
) => {
    return () => {
        const node = useAtomValue(atom);
        const tenantId = useAtomValue(tenantIdAtom) as string;
        const rawData = (node.data || []) as SovereignNode[];
        return {
            data: rawData.map(mapper),
            isLoading: node.loading,
            error: node.error,
            add: async (dataToAdd: Partial<SovereignNode>) => {
                const sanitized = sanitizeToSovereign(dataToAdd as object);
                const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}`;
                await Nexus.adapter.create(path, { ...sanitized, updatedAt: new Date().toISOString() });
            },
            update: async (id: string, dataToUpdate: Partial<SovereignNode>) => {
                const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}/${id}`;
                await Nexus.adapter.update(path, { ...dataToUpdate, updatedAt: new Date().toISOString() });
            },
            remove: async (id: string) => {
                const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}/${id}`;
                await Nexus.adapter.delete(path);
            }
        };
    };
};

export const useOrders = () => {
    const base = createSovereignHook(ordersNodeAtom, OperationalIdentity.FLOWS, toOrder)();
    const tenantId = useAtomValue(tenantIdAtom) as string;
    return {
        ...base,
        respondToModification: async (orderId: string, itemId: string, approved: boolean, responder: string, note?: string) => {
            await guardedAction('KDS', 'FIRE_KDS', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}/${orderId}`, { 
                    [`items.${itemId}.modification.approved`]: approved,
                    [`items.${itemId}.modification.respondedBy`]: responder,
                    [`items.${itemId}.modification.responseNote`]: note,
                    [`items.${itemId}.modification.respondedAt`]: new Date().toISOString()
                });
            });
        },
        getPendingModifications: () => {
            const mods: Array<NonNullable<Order['items'][number]['modification']> & { orderId: string, orderItemId: string }> = [];
            (base.data || []).forEach((order: Order) => {
                (order.items || []).forEach((item: import('@nexus/contracts').OrderItem) => {
                    if (item.modification && !item.modification.respondedAt) {
                        mods.push({ 
                            ...item.modification, 
                            orderId: String(order.id), 
                            orderItemId: String(item.id) 
                        });
                    }
                });
            });
            return mods;
        }
    };
};
export const useAllocations = () => {
    const base = createSovereignHook(reservationsNodeAtom, OperationalIdentity.NODES, toReservation)();
    return {
        ...base,
        getReservationsForTable: (tableId: string) => {
            return (base.data || []).filter((r) => r.tableId === tableId || r.assignedTableId === tableId);
        }
    };
};
export const useReservations = useAllocations;

export const useOperationalNodes = () => {
    const node = useAtomValue(tablesNodeAtom);
    const nodes = (node.data || []).map(toTable);
    const layouts = (useAtomValue(floorsAtom) || []).map(toFloor);
    const zones = (useAtomValue(zonesAtom) || []).map(toZone);
    const isZonesLocked = useAtomValue(zonesLockedAtom);
    const setZonesLocked = useSetAtom(zonesLockedAtom);
    const currentLayoutId = useAtomValue(currentFloorIdAtom) as string;
    const setCurrentFloorId = useSetAtom(currentFloorIdAtom);
    const tenantId = useAtomValue(tenantIdAtom) as string;

    const toggleZonesLock = useCallback(() => setZonesLocked(prev => !prev), [setZonesLocked]);
    const setCurrentFloor = useCallback((id: string) => setCurrentFloorId(id), [setCurrentFloorId]);
    const _getTablesForFloor = useCallback((floorId: string) => nodes.filter((t: Table) => t.floorId === floorId), [nodes]);
    const getZonesForFloor = useCallback((floorId: string) => zones.filter(z => z.floorId === floorId || !z.floorId), [zones]);
    const updateTablePosition = useCallback(async (id: string, x: number, y: number) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`, {
                x, y, updatedAt: new Date().toISOString()
            });
        });
    }, [tenantId]);

    const updateNode = useCallback(async (id: string, data: Partial<SovereignNode>) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        });
    }, [tenantId]);

    const addNode = useCallback(async (data: Partial<SovereignNode>) => {
        const sanitized = sanitizeToSovereign(data);
        await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}`, sanitized);
    }, [tenantId]);

    const deleteNode = useCallback(async (id: string) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`);
        });
    }, [tenantId]);

    const updateZone = useCallback(async (id: string, data: Partial<SovereignNode>) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        });
    }, [tenantId]);

    const addFloor = useCallback(async (data: Partial<SovereignNode>) => {
        const sanitized = sanitizeToSovereign(data);
        await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}`, {
            ...sanitized,
            attributes: { ...(sanitized.attributes as Record<string, SovereignField>), type: 'floor' },
            updatedAt: new Date().toISOString()
        });
    }, [tenantId]);

    const updateFloor = useCallback(async (id: string, data: Partial<SovereignNode>) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        });
    }, [tenantId]);

    const deleteFloor = useCallback(async (id: string) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`);
        });
    }, [tenantId]);

    const addZone = useCallback(async (data: Partial<SovereignNode>) => {
        const sanitized = sanitizeToSovereign(data);
        await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}`, {
            ...sanitized,
            attributes: { ...(sanitized.attributes as Record<string, SovereignField>), type: 'zone' },
            updatedAt: new Date().toISOString()
        });
    }, [tenantId]);

    const deleteZone = useCallback(async (id: string) => {
        await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`);
        });
    }, [tenantId]);

    const resetToTemplate = useCallback(async (templateId: string) => {
        await guardedAction('FLOOR_PLAN', 'POWER_USER', async () => {
            // 🛡️ PURGE CURRENT FLOOR NODES
            const currentFloorNodes = nodes.filter((n) => (n.attributes as Record<string, SovereignField>)?.floorId === currentLayoutId);
            for (const node of currentFloorNodes) {
                await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${node.id}`);
            }

            // 🛡️ INJECT TEMPLATE (BISTRO STANDARD)
            if (templateId === 'standard') {
                const templateTables = [
                    { number: '1', x: 100, y: 100, seats: 2, shape: 'rect', width: 60, height: 60 },
                    { number: '2', x: 250, y: 100, seats: 4, shape: 'rect', width: 80, height: 80 },
                    { number: '3', x: 400, y: 100, seats: 2, shape: 'rect', width: 60, height: 60 },
                    { number: '4', x: 100, y: 250, seats: 4, shape: 'circle', radius: 40 },
                    { number: '5', x: 250, y: 250, seats: 6, shape: 'rect', width: 120, height: 80 },
                ];

                for (const table of templateTables) {
                    await addNode({
                        ...table,
                        status: 'free',
                        zoneId: zones[0]?.id || 'main',
                        floorId: currentLayoutId
                    });
                }
            }
            logger.info(`[Floor-Reset] Template ${templateId} applied to floor ${currentLayoutId}`);
        });
    }, [tenantId, currentLayoutId, nodes, zones, addNode]);

    return {
        nodes,
        tables: nodes,
        layouts,
        floors: layouts,
        zones,
        isZonesLocked,
        toggleZonesLock,
        currentLayoutId,
        currentFloorId: currentLayoutId,
        setCurrentFloor,
        getNodesForLayout: (layoutId: string) => nodes.filter((n) => (n.attributes as Record<string, SovereignField>)?.floorId === layoutId),
        getTablesForFloor: (floorId: string) => nodes.filter((n) => (n.attributes as Record<string, SovereignField>)?.floorId === floorId),
        getZonesForFloor,
        updateTablePosition,
        addNode,
        addTable: addNode,
        updateTable: updateNode,
        updateNodeStatus: updateNode,
        updateZone,
        deleteTable: deleteNode,
        deleteZone,
        addZone,
        addFloor,
        updateFloor,
        deleteFloor,
        resetToTemplate,
        isLoading: node.loading,
    };
};

export const useRecipes = () => {
    const base = createSovereignHook(recipesNodeAtom, OperationalIdentity.RESOURCES, toRecipe)();
    const tenantId = useAtomValue(tenantIdAtom) as string;
    return {
        ...base,
        addRecipe: async (data: Partial<Recipe>) => base.add(data as Partial<SovereignNode>),
        updateRecipe: async (id: string, data: Partial<Recipe>) => {
            await guardedAction('KITCHEN', 'MANAGE_RECIPES', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`, data);
            });
        },
        deleteRecipe: async (id: string) => base.remove(id),
        calculateRecipeCost: (recipe: Recipe) => {
            return (recipe.ingredients || []).reduce((acc: number, ing) => acc + (Number(ing.cost || 0) * Number(ing.quantity || 0)), 0);
        }
    };
};
export const useGroups = createSovereignHook(groupsNodeAtom, OperationalIdentity.RELATIONS, toGroup);
export const useMarketing = () => {
    const base = createSovereignHook(marketingCampaignsNodeAtom, OperationalIdentity.RELATIONS, toCampaign)();
    const tenantId = useAtomValue(tenantIdAtom) as string;
    return {
        ...base,
        upsertCampaign: async (data: Partial<Campaign>) => {
            await guardedAction('MARKETING', 'MANAGE_CAMPAIGNS', async () => {
                if (data.id) {
                    await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}/${data.id}`, data);
                } else {
                    await base.add(data as Partial<SovereignNode>);
                }
            });
        },
        upsertPost: async (data: Partial<SovereignNode> & { id?: string }) => {
            await guardedAction('MARKETING', 'MANAGE_CAMPAIGNS', async () => {
                const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}`;
                if (data.id) {
                    await Nexus.adapter.update(`${path}/${data.id}`, data);
                } else {
                    await Nexus.adapter.create(path, { ...data, type: 'post' });
                }
            });
        }
    };
};
export const useHR = createSovereignHook(leaveRequestsNodeAtom, OperationalIdentity.RESOURCES);
export const useCRM = () => {
    const base = createSovereignHook(crmsNodeAtom, OperationalIdentity.RELATIONS, toCustomer)();
    const selectedCRM = useAtomValue(selectedCRMAtom);
    const tenantId = useAtomValue(tenantIdAtom) as string;
    return {
        ...base,
        selectedCRM,
        upsertCustomer: async (data: Partial<SovereignNode> & { id?: string }) => {
            await guardedAction('CRM', 'MANAGE_CRM', async () => {
                const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}`;
                if (data.id) {
                    await Nexus.adapter.update(`${path}/${data.id}`, data);
                } else {
                    await Nexus.adapter.create(path, { ...data, type: 'customer' });
                }
            });
        }
    };
};

// 🏛️ LEGACY COMPATIBILITY BRIDGES (Grade VI)
export const useTables = useOperationalNodes;

export const useKitchen = () => {
    const ordersNode = useAtomValue(ordersNodeAtom);
    const tasksNode = useAtomValue(prepTasksNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom) as string;
    const miseEnPlaceTarget = useAtomValue(miseEnPlaceTargetSelector);
    
    // 🏛️ SUTURE: Conversion vers types business Grade X
    const orders = useMemo(() => 
        ((ordersNode?.data || []) as SovereignNode[]).map(toOrder),
    [ordersNode?.data]);

    const tasks = useMemo(() => 
        (tasksNode?.data || []) as unknown as SovereignNode[],
    [tasksNode?.data]);

    return {
        nodes: orders,
        orders,
        prepTasks: tasks,
        miseEnPlaceTarget,
        isLoading: ordersNode.loading || tasksNode.loading,
        error: ordersNode.error || tasksNode.error,
        
        togglePrepTask: async (id: string) => {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            const currentStatus = (task.attributes as Record<string, SovereignField>)?.status === 'completed';
            await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`, {
                attributes: { status: currentStatus ? 'pending' : 'completed' },
                updatedAt: new Date().toISOString()
            });
        },
        
        submitOrder: async (order: Partial<Order>) => {
            await guardedAction('KITCHEN', 'FIRE_KDS', async () => {
                const sanitized = sanitizeToSovereign(order);
                await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`, {
                    ...sanitized,
                    updatedAt: new Date().toISOString()
                });
            });
        },
        
        updateOrderStatus: async (id: string, status: string) => {
            await guardedAction('KITCHEN', 'FIRE_KDS', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}/${id}`, {
                    attributes: { status },
                    updatedAt: new Date().toISOString()
                });
            });
        },
        
        getPendingModifications: () => orders.filter((o) => o.status === 'pending_modification'),
    };
};

// 🛒 usePOSController is now imported from @modules/ops/pos

export const useProducts = createSovereignHook(productsNodeAtom, OperationalIdentity.RESOURCES, toProduct);
export const useCategories = createSovereignHook(categoriesNodeAtom, OperationalIdentity.RESOURCES, toCategory);
export const useFiscal = createSovereignHook(fiscalLedgerNodeAtom, OperationalIdentity.COMPLIANCE, toJournalEntry);

// 🥫 useInventory is now imported from @modules/logistics
export { useInventory };

export const useIntelligence = () => {
    const menuAnalysis = useAtomValue(menuAnalysisSelector);
    const performance = useAtomValue(staffPerformanceSelector);
    const laborCost = useAtomValue(laborCostRatioSelector);
    return { 
        menuAnalysis, 
        performance, 
        laborCost, 
        totalRevenue: 0,
        data: {
            globalInflationRate: 4.2 // Standard Grade X Rate
        }
    };
};

export const useManagement = () => ({
    quotes: createSovereignHook(quotesNodeAtom, OperationalIdentity.RELATIONS)(),
    reports: [] as import("@/shared/nexus-contract").SovereignValue[]
});

export const useQuotes = () => {
    const base = createSovereignHook(quotesNodeAtom, OperationalIdentity.RELATIONS, toQuote)();
    return {
        ...base,
        createQuote: async (data: Partial<Quote>) => {
            await guardedAction('QUOTES', 'CREATE_TRANSACTION', async () => {
                await base.add(data as Partial<SovereignNode>);
            });
        }
    };
};

