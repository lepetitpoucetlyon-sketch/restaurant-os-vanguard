"use client";

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { 
    Table, 
    Reservation, 
    StockItem, 
    Preparation, 
    Order, 
    CRM, 
    Zone, 
    Recipe,
    Ingredient,
    StorageLocation,
    WasteLog,
    FiscalSeal,
    IntelligenceConfig,
    Floor,
    OrderStatus,
    OrderItemStatus,
    TableStatus,
    Shift,
    LeaveRequest,
    GroupEvent,
    MarketingCampaign
} from '@/types';
import { MarketingSegment, ScheduledPost } from '@/modules/marketing/store/marketingAtoms';
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
  leaveRequestsNodeAtom as leaveRequestsAtom,
  leaveBalancesNodeAtom as leaveBalancesAtom,
  fleetSnapshotAtom,
  pendingModificationsAtom,
  miseEnPlaceTargetSelector,
  calculateRecipeCostSelector,
  categoriesNodeAtom,
  productsNodeAtom,
  fiscalLedgerNodeAtom,
  wasteLogsNodeAtom as wasteLogsAtom,
  menuAnalysisSelector,
  staffPerformanceSelector,
  laborCostRatioSelector,
  ingredientsNodeAtom as ingredientsAtom,
  preparationsNodeAtom as preparationsAtom,
  supplierOrdersNodeAtom as supplierOrdersAtom,
  storageLocationsNodeAtom as storageLocationsAtom,
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
  selectedCRMAtom
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
import { receiveStockAction, consumeStockAction, deleteStockItemAction } from '@/app/(admin)/actions/inventory';
import { logger } from '@/lib/logger';
import { useVisibilityPurge } from '@/hooks/useVisibilityPurge';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';

// Grade IX: Genome Immunity
import { genomeValidator } from '@/domain/services/GenomeValidator';
import { ImmunityAuditLogger } from '@/lib/services/ImmunityAuditLogger';
import type { ModuleId, PowerAction } from '@/shared/genome.types';

// --- DOMAIN TYPES ---
interface NexusNodeState<T = unknown> { data: T[]; loading: boolean; error: string | null; }

/**
 * 🛡️ Grade IX: Guarded Action Wrapper
 * Vérifie le génome AVANT d'exécuter une action métier.
 * Sub-microseconde (pure mémoire, zéro async pour la validation).
 */
function guardedAction<T>(
    moduleId: ModuleId, 
    power: PowerAction, 
    action: () => T | Promise<T>
): T | undefined {
    const result = genomeValidator.validatePower(moduleId, power);
    if (!result.allowed) {
        // Boîte Noire + UI Alert (fire-and-forget)
        ImmunityAuditLogger.log({
            moduleId: result.moduleId,
            attemptedPower: result.action,
            reason: result.reason === 'AUTHORIZED' ? 'UNKNOWN' : result.reason,
            blockedDependency: result.blockedDependency,
        });
        return undefined;
    }
    return action();
}

// Grade VI: Protocol Scalpel - Mono-context for master orchestration only
export interface NexusOpsState {
    switchTenant: (id: string) => Promise<void>;
    tenantId: string;
    floorOps?: {
        tables: Table[];
        reservations: Reservation[];
        areas: Zone[];
        isLoading: boolean;
        updateTableStatus: (id: string, status: TableStatus | Partial<Table>) => Promise<void>;
        updateAreaStatus: (id: string, status: Partial<Zone>) => Promise<void>;
        addZone?: (data: Partial<Zone>) => Promise<void>;
    };
    planning?: {
        shifts: Shift[];
        loading: boolean;
    };
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
            updateTableStatus: (id: string, status: TableStatus | Partial<Table>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
                const payload = typeof status === 'string' ? { status } : status;
                await Nexus.adapter.update(`tenants/${tenantId}/tables/${id}`, { 
                    ...payload, 
                    updatedAt: new Date().toISOString() 
                });
            }),
            updateAreaStatus: (id: string, status: Partial<Zone>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
                await Nexus.adapter.update(`tenants/${tenantId}/zones/${id}`, { 
                    ...status, 
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
    const stockItems = (node.data || []) as StockItem[];
    const ingredientsNode = useAtomValue(ingredientsAtom);
    const preparationsNode = useAtomValue(preparationsAtom);
    const productionLogsNode = useAtomValue(wasteLogsAtom);
    const storageLocationsNode = useAtomValue(storageLocationsAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    const lowStockItems = useMemo(() => 
        stockItems.filter((i) => i.quantity <= (i.minQuantity || 0)), 
        [stockItems]
    );

    const getExpiringStock = useCallback((days: number = 3) => {
        const now = new Date();
        const threshold = days * 24 * 60 * 60 * 1000;
        return stockItems.filter((i) => {
            const expirationDate = i.dlc ? new Date(i.dlc) : (i.expirationDate ? new Date(i.expirationDate) : null);
            return expirationDate && (expirationDate.getTime() - now.getTime() < threshold) && i.quantity > 0;
        });
    }, [stockItems]);

    const getExpiringPreparations = useCallback((days: number = 3) => {
        const now = new Date();
        const threshold = days * 24 * 60 * 60 * 1000;
        return (preparationsNode.data || []).filter((p: Preparation) => {
            const expirationDate = p.expirationDate ? new Date(p.expirationDate) : null;
            return expirationDate && (expirationDate.getTime() - now.getTime() < threshold);
        });
    }, [preparationsNode.data]);

    return {
        stockItems,
        lowStockItems,
        data: stockItems,
        ingredients: ingredientsNode.data || [],
        preparations: preparationsNode.data || [],
        productionLogs: productionLogsNode.data || [],
        storageLocations: storageLocationsNode.data || [],
        isLoading: node.loading,
        error: node.error,
        addStockItem: async (item: Partial<StockItem>) => {
            await Nexus.adapter.create(`tenants/${tenantId}/stockItems`, { 
                ...item, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString() 
            });
        },
        addPreparation: async (prep: Partial<Preparation>) => {
            await Nexus.adapter.create(`tenants/${tenantId}/preparations`, { 
                ...prep, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString() 
            });
        },
        transferStock: async (itemId: string, locationId: string) => {
            await Nexus.adapter.update(`tenants/${tenantId}/stockItems/${itemId}`, { 
                storageLocationId: locationId,
                updatedAt: new Date().toISOString() 
            });
        },
        transferPreparation: async (prepId: string, locationId: string) => {
            await Nexus.adapter.update(`tenants/${tenantId}/preparations/${prepId}`, { 
                storageLocationId: locationId,
                updatedAt: new Date().toISOString() 
            });
        },
        processReception: async () => {},
        updateStock: async () => {},
        cancelOrder: async () => {},
        receiveOrder: async () => {},
        consumeStock: (id: string, qty: number, reason: string) => guardedAction('INVENTORY', 'DECREMENT_STOCK', () => consumeStockAction(tenantId, id, qty, reason)),
        deleteStockItem: (id: string) => guardedAction('INVENTORY', 'DECREMENT_STOCK', () => deleteStockItemAction(tenantId, id)),
        supplierOrders: [],
        getExpiringStock,
        getExpiringPreparations
    };
};

export const useOrders = () => {
    useVisibilityPurge('orders');
    const node = useAtomValue(ordersNodeAtom);
    const pendingModifications = useAtomValue(pendingModificationsAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    
    return { 
        orders: node.data || [], 
        data: node.data || [], // Alias for Analytics module
        totalRevenue: (node.data || []).reduce((acc: number, o: Order) => acc + (o.totalInCents || 0), 0) / 100,
        isLoading: node.loading, 
        error: node.error,
        getPendingModifications: () => pendingModifications,
        respondToModification: async (orderId: string, itemId: string, approved: boolean, respondedBy: string, responseNote?: string) => {
            console.log("Responding to modification", { orderId, itemId, approved, respondedBy, responseNote });
        },
        expert: { processCommand: async () => {} }, // Grade X stub for POS
        updateOrderStatus: async (id: string, status: string) => guardedAction('KITCHEN', 'FIRE_KDS', async () => {
             await Nexus.adapter.update(`tenants/${tenantId}/orders/${id}`, { status, updatedAt: new Date().toISOString() });
        }),
        updateOrderItemStatus: async (id: string, idx: number, status: string) => guardedAction('KITCHEN', 'FIRE_KDS', async () => { /* Bridge */ }),
        submitOrder: async (order: Partial<Order>) => console.log('Submit order', order),
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
    const crms = useAtomValue(crmsNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    const reservations = node.data || [];
    
    return { 
        data: reservations, 
        reservations, // bridge alias
        crms: crms.data || [], // bridge alias
        stats,
        isLoading: node.loading, 
        isSyncing,
        error: node.error,
        getReservationsForTable: (tableId: string) => 
            reservations.filter((r: Reservation) => r.tableId === tableId && r.status !== 'cancelled'),
        getReservationsForDate: (date: string) => 
            reservations.filter((r: Reservation) => r.date === date),
        addReservation: (data: Partial<Reservation>) => guardedAction('RESERVATIONS', 'SYNC_STATE', () => upsertReservationAction(tenantId, data)),
        addCRM: (data: Partial<CRM>) => guardedAction('CRM', 'SYNC_STATE', async () => { /* Bridge */ }),
        markNoShow: (id: string) => guardedAction('RESERVATIONS', 'SYNC_STATE', () => markNoShowAction(tenantId, id)),
        cancelReservation: (id: string, reason?: string) => guardedAction('RESERVATIONS', 'SYNC_STATE', () => cancelReservationAction(tenantId, id, reason)),
        getCRMHistory: (id: string) => [] // Suture bridge
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
        (tables || []).filter((t: Table) => t.floorId === floorId), 
        [tables]
    );

    const getZonesForFloor = useCallback((floorId: string) => 
        (zones || []).filter((z: Zone) => z.floorId === floorId), 
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
        getZonesForFloor,
        addTable: async (table: Partial<Table>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/tables`;
            const id = Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { ...table, id, createdAt: new Date().toISOString() });
        }),
        updateTable: async (id: string, data: Partial<Table>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/tables/${id}`, { ...data, updatedAt: new Date().toISOString() });
        }),
        updateTablePosition: async (id: string, x: number, y: number) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/tables/${id}`, { x, y, updatedAt: new Date().toISOString() });
        }),
        deleteTable: async (id: string) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/tables/${id}`);
        }),
        addFloor: async (floor: Partial<Floor>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/floors`;
            const id = Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { ...floor, id });
        }),
        resetToTemplate: (template: string) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', () => Promise.resolve()),
        addZone: (data: Partial<Zone>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/zones`;
            const id = Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { ...data, id });
        }),
        updateZone: (id: string, data: Partial<Zone>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/zones/${id}`, { ...data, updatedAt: new Date().toISOString() });
        }),
        deleteZone: (id: string) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/zones/${id}`);
        }),
        updateFloor: (id: string, data: Partial<Floor>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.update(`tenants/${tenantId}/floors/${id}`, { ...data, updatedAt: new Date().toISOString() });
        }),
        deleteFloor: (id: string) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/floors/${id}`);
        }),
        isLoading: node.loading, 
        error: node.error 
    };
};

export const useGroups = () => {
    const node = useAtomValue(groupsNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    return { 
        groups: node.data || [], 
        isLoading: node.loading, 
        error: node.error, 
        upsertGroup: (group: Partial<GroupEvent>) => upsertGroupAction(tenantId, group) 
    };
};

export const useCategories = () => {
    const node = useAtomValue(categoriesNodeAtom);
    return { data: node.data || [], isLoading: node.loading, error: node.error };
};

export const useProducts = () => {
    const node = useAtomValue(productsNodeAtom);
    return { data: node.data || [], isLoading: node.loading, error: node.error };
};

export const useFiscal = () => {
    const node = useAtomValue(fiscalLedgerNodeAtom);
    return { data: (node.data || []) as FiscalSeal[], isLoading: node.loading, error: node.error };
};

export const useManagement = () => {
    const waste = useAtomValue(wasteLogsAtom); 
    const analysis = useAtomValue(menuAnalysisSelector);
    const staffPerformance = useAtomValue(staffPerformanceSelector);
    const laborCostRatio = useAtomValue(laborCostRatioSelector);

    return {
        waste: { data: waste.data || [], isLoading: waste.loading, error: waste.error },
        analysis: { data: analysis, isLoading: false, error: null },
        staffPerformance: { data: staffPerformance, isLoading: false, error: null },
        laborCostRatio
    };
};

export const useHACCP = () => {
    return {
        labels: [],
        criticalAlerts: [],
        getComplianceScore: () => 100,
        checklists: [],
        sensors: [],
        temperatureHistory: [],
        validateTaskWithVision: async (data?: Record<string, unknown>, options?: Record<string, unknown>) => true,
        logWaste: async (data: Partial<WasteLog>) => console.log('Waste logged', data)
    };
};

export const useIntelligence = (): { data: IntelligenceConfig | null; isLoading: boolean; error: string | null } => {
    const node = useAtomValue(seoProfileAtom);
    return { 
        data: {
            globalInflationRate: 4.2, 
            seoProfile: node
        }, 
        isLoading: false, 
        error: null 
    };
};

export const useKitchen = () => {
    useVisibilityPurge('recipes');
    const recipes = useAtomValue(recipesNodeAtom);
    const prepTasks = useAtomValue(prepTasksNodeAtom);
    const miseEnPlaceTarget = useAtomValue(miseEnPlaceTargetSelector);
    const tenantId = useAtomValue(tenantIdAtom);
    const stockItemsNode = useAtomValue(stockItemsNodeAtom);

    const calculateRecipeCost = useCallback((recipeIngredients: { ingredientId: string, quantity: number }[]) => {
        if (!recipeIngredients) return 0;
        return recipeIngredients.reduce((total, ri) => {
            const ingredient = (stockItemsNode.data || []).find((i: StockItem) => i.id === ri.ingredientId);
            const cost = ingredient?.costInCents || 0;
            return total + (cost * ri.quantity);
        }, 0);
    }, [stockItemsNode.data]);

    return { 
        data: recipes.data || [], 
        recipes: recipes.data || [],
        isLoading: recipes.loading, 
        error: recipes.error,
        prepTasks: prepTasks.data || [],
        isPrepLoading: prepTasks.loading,
        miseEnPlaceTarget,
        addRecipe: (data: Partial<Recipe>) => guardedAction('KITCHEN', 'FIRE_KDS', () => upsertRecipeAction(tenantId, data)),
        updateRecipe: (id: string, data: Partial<Recipe>) => guardedAction('KITCHEN', 'FIRE_KDS', () => upsertRecipeAction(tenantId, { ...data, id })),
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
        upsertCampaign: (data: Partial<MarketingCampaign>) => guardedAction('MARKETING', 'SYNC_STATE', () => upsertCampaignAction(tenantId, data)),
        deleteCampaign: (id: string) => guardedAction('MARKETING', 'SYNC_STATE', () => deleteCampaignAction(tenantId, id)),
        upsertPost: (data: Partial<ScheduledPost>) => guardedAction('MARKETING', 'SYNC_STATE', () => upsertScheduledPostAction(tenantId, data)),
        deletePost: (id: string) => guardedAction('MARKETING', 'SYNC_STATE', () => deleteScheduledPostAction(tenantId, id)),
        upsertSegment: (data: Partial<MarketingSegment>) => guardedAction('CRM', 'SYNC_STATE', () => upsertSegmentAction(tenantId, data)),
        deleteSegment: (id: string) => guardedAction('CRM', 'SYNC_STATE', () => deleteSegmentAction(tenantId, id)),
    };
};

export const useHR = () => {
    const leaveRequests = useAtomValue(leaveRequestsAtom);
    const leaveBalances = useAtomValue(leaveBalancesAtom);
    const tenantId = useAtomValue(tenantIdAtom);

    return {
        leaveRequests: leaveRequests.data || [],
        leaveBalances: leaveBalances.data || [],
        isLoading: leaveRequests.loading || leaveBalances.loading, 
        createLeaveRequest: (data: Partial<LeaveRequest>) => guardedAction('HR', 'CALCULATE_HOURS', () => createLeaveRequestAction(tenantId, data)),
        approveLeaveRequest: (id: string) => guardedAction('HR', 'SIGN_CONTRACT', () => approveLeaveRequestAction(tenantId, id)),
        rejectLeaveRequest: (id: string, reason?: string) => guardedAction('HR', 'SIGN_CONTRACT', () => rejectLeaveRequestAction(tenantId, id, reason))
    };
};

export const useQuality = () => {
    useVisibilityPurge('deliveries');
    const node = useAtomValue(deliveriesNodeAtom);
    return { deliveries: node.data || [], isLoading: node.loading, error: node.error };
};

export const useQuotes = () => {
    useVisibilityPurge('quotes');
    const node = useAtomValue(quotesNodeAtom);
    return { 
        data: node.data || [], 
        quotes: node.data || [],
        isLoading: node.loading, 
        error: node.error,
        createQuote: (data: Record<string, unknown>) => guardedAction('QUOTES', 'CREATE_TRANSACTION', () => Promise.resolve(data))
    };
};

export const useNotifications = () => {
    return {
        addNotification: (notif: { type: Record<string, unknown>, title: string, message: string }) => {
            console.log("Notif Stub:", notif);
        }
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
    useVisibilityPurge('crms');
    const node = useAtomValue(crmsNodeAtom);
    const crms = node.data || [];
    const tenantId = useAtomValue(tenantIdAtom);

    const segments = useMemo(() => {
        const segMap: Record<string, number> = {};
        for (const c of crms as CRM[]) {
            const seg = c.segment || 'new';
            segMap[seg] = (segMap[seg] || 0) + 1;
        }
        return segMap;
    }, [crms]);

    const getCRMsBySegment = useCallback((segment: string) => {
        return (crms as CRM[]).filter((c: CRM) => c.segment === segment);
    }, [crms]);

    const searchCRMs = useCallback((query: string) => {
        const q = query.toLowerCase();
        return (crms as CRM[]).filter((c: CRM) => 
            c.name?.toLowerCase().includes(q) || 
            c.email?.toLowerCase().includes(q) || 
            c.phone?.includes(q)
        );
    }, [crms]);

    const getInactiveCRMs = useCallback((daysSinceLastVisit: number = 30) => {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysSinceLastVisit);
        return (crms as CRM[]).filter((c: CRM) => {
            if (!c.lastVisitDate) return true;
            return new Date(c.lastVisitDate) < threshold;
        });
    }, [crms]);

    const selectedCRM = useAtomValue(selectedCRMAtom);

    return {
        crms,
        segments,
        selectedCRM,
        isLoading: node.loading,
        error: node.error,
        getCRMsBySegment,
        searchCRMs,
        getInactiveCRMs,
        getActiveCRM: (id: string) => {
            return (crms as CRM[]).find((c: CRM) => c.id === id) || null;
        },
        upsertCRM: (data: Partial<CRM>) => guardedAction('CRM', 'SYNC_STATE', async () => {
            const path = `tenants/${tenantId}/crms`;
            const id = data.id || Nexus.adapter.generateId(path);
            await Nexus.adapter.set(`${path}/${id}`, { 
                ...data, 
                id, 
                updatedAt: new Date().toISOString(),
                createdAt: data.createdAt || new Date().toISOString()
            }, { merge: true });
        }),
        deleteCRM: (id: string) => guardedAction('CRM', 'SYNC_STATE', async () => {
            await Nexus.adapter.delete(`tenants/${tenantId}/crms/${id}`);
        })
    };
};

export const useRecipes = useKitchen;
export const useSuppliers = useInventory;
