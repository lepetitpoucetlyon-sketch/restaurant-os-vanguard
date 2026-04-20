"use client";
import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { fleetSnapshotAtom } from '@/store/operationalAtoms';
import { fleetTelemetry } from '@/domain/services/FleetTelemetryService';
import { FleetComplianceService } from '@/domain/services/FleetComplianceService';
import { HACCPTelemetryBridge } from '@/domain/services/HACCPTelemetryBridge';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { TenantID } from '@/domain/types/brands';
import { fleetEngine } from '@/lib/nexus/NexusFleetEngine';
import { EmpireInstance } from '@/domain/types/empire';
import { FleetInsight } from '@/domain/services/MacroBrain';
import { tenantConfigAtom } from '@/store/fleetAtoms';
import { whiteLabelInstanceConfig } from '@/config/instance';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 🛰️ NexusFleetState - Grade V (NEXUS-LOW-RES)
 * Optimized for 8GB RAM using ID-First strategy.
 */
interface NexusFleetState {
    instanceIds: TenantID[];
    instances: any[];
    globalMetrics: any | null;
    stats: {
        totalRevenue: number;
        averageHealth: number;
        consolidated?: {
            totalLaborCost?: number;
            averageFoodCost?: number;
        };
    };
    macroInsights: any[];
    isLoading: boolean;
    isSyncing: boolean;
    isEmpireMode: boolean;
    selectedInstanceId: string | null;
    isUpdateAvailable: boolean;
    updateInfo: {
        version: string;
        url: string;
    } | null;
    priceMultiplier: number;
    refreshFleet: (isBackground?: boolean) => Promise<void>;
    syncFleet: () => Promise<void>;
    selectInstance: (id: string | null) => void;
    registerInstance: (instance: Record<string, unknown>) => Promise<void>;
    launchPreview: (key: string) => void;
    broadcastConfiguration: (config: Record<string, unknown>) => Promise<void>;
    complianceService: typeof FleetComplianceService;
    haccpBridge: typeof HACCPTelemetryBridge;
    isTrainingMode: boolean;
    toggleTrainingMode: () => void;
    // Legacy support proxies
    fleet: Record<string, unknown> | null;
    customer: Record<string, unknown>;
    intelligence: Record<string, unknown>;
    tutorial?: any;
}

const NexusFleetContext = createContext<NexusFleetState | undefined>(undefined);

/**
 * 🏥 NexusFleetProvider - The Heart of the Fleet
 * Implements "Hybrid-Shadow" state and "Smart-Focus" polling.
 */
export const NexusFleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [liveFleet, setLiveFleet] = useState<EmpireInstance[]>([]);
    const [globalMetrics, setGlobalMetrics] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
    
    // --- INTELLIGENCE STATE (Grade X) ---
    const [globalInflationRate, setGlobalInflationRate] = useState(2.4);
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [financialInsight, setFinancialInsight] = useState<any>({
        revenue: 425000,
        foodCostPercent: 28.5,
        laborCostPercent: 32.1,
        primeCost: 60.6
    });

    const runSimulation = useCallback(async (config: any) => {
        console.log('[FleetIntelligence] Running simulation...', config);
        await new Promise(r => setTimeout(r, 1500));
        const newScenario = {
            id: `sim_${Date.now()}`,
            name: config.name,
            description: config.description,
            confidenceScore: 0.85 + Math.random() * 0.1,
            projections: {
                revenueImpact: 12500 * (config.inputs?.priceChange || 1),
                laborCostImpact: -4500,
                netProfitChange: 8000
            }
        };
        setScenarios(prev => [newScenario, ...prev]);
    }, []);
    
    const setInstanceIds = useSetAtom(fleetSnapshotAtom);
    const tenantConfig = useAtomValue(tenantConfigAtom);

    const priceMultiplier = tenantConfig.status?.priceMultiplier || 1.0;

    // --- PHASE 3: HEARTBEAT & PHASE 5: OTA ---
    useEffect(() => {
        if (tenantConfig.id) {
            NexusTelemetryService.start(tenantConfig.id);

            // OTA Update Signal Check
            if (tenantConfig.status?.targetVersion && tenantConfig.status?.targetVersion !== whiteLabelInstanceConfig.version) {
                console.warn(`[NexusOTA] NEW VERSION DETECTED: ${tenantConfig.status?.targetVersion}. Current: ${whiteLabelInstanceConfig.version}`);
                setIsUpdateAvailable(true);
                setUpdateInfo({
                    version: tenantConfig.status?.targetVersion,
                    url: tenantConfig.status?.otaUrl || ''
                });
            } else {
                setIsUpdateAvailable(false);
                setUpdateInfo(null);
            }

            return () => NexusTelemetryService.stop();
        }
    }, [tenantConfig.id, tenantConfig.status?.targetVersion, tenantConfig.status?.otaUrl]);

    const isEmpireMode = selectedInstanceId === null;

    const [macroInsights, setMacroInsights] = useState<FleetInsight[]>([]);

    const refreshFleet = useCallback(async (isBackground = false) => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

        if (!isBackground) setIsLoading(true);
        try {
            const fleetData = await fleetTelemetry.discoverRealFleet();
            
            // Sync to Global Atom (Empire Snapshot)
            const mappedInstances: EmpireInstance[] = (fleetData || []).map(f => ({
                id: f.id,
                key: f.key || f.id,
                name: f.name || `Node ${f.id.slice(0, 4)}`,
                status: f.status || 'online',
                tier: f.tier || 'standard',
                version: f.version || '1.0.0',
                createdAt: f.createdAt || new Date().toISOString(),
                lastHeartbeat: f.lastHeartbeat || new Date().toISOString(),
                metrics: {
                    activeUsers: f.activeUsers || 0,
                    dailyRevenue: f.dailyRevenue || 0,
                    revenue24h: f.dailyRevenue || 0,
                    aiUsageCost: 0,
                    healthScore: f.healthScore || 100,
                    complianceScore: f.complianceScore || 100,
                    lowStockAlerts: f.lowStockAlerts || 0,
                    expiringItemsCount: 0
                },
                branding: f.branding || { primaryColor: '#6366f1' },
                featureFlags: {},
                security: f.security || {
                    twoFactorEnabled: true,
                    nf525Certified: true,
                    maintenanceAccessGranted: false,
                    supportAccessGranted: false
                }
            } as EmpireInstance));
            
            setInstanceIds(mappedInstances); // Update global state
            setLiveFleet(mappedInstances);

            // --- THE BRIDGING POINT ---
            // Atomically upgrade raw metrics into strategic insights via the FleetEngine
            const intelligence = await fleetEngine.updateFleetIntelligence(mappedInstances);
            if (intelligence.metrics) setGlobalMetrics(intelligence.metrics);
            if (intelligence.insights) setMacroInsights(intelligence.insights);

        } catch (error) {
            console.error('[Fleet] Sync failed:', error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [setInstanceIds]);

    const syncFleet = useCallback(async () => {
        await refreshFleet(false);
    }, [refreshFleet]);

    const selectInstance = (id: string | null) => setSelectedInstanceId(id);

    const registerInstance = async (instance: Record<string, unknown>) => {
        console.log('[Fleet] Registering new instance:', instance);
        await refreshFleet(true);
    };

    const launchPreview = (key: string) => {
        console.log('[Fleet] Launching digital twin preview for:', key);
        window.open(`/preview/${key}`, '_blank');
    };

    const broadcastConfiguration = async (config: Record<string, unknown>) => {
        console.log('[Fleet] Broadcasting global configuration:', config);
        // Simulate network delay
        await new Promise(r => setTimeout(r, 800));
        
        // Broadcasting to all nodes in the Empire
        try {
            for (const instance of liveFleet) {
                const patch: Record<string, unknown> = {
                    updatedAt: new Date().toISOString()
                };

                if (config.priceMultiplier !== undefined) {
                    patch['status.priceMultiplier'] = config.priceMultiplier;
                }
                if (config.targetVersion !== undefined) {
                    patch['status.targetVersion'] = config.targetVersion;
                }
                if (config.maintenance !== undefined) {
                    patch['status.maintenance'] = config.maintenance;
                }
                
                await Nexus.adapter.update(`tenants/${instance.id}`, patch);
            }
            console.log('[Fleet] Broadcast completed successfully across', liveFleet.length, 'nodes.');
        } catch (error) {
            console.error('[Fleet] Broadcast failed:', error);
        }
    };

    useEffect(() => {
        refreshFleet();
        const intervalId = setInterval(() => refreshFleet(true), 120000);
        return () => clearInterval(intervalId);
    }, [refreshFleet]);

    const stats = useMemo(() => ({
        totalRevenue: globalMetrics?.totalRevenue || 0,
        averageHealth: globalMetrics?.averageHealth || 0,
        consolidated: {
            totalLaborCost: globalMetrics?.totalLaborCost || 0,
            averageFoodCost: globalMetrics?.averageFoodCost || 0
        }
    }), [globalMetrics]);

    const contextValue = useMemo(() => ({
        instanceIds: liveFleet.map(f => f.id),
        instances: liveFleet,
        globalMetrics,
        stats,
        macroInsights,
        isLoading,
        isSyncing: isLoading,
        isEmpireMode,
        selectedInstanceId,
        isUpdateAvailable,
        updateInfo,
        priceMultiplier,
        isTrainingMode: false,
        toggleTrainingMode: () => {},
        refreshFleet,
        syncFleet,
        selectInstance,
        registerInstance,
        launchPreview,
        broadcastConfiguration,
        complianceService: FleetComplianceService,
        haccpBridge: HACCPTelemetryBridge,
        fleet: {} as any, 
        customer: { customers: [] } as any,
        intelligence: { 
            insights: macroInsights,
            globalInflationRate,
            setGlobalInflationRate,
            scenarios,
            runSimulation,
            financialInsight
        },
        tutorial: {
            isActive: false,
            step: 0,
            start: () => {},
            stop: () => {}
        }
    }), [liveFleet, globalMetrics, stats, macroInsights, isLoading, isEmpireMode, selectedInstanceId, isUpdateAvailable, updateInfo, priceMultiplier, refreshFleet, syncFleet, broadcastConfiguration, globalInflationRate, scenarios, runSimulation, financialInsight]);


    return (
        <NexusFleetContext.Provider value={contextValue as any}>
            {children}
        </NexusFleetContext.Provider>
    );
};

export const useNexusFleet = () => {
    const context = useContext(NexusFleetContext);
    if (!context) throw new Error('useNexusFleet error');
    return context;
};
