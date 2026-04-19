"use client";

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
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
  leaveRequestsAtom,
  leaveBalancesAtom,
  fleetSnapshotAtom,
  pendingModificationsAtom,
  miseEnPlaceTargetSelector,
  calculateRecipeCostSelector,
  categoriesNodeAtom,
  productsNodeAtom,
  fiscalLedgerNodeAtom,
  wasteLogsAtom,
  menuAnalysisSelector,
  staffPerformanceSelector,
  laborCostRatioSelector,
  ingredientsAtom,
  preparationsAtom,
  supplierOrdersAtom,
  storageLocationsAtom,
  customersNodeAtom,
  floorsAtom,
  zonesAtom,
  zonesLockedAtom,
  currentFloorIdAtom,
  marketingSegmentsNodeAtom,
  scheduledPostsNodeAtom,
  isMarketingSyncingAtom,
  isReservationSyncingAtom,
  reservationStatsAtom
} from '@/store/operationalAtoms';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { 
    upsertShiftAction, 
    deleteShiftAction, 
    publishShiftsAction,
    createLeaveRequestAction,
    approveLeaveRequestAction,
    rejectLeaveRequestAction
} from '@/app/(admin)/actions/hr';
import { 
    upsertReservationAction, 
    markNoShowAction, 
    cancelReservationAction 
} from '@/app/(admin)/actions/reservations';
import { upsertGroupAction } from '@/app/(admin)/actions/groups';
import { 
    upsertScheduledPostAction, 
    deleteScheduledPostAction,
    upsertCampaignAction,
    deleteCampaignAction,
    upsertSegmentAction,
    deleteSegmentAction
} from '@/app/(admin)/actions/marketing';
import { TelemetryHook } from '@/lib/telemetry/TelemetryHook';
import { upsertRecipeAction, deleteRecipeAction, togglePrepTaskAction } from '@/app/(admin)/actions/kitchen';
import { receiveStockAction } from '@/app/(admin)/actions/inventory';
import { logger } from '@/lib/logger';
import { useVisibilityPurge } from '@/hooks/useVisibilityPurge';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';

// Grade IX: Genome Immunity
import { genomeValidator } from '@/domain/services/GenomeValidator';
import { ImmunityAuditLogger } from '@/lib/services/ImmunityAuditLogger';
import type { ModuleId, PowerAction } from '@/shared/genome.types';

// --- DOMAIN TYPES ---
interface NexusNodeState { data: any[]; isLoading: boolean; error: string | null; }

/**
 * 🛡️ Grade IX: Guarded Action Wrapper
 * Vérifie le génome AVANT d'exécuter une action métier.
 * Sub-microseconde (pure mémoire, zéro async pour la validation).
 */
function guardedAction(
    moduleId: ModuleId, 
    power: PowerAction, 
    action: () => void | Promise<void>
): void | Promise<void> {
    const result = genomeValidator.validatePower(moduleId, power);
    if (!result.allowed) {
        // Boîte Noire + UI Alert (fire-and-forget)
        ImmunityAuditLogger.log({
            moduleId: result.moduleId,
            attemptedPower: result.action,
            reason: result.reason === 'AUTHORIZED' ? 'UNKNOWN' : result.reason,
            blockedDependency: result.blockedDependency,
        });
        return;
    }
    return action();
}

// Grade VI: Protocol Scalpel - Mono-context for master orchestration only
export interface NexusOpsState {
    switchTenant: (id: string) => Promise<void>;
    tenantId: string;
}

const NexusOpsContext = createContext<NexusOpsState | undefined>(undefined);

/**
 * ⚛️ NexusOpsProvider (Initialize Only)
 * Orchestrates the connection between the Cloud and the Atomic State Tree.
 * Protocol Scalpel: This provider no longer wraps modules; it only initializes sync.
 */
export const NexusOpsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const tenantId = useAtomValue(tenantIdAtom);
    const setTenantId = useSetAtom(tenantIdAtom);
    const store = useStore();

    // 2. REAL-TIME SYNC ENGINE INITIALIZATION
    useEffect(() => {
        NexusSyncService.init(tenantId);
        TelemetryHook.emit('CORE', 'module_accessed', { context: 'NexusOpsProvider', tenantId });
        
        const purgeInterval = setInterval(() => {
            GlobalRegistryService.purgeInactive(store);
        }, 120000);

        return () => {
            NexusSyncService.stopAll();
            clearInterval(purgeInterval);
        };
    }, [tenantId, store]);

    // 🔄 SWITCH TENANT / CLONE FLOW
    const switchTenant = useCallback(async (newTenantId: string) => {
        logger.info(`[NexusOpsProvider] Initiating SaaS Switch to: ${newTenantId}`);
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
            localStorage.setItem('nexus_tenant_id', newTenantId);
            await NexusSyncService.init(newTenantId);
        } catch (error) {
            logger.error('[NexusOpsProvider] SaaS Switch failed', error);
        }
    }, [setTenantId, store]);

    const floorTables = useAtomValue(tablesNodeAtom);
    const reservations = useAtomValue(reservationsNodeAtom);

    const contextValue = useMemo(() => ({ 
        switchTenant, 
        tenantId,
        floorOps: {
            tables: floorTables.data || [],
            reservations: reservations.data || [],
            isLoading: floorTables.loading || reservations.loading,
            updateTableStatus: (id: string, status: any) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/tables/${id}`, { 
                    status, 
                    updatedAt: new Date().toISOString() 
                });
            }),
        }
    }), [switchTenant, tenantId, floorTables, reservations]);

    return (
        <NexusOpsContext.Provider value={contextValue}>
            {children}
        </NexusOpsContext.Provider>
    );
};

// --- ⚛️ ATOMIC CONSUMPTION HOOKS (Surgical Migration) ---

export const useNexusOps = () => {
    const context = useContext(NexusOpsContext);
    if (!context) throw new Error('useNexusOps must be used within NexusOpsProvider');
    return context;
};

export const useInventory = () => {
    useVisibilityPurge('stockItems');
    const node = useAtomValue(stockItemsNodeAtom);
    const stockItems = node.data || [];
    const ingredients = useAtomValue(ingredientsAtom);
    const preparations = useAtomValue(preparationsAtom);
    const supplierOrders = useAtomValue(supplierOrdersAtom);
    const storageLocations = useAtomValue(storageLocationsAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    const lowStockItems = useMemo(() => 
        (stockItems || []).filter((i: any) => i.quantity <= (i.minQuantity || 0)), 
        [stockItems]
    );

    const expiringItems = useMemo(() => {
        const now = new Date();
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        return (stockItems || []).filter((i: any) => {
            if (!i.dlc) return false;
            const dlcDate = new Date(i.dlc);
            return dlcDate.getTime() - now.getTime() < threeDays && i.quantity > 0;
        });
    }, [stockItems]);

    return { 
        stockItems, 
        data: stockItems, // Alias for legacy modules
        ingredients: ingredients || stockItems, // Suture bridge
        preparations,
        supplierOrders,
        storageLocations,
        lowStockItems,
        expiringItems,
        isLoading: node.loading, 
        error: node.error,
        receiveOrder: (id: string, data: any) => guardedAction('INVENTORY', 'DECREMENT_STOCK', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/supplierOrders/${id}`, { 
                ...data, 
                status: 'received',
                receivedAt: new Date().toISOString() 
            });
        }),
        processReception: (ingredient: any, data: any) => guardedAction('INVENTORY', 'DECREMENT_STOCK', () => 
            receiveStockAction(tenantId, ingredient, data)
        ),
        updateStock: (id: string, qty: number) => guardedAction('INVENTORY', 'DECREMENT_STOCK', async () => { /* Bridge */ }),
        cancelOrder: (id: string) => guardedAction('INVENTORY', 'DECREMENT_STOCK', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/supplierOrders/${id}`, { 
                status: 'cancelled',
                cancelledAt: new Date().toISOString() 
            });
        }),
        getExpiringStock: () => expiringItems,
        getExpiringPreparations: () => [], // Suture bridge
        transferStock: (id: string, from: string, to: string, qty: number) => guardedAction('INVENTORY', 'DECREMENT_STOCK', async () => { /* Bridge */ }),
        addStockItem: (item: any) => guardedAction('INVENTORY', 'DECREMENT_STOCK', async () => { /* Bridge */ })
    };
};

export const useOrders = () => {
    useVisibilityPurge('orders');
    const node = useAtomValue(ordersNodeAtom);
    const pendingModifications = useAtomValue(pendingModificationsAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    
    return { 
        orders: node.data, 
        data: node.data, // Alias for Analytics module
        totalRevenue: (node.data || []).reduce((acc: number, o: any) => acc + (o.totalInCents || 0), 0) / 100,
        isLoading: node.loading, 
        error: node.error,
        getPendingModifications: () => pendingModifications,
        updateOrderStatus: async (id: string, status: any) => guardedAction('KITCHEN', 'FIRE_KDS', async () => {
             await Nexus.adapter.update(`tenants/${tenantId}/orders/${id}`, { status, updatedAt: new Date().toISOString() });
        }),
        updateOrderItemStatus: async (id: string, idx: number, status: any) => guardedAction('KITCHEN', 'FIRE_KDS', async () => { /* Bridge */ }),
        deleteOrder: async (id: string) => guardedAction('KITCHEN', 'FIRE_KDS', async () => {
             await Nexus.adapter.delete(`tenants/${tenantId}/orders/${id}`);
        })
    };
};

export const useReservations = () => {
    useVisibilityPurge('reservations');
    const node = useAtomValue(reservationsNodeAtom);
    const stats = useAtomValue(reservationStatsAtom);
    const isSyncing = useAtomValue(isReservationSyncingAtom);
    const customers = useAtomValue(customersNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    const reservations = node.data || [];
    
    return { 
        data: reservations, 
        reservations, // bridge alias
        customers: customers.data || [], // bridge alias
        stats,
        isLoading: node.loading, 
        isSyncing,
        error: node.error,
        getReservationsForTable: (tableId: string) => 
            reservations.filter((r: any) => r.tableId === tableId && r.status !== 'cancelled'),
        getReservationsForDate: (date: string) => 
            reservations.filter((r: any) => r.date === date),
        addReservation: (data: any) => guardedAction('RESERVATIONS', 'SYNC_STATE', () => upsertReservationAction(tenantId, data)),
        addCustomer: (data: any) => guardedAction('CRM', 'SYNC_STATE', async () => { /* Bridge */ }),
        markNoShow: (id: string) => guardedAction('RESERVATIONS', 'SYNC_STATE', () => markNoShowAction(tenantId, id)),
        cancelReservation: (id: string, reason?: string) => guardedAction('RESERVATIONS', 'SYNC_STATE', () => cancelReservationAction(tenantId, id, reason)),
        getCustomerHistory: (id: string) => [] // Suture bridge
    };
};

export const useTables = () => {
    useVisibilityPurge('tables');
    const node = useAtomValue(tablesNodeAtom);
    const tables = node.data || [];
    const floors = useAtomValue(floorsAtom);
    const zones = useAtomValue(zonesAtom);
    const isZonesLocked = useAtomValue(zonesLockedAtom);
    const currentFloorId = useAtomValue(currentFloorIdAtom);
    const setCurrentFloorId = useSetAtom(currentFloorIdAtom);
    const setZonesLocked = useSetAtom(zonesLockedAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    const getTablesForFloor = useCallback((floorId: string) => 
        (tables || []).filter((t: any) => t.floorId === floorId), 
        [tables]
    );

    const getZonesForFloor = useCallback((floorId: string) => 
        (zones || []).filter((z: any) => z.floorId === floorId), 
        [zones]
    );

    return { 
        tables: tables || [], 
        floors,
        zones,
        isZonesLocked,
        toggleZonesLock: () => setZonesLocked(prev => !prev),
        currentFloorId,
        setCurrentFloor: (id: string) => setCurrentFloorId(id),
        getTablesForFloor,
        getZonesForFloor,
        addTable: async (table: any) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/tables`;
            const id = Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { ...table, id, createdAt: new Date().toISOString() });
        }),
        updateTable: async (id: string, data: any) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/tables/${id}`, { ...data, updatedAt: new Date().toISOString() });
        }),
        updateTablePosition: async (id: string, x: number, y: number) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/tables/${id}`, { x, y, updatedAt: new Date().toISOString() });
        }),
        deleteTable: async (id: string) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/tables/${id}`);
        }),
        addFloor: async (floor: any) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/floors`;
            const id = Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { ...floor, id });
        }),
        resetToTemplate: (template: string) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', () => Promise.resolve()),
        updateZone: (id: string, data: any) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/zones/${id}`, { ...data, updatedAt: new Date().toISOString() });
        }),
        isLoading: node.loading, 
        error: node.error 
    };
};

export const useGroups = () => {
    const node = useAtomValue(groupsNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    return { 
        groups: node.data, 
        isLoading: node.loading, 
        error: node.error, 
        upsertGroup: (group: any) => upsertGroupAction(tenantId, group) 
    };
};

export const useCategories = () => {
    const node = useAtomValue(categoriesNodeAtom);
    return { data: node.data, isLoading: node.loading, error: node.error };
};

export const useProducts = () => {
    const node = useAtomValue(productsNodeAtom);
    return { data: node.data, isLoading: node.loading, error: node.error };
};

export const useFiscal = () => {
    const node = useAtomValue(fiscalLedgerNodeAtom);
    return { data: node.data, isLoading: node.loading, error: node.error };
};

export const useManagement = () => {
    const waste = useAtomValue(wasteLogsAtom); 
    const analysis = useAtomValue(menuAnalysisSelector);
    const staffPerformance = useAtomValue(staffPerformanceSelector);
    const laborCostRatio = useAtomValue(laborCostRatioSelector);

    return {
        waste: { data: waste, isLoading: false, error: null },
        analysis: { data: analysis, isLoading: false, error: null },
        staffPerformance: { data: staffPerformance, isLoading: false, error: null },
        laborCostRatio
    };
};

export const useIntelligence = () => {
    const node = useAtomValue(seoProfileAtom);
    return { data: node, isLoading: false, error: null };
};

export const useKitchen = () => {
    useVisibilityPurge('recipes');
    const recipes = useAtomValue(recipesNodeAtom);
    const prepTasks = useAtomValue(prepTasksNodeAtom);
    const miseEnPlaceTarget = useAtomValue(miseEnPlaceTargetSelector);
    const tenantId = useAtomValue(tenantIdAtom);
    const stockItemsNode = useAtomValue(stockItemsNodeAtom);

    const calculateRecipeCost = useCallback((recipeIngredients: any[]) => {
        if (!recipeIngredients) return 0;
        return recipeIngredients.reduce((total, ri) => {
            const ingredient = (stockItemsNode.data || []).find((i: any) => i.id === ri.ingredientId);
            const cost = ingredient?.costInCents || 0;
            return total + (cost * ri.quantity);
        }, 0);
    }, [stockItemsNode.data]);

    return { 
        data: recipes.data, 
        isLoading: recipes.loading, 
        error: recipes.error,
        prepTasks: prepTasks.data,
        isPrepLoading: prepTasks.loading,
        miseEnPlaceTarget,
        addRecipe: (data: any) => guardedAction('KITCHEN', 'FIRE_KDS', () => upsertRecipeAction(tenantId, data)),
        updateRecipe: (id: string, data: any) => guardedAction('KITCHEN', 'FIRE_KDS', () => upsertRecipeAction(tenantId, { ...data, id })),
        deleteRecipe: (id: string) => guardedAction('KITCHEN', 'FIRE_KDS', () => deleteRecipeAction(tenantId, id)),
        togglePrepTask: (id: string) => guardedAction('KITCHEN', 'VALIDATE_DISH', () => togglePrepTaskAction(tenantId, id)),
        calculateRecipeCost
    };
};

export const useMarketing = () => {
    useVisibilityPurge('marketingCampaigns');
    const campaigns = useAtomValue(marketingCampaignsNodeAtom);
    const segments = useAtomValue(marketingSegmentsNodeAtom);
    const posts = useAtomValue(scheduledPostsNodeAtom);
    const social = useAtomValue(socialAccountsNodeAtom);
    const seo = useAtomValue(seoProfileAtom);
    const isSyncing = useAtomValue(isMarketingSyncingAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    return { 
        campaigns: campaigns.data || [], 
        segments: segments.data || [],
        scheduledPosts: posts.data || [],
        profile: seo, 
        socialAccounts: social.data || [], 
        isLoading: campaigns.loading || social.loading || segments.loading || posts.loading,
        isSyncing,
        error: campaigns.error || social.error,
        
        // --- INDUSTRIAL ACTIONS ---
        upsertCampaign: (data: any) => guardedAction('MARKETING', 'SYNC_STATE', () => upsertCampaignAction(tenantId, data)),
        deleteCampaign: (id: string) => guardedAction('MARKETING', 'SYNC_STATE', () => deleteCampaignAction(tenantId, id)),
        upsertPost: (data: any) => guardedAction('MARKETING', 'SYNC_STATE', () => upsertScheduledPostAction(tenantId, data)),
        deletePost: (id: string) => guardedAction('MARKETING', 'SYNC_STATE', () => deleteScheduledPostAction(tenantId, id)),
        upsertSegment: (data: any) => guardedAction('CRM', 'SYNC_STATE', () => upsertSegmentAction(tenantId, data)),
        deleteSegment: (id: string) => guardedAction('CRM', 'SYNC_STATE', () => deleteSegmentAction(tenantId, id)),
    };
};

export const useHR = () => {
    const leaveRequests = useAtomValue(leaveRequestsAtom);
    const leaveBalances = useAtomValue(leaveBalancesAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    return {
        leaveRequests: leaveRequests,
        leaveBalances: leaveBalances,
        isLoading: false, 
        createLeaveRequest: (data: any) => guardedAction('HR', 'CALCULATE_HOURS', () => createLeaveRequestAction(tenantId, data)),
        approveLeaveRequest: (id: string) => guardedAction('HR', 'SIGN_CONTRACT', () => approveLeaveRequestAction(tenantId, id)),
        rejectLeaveRequest: (id: string, reason?: string) => guardedAction('HR', 'SIGN_CONTRACT', () => rejectLeaveRequestAction(tenantId, id, reason))
    };
};

export const useQuality = () => {
    useVisibilityPurge('deliveries');
    const node = useAtomValue(deliveriesNodeAtom);
    return { deliveries: node.data, isLoading: node.loading, error: node.error };
};

export const useQuotes = () => {
    useVisibilityPurge('quotes');
    const node = useAtomValue(quotesNodeAtom);
    return { 
        data: node.data, 
        isLoading: node.loading, 
        error: node.error,
        createQuote: (data: any) => guardedAction('QUOTES', 'CREATE_TRANSACTION', () => Promise.resolve(data))
    };
};

export const useAccounting = () => {
    return {
        syncBankAccounts: (token: string) => guardedAction('ACCOUNTING', 'SYNC_STATE', async () => {
            const { PowensService } = await import('@/domain/accounting/PowensService');
            return PowensService.getAccounts(token);
        })
    };
};

export const useCRM = () => {
    useVisibilityPurge('customers');
    const node = useAtomValue(customersNodeAtom);
    const customers = node.data || [];
    const tenantId = useAtomValue(tenantIdAtom);

    const segments = useMemo(() => {
        const segMap: Record<string, number> = {};
        for (const c of customers as any[]) {
            const seg = c.segment || 'new';
            segMap[seg] = (segMap[seg] || 0) + 1;
        }
        return segMap;
    }, [customers]);

    const getCustomersBySegment = useCallback((segment: string) => {
        return (customers as any[]).filter((c: any) => c.segment === segment);
    }, [customers]);

    const searchCustomers = useCallback((query: string) => {
        const q = query.toLowerCase();
        return (customers as any[]).filter((c: any) => 
            c.name?.toLowerCase().includes(q) || 
            c.email?.toLowerCase().includes(q) || 
            c.phone?.includes(q)
        );
    }, [customers]);

    const getInactiveCustomers = useCallback((daysSinceLastVisit: number = 30) => {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysSinceLastVisit);
        return (customers as any[]).filter((c: any) => {
            if (!c.lastVisitDate) return true;
            return new Date(c.lastVisitDate) < threshold;
        });
    }, [customers]);

    return {
        customers,
        segments,
        isLoading: node.loading,
        error: node.error,
        getCustomersBySegment,
        searchCustomers,
        getInactiveCustomers,
        getActiveCustomer: (id: string) => {
            return (customers as any[]).find((c: any) => c.id === id) || null;
        },
        upsertCustomer: (data: any) => guardedAction('CRM', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/customers`;
            const id = data.id || Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { 
                ...data, 
                id, 
                updatedAt: new Date().toISOString(),
                createdAt: data.createdAt || new Date().toISOString()
            }, { merge: true });
        }),
        deleteCustomer: (id: string) => guardedAction('CRM', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/customers/${id}`);
        })
    };
};

export const useRecipes = useKitchen;
export const useSuppliers = useInventory;
