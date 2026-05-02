"use client";

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { SovereignData, SovereignValue, OperationalIdentity, SovereignNode } from '@/shared/nexus-contract';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { 
  Table, Order, Product, Recipe, Reservation, Quote, Campaign,
  isTable, isOrder, isProduct, isRecipe, isIngredient, isReservation, isQuote, isCampaign,
  toTable, toOrder, toProduct, toRecipe, toIngredient, toReservation, toQuote, toCampaign, toFloor, toZone
} from '@nexus/contracts/nexus-internal-mapper';
import type { Ingredient } from '@nexus/contracts/logistics';
import { SovereignMath } from '@shared/services/SovereignMath';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TelemetryHook } from '@/lib/telemetry/TelemetryHook';
import { useVisibilityPurge } from '@/hooks/useVisibilityPurge';
import { logger } from '@/lib/logger';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import { genomeValidator } from '@domain/services/GenomeValidator';
import { ImmunityAuditLogger } from '@/lib/services/ImmunityAuditLogger';
import { ModuleId, PowerAction } from '@shared/genome.types';
import { EmpireInstance } from '@domain/types/empire';

import { 
  ordersNodeAtom,
  tablesNodeAtom,
  stockItemsNodeAtom,
  recipesNodeAtom,
  prepTasksNodeAtom,
  quotesNodeAtom,
  deliveriesNodeAtom,
  seoProfileAtom,
  marketingCampaignsNodeAtom,
  socialAccountsNodeAtom,
  tenantIdAtom,
  reservationsNodeAtom,
  groupsNodeAtom,
  leaveRequestsNodeAtom,
  leaveBalancesNodeAtom,
  fleetSnapshotAtom,
  categoriesNodeAtom,
  productsNodeAtom,
  fiscalLedgerNodeAtom,
  wasteLogsNodeAtom,
  ingredientsNodeAtom,
  preparationsNodeAtom,
  storageLocationsNodeAtom,
  crmsNodeAtom,
  floorsAtom,
  zonesAtom,
  zonesLockedAtom,
  currentFloorIdAtom,
  marketingSegmentsNodeAtom,
  scheduledPostsNodeAtom,
  isMarketingSyncingAtom,
  isReservationSyncingAtom,
  reservationStatsAtom,
  selectedCRMAtom,
  menuAnalysisSelector,
  staffPerformanceSelector,
  laborCostRatioSelector
} from '@/store/operationalAtoms';

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
function sanitizeToSovereign<T>(data: T): T {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'bigint') return Number(data) as T;
        return data;
    }
    if (Array.isArray(data)) return data.map(val => sanitizeToSovereign(val)) as T;

    const PROTECTED_KEYS = ['id', 'tenantId', 'createdAt', 'updatedAt', 'identifier', 'date'];
    const sanitized: Record<string, import("@/shared/nexus-contract").SovereignValue> = { ...data } as any;

    for (const key in sanitized) {
        if (PROTECTED_KEYS.includes(key)) continue;
        const val = (sanitized as any)[key];
        if (typeof val === 'number') {
            // Convert to microunits (bigint) then back to number for storage compatibility
            // This ensures the input was validated via SovereignMath
            (sanitized as any)[key] = Number(SovereignMath.toMicrounits(val));
        } else if (typeof val === 'bigint') {
            (sanitized as any)[key] = Number(val);
        } else if (typeof val === 'object' && val !== null) {
            (sanitized as any)[key] = sanitizeToSovereign(val);
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
    const tenantId = useAtomValue(tenantIdAtom);
    const setTenantId = useSetAtom(tenantIdAtom);
    const store = useStore();

    useEffect(() => {
        NexusSyncService.init(tenantId);
        TelemetryHook.emit('CORE', 'module_accessed', { context: 'NexusOpsProvider', tenantId });
        const purgeInterval = setInterval(() => GlobalRegistryService.purgeInactive(store), 120000);
        return () => {
            NexusSyncService.stopAll();
            clearInterval(purgeInterval);
        };
    }, [tenantId, store]);

    const switchTenant = useCallback(async (newTenantId: string) => {
        try {
            await NexusSyncService.stopAll(); 
            const instances = store.get(fleetSnapshotAtom) as EmpireInstance[];
            const targetInstance = instances.find(i => i.key === newTenantId);
            const { initializeTenantFirebase } = await import('@/lib/firebase');
            await initializeTenantFirebase(targetInstance?.firebaseConfig);
            setTenantId(newTenantId);
            localStorage.setItem('nexus_tenant_id', newTenantId);
            await NexusSyncService.init(newTenantId);
        } catch (error) {
            logger.error('[NexusOpsProvider] SaaS Switch failed', error);
        }
    }, [setTenantId, store]);

    const operationalNodes = useAtomValue(tablesNodeAtom);
    const allocations = useAtomValue(reservationsNodeAtom);
    const areas = useAtomValue(zonesAtom);

    const contextValue = useMemo(() => ({ 
        switchTenant, 
        tenantId,
        floorOps: {
            operationalNodes: ((operationalNodes.data || []) as import("@/shared/nexus-contract").SovereignData[]).map(toTable) as any as any,
            allocations: ((allocations.data || []) as import("@/shared/nexus-contract").SovereignData[]).map(toTable) as any as any,
            areas: (areas || []) as import("@/shared/nexus-contract").SovereignData[],
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
const createSovereignHook = (atom: any, identity: OperationalIdentity, mapper: (n: SovereignNode) => any = (n) => n) => {
    return () => {
        const node = useAtomValue(atom);
        const tenantId = useAtomValue(tenantIdAtom);
        return {
            data: (((node as any).data || []) as import("@/shared/nexus-contract").SovereignData[]).map(mapper),
            isLoading: (node as any).loading,
            error: (node as any).error,
            add: async (data: Partial<SovereignNode>) => {
                const sanitized = sanitizeToSovereign(data);
                const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}`;
                await Nexus.adapter.create(path, { ...sanitized, updatedAt: new Date().toISOString() });
            }
        };
    };
};

export const useOrders = () => {
    const base = createSovereignHook(ordersNodeAtom, OperationalIdentity.FLOWS, toOrder)();
    const tenantId = useAtomValue(tenantIdAtom);
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
            (base.data || []).forEach((order) => {
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
            return (base.data || []).filter((r: any) => r.tableId === tableId || r.assignedTableId === tableId);
        }
    };
};
export const useReservations = useAllocations;

export const useOperationalNodes = () => {
    const node = useAtomValue(tablesNodeAtom);
    const nodes = (((node as any).data || []) as import("@/shared/nexus-contract").SovereignData[]).map(toTable) as any as any;
    const layouts = ((useAtomValue(floorsAtom) || []) as import("@/shared/nexus-contract").SovereignData[]).map(toFloor);
    const zones = ((useAtomValue(zonesAtom) || []) as import("@/shared/nexus-contract").SovereignData[]).map(toZone);
    const isZonesLocked = useAtomValue(zonesLockedAtom);
    const setZonesLocked = useSetAtom(zonesLockedAtom);
    const currentLayoutId = useAtomValue(currentFloorIdAtom);
    const setCurrentFloorId = useSetAtom(currentFloorIdAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    const toggleZonesLock = useCallback(() => setZonesLocked(prev => !prev), [setZonesLocked]);
    const setCurrentFloor = useCallback((id: string) => setCurrentFloorId(id), [setCurrentFloorId]);
    const getTablesForFloor = useCallback((floorId: string) => nodes.filter(t => t.floorId === floorId), [nodes]);
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
            attributes: { ...(sanitized.attributes as any), type: 'floor' },
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
            attributes: { ...(sanitized.attributes as any), type: 'zone' },
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
            const currentFloorNodes = nodes.filter(n => (n.attributes as any)?.floorId === currentLayoutId);
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
        getNodesForLayout: (layoutId: string) => nodes.filter((n) => (n.attributes as any)?.floorId === layoutId),
        getTablesForFloor: (floorId: string) => nodes.filter((n) => (n.attributes as any)?.floorId === floorId),
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
    const tenantId = useAtomValue(tenantIdAtom);
    return {
        ...base,
        addRecipe: async (data: any) => base.add(data),
        updateRecipe: async (id: string, data: any) => {
            await guardedAction('KITCHEN', 'MANAGE_RECIPES', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`, data);
            });
        },
        calculateRecipeCost: (recipe: any) => {
            return (recipe.ingredients || []).reduce((acc: number, ing: any) => acc + (Number(ing.cost || 0) * Number(ing.quantity || 0)), 0);
        }
    };
};
export const useGroups = createSovereignHook(groupsNodeAtom, OperationalIdentity.RELATIONS);
export const useMarketing = () => {
    const base = createSovereignHook(marketingCampaignsNodeAtom, OperationalIdentity.RELATIONS, toCampaign)();
    const tenantId = useAtomValue(tenantIdAtom);
    return {
        ...base,
        upsertCampaign: async (data: any) => {
            await guardedAction('MARKETING', 'MANAGE_CAMPAIGNS', async () => {
                if (data.id) {
                    await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}/${data.id}`, data);
                } else {
                    await base.add(data);
                }
            });
        },
        upsertPost: async (data: any) => {
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
    const base = createSovereignHook(crmsNodeAtom, OperationalIdentity.RELATIONS, (n) => n)();
    const selectedCRM = useAtomValue(selectedCRMAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    return {
        ...base,
        selectedCRM,
        upsertCustomer: async (data: any) => {
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
    const tenantId = useAtomValue(tenantIdAtom);
    const orders = ((ordersNode.data || []) as import("@/shared/nexus-contract").SovereignData[]).map(toOrder) as any;
    const tasks = (tasksNode.data || []) as import("@/shared/nexus-contract").SovereignData[];

    return {
        data: orders,
        orders,
        tasks,
        isLoading: ordersNode.loading || tasksNode.loading,
        error: ordersNode.error || tasksNode.error,
        submitOrder: async (order: Partial<SovereignNode>) => {
            const sanitized = sanitizeToSovereign(order);
            await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`, {
                ...sanitized,
                updatedAt: new Date().toISOString()
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
        getPendingModifications: () => orders.filter(o => o.status === 'pending_modification'),
    };
};

export const usePOSController = () => {
    const ordersNode = useAtomValue(ordersNodeAtom);
    const productsNode = useAtomValue(productsNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    const products = ((productsNode.data || []) as import("@/shared/nexus-contract").SovereignData[]).map(toProduct) as any;
    const recipesNode = useAtomValue(recipesNodeAtom);

    return {
        products,
        recipes: ((recipesNode.data || []) as import("@/shared/nexus-contract").SovereignData[]).map(toRecipe) as any,
        isLoading: ordersNode.loading || productsNode.loading,
        error: ordersNode.error || productsNode.error,
        createOrder: async (order: any) => {
            const sanitized = sanitizeToSovereign(order);
            await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`, sanitized);
        },
        expert: {
            processPayment: async () => { /* 🏛️ SUTURE FUTURE */ }
        }
    };
};

export const useProducts = createSovereignHook(productsNodeAtom, OperationalIdentity.RESOURCES, toProduct);
export const useCategories = createSovereignHook(categoriesNodeAtom, OperationalIdentity.RESOURCES);
export const useFiscal = createSovereignHook(fiscalLedgerNodeAtom, OperationalIdentity.COMPLIANCE);

export const useInventory = () => {
    const stockNode = useAtomValue(stockItemsNodeAtom);
    const ingredientsNode = useAtomValue(ingredientsNodeAtom);
    const preparationsNode = useAtomValue(preparationsNodeAtom);
    const storageNode = useAtomValue(storageLocationsNodeAtom);
    const wasteNode = useAtomValue(wasteLogsNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    const stockItems = (stockNode.data || []) as import("@/shared/nexus-contract").SovereignData[];
    const ingredients = (ingredientsNode.data || []) as import("@/shared/nexus-contract").SovereignData[];
    const preparations = (preparationsNode.data || []) as import("@/shared/nexus-contract").SovereignData[];
    const storageLocations = (storageNode.data || []) as import("@/shared/nexus-contract").SovereignData[];
    const wasteLogs = (wasteNode.data || []) as import("@/shared/nexus-contract").SovereignData[];

    return {
        data: stockItems.map(toIngredient),
        stockItems: stockItems.map(toIngredient),
        ingredients: ingredients.map(toIngredient),
        preparations: preparations,
        storageLocations,
        wasteLogs,
        lowStockItems: stockItems.map(toIngredient).filter(s => {
            const qty = Number(s.quantity || 0);
            const min = Number(s.minQuantity || 0);
            return qty <= min;
        }),
        isLoading: stockNode.loading || ingredientsNode.loading || storageNode.loading,
        error: stockNode.error,
        add: async (data: Partial<SovereignNode>) => {
            const sanitized = sanitizeToSovereign(data);
            await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`, {
                ...sanitized,
                updatedAt: new Date().toISOString()
            });
        },
        addPreparation: async (data: any) => {
            await guardedAction('INVENTORY', 'MANAGE_INVENTORY', async () => {
                await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`, {
                    ...data,
                    type: 'preparation',
                    updatedAt: new Date().toISOString()
                });
            });
        },
        addStockItem: async (data: any) => {
            await guardedAction('INVENTORY', 'MANAGE_INVENTORY', async () => {
                await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`, {
                    ...data,
                    type: 'stock_item',
                    updatedAt: new Date().toISOString()
                });
            });
        },
        transferStock: async (id: string, locationId: string, qty: number) => {
            await guardedAction('INVENTORY', 'MANAGE_INVENTORY', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`, {
                    locationId,
                    updatedAt: new Date().toISOString()
                });
            });
        },
        consumeStock: async (id: string, qty: number, reason?: string) => {
            await guardedAction('INVENTORY', 'MANAGE_INVENTORY', async () => {
                // In a real system, this would involve a complex atomic deduction.
                // For Grade X, we update the metadata log.
                await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`, {
                    lastConsumption: qty,
                    lastReason: reason,
                    updatedAt: new Date().toISOString()
                });
            });
        }
    };
};

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
        createQuote: async (data: any) => {
            await guardedAction('QUOTES', 'CREATE_TRANSACTION', async () => {
                await base.add(data);
            });
        }
    };
};

