"use client";
import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { fleetSnapshotAtom } from '@/store/pillars/sovereign';
import { fleetTelemetry } from '@domain/services/FleetTelemetryService';
import { FleetComplianceService } from '@domain/services/FleetComplianceService';
import { HACCPTelemetryBridge } from '@domain/services/HACCPTelemetryBridge';
import { NexusTelemetryService } from '@domain/services/NexusTelemetryService';
import { TenantID } from '@domain/types/brands';
import { fleetEngine } from '@/infrastructure/adapters/FleetAdapter';
import { SiteTelemetry, EmpireInstance, EmpireGlobalMetrics } from '@nexus/contracts';
import { FleetInsight } from '@domain/services/MacroBrain';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { whiteLabelInstanceConfig } from '@/config/instance';
import { SovereignValue } from '@/shared/nexus-contract';

import { NexusFleetState } from '@nexus/contracts/nexus.types';

interface NexusFleetStateInternal extends Omit<NexusFleetState, 'tutorial'> {
    tutorial?: import('@nexus/contracts/nexus.types').NexusTutorialState;
}

const NexusFleetContext = createContext<NexusFleetStateInternal | undefined>(undefined);

/**
 * 🏥 NexusFleetProvider - The Heart of the Fleet
 * Implements "Hybrid-Shadow" state and "Smart-Focus" polling.
 */
export const NexusFleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [liveFleet, setLiveFleet] = useState<EmpireInstance[]>([]);
    const [globalMetrics, setGlobalMetrics] = useState<EmpireGlobalMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
    
    // --- INTELLIGENCE STATE (Grade X) ---
    const [globalInflationRate, setGlobalInflationRate] = useState(2.4);
    const [scenarios, setScenarios] = useState<import('@nexus/contracts').SimulationScenario[]>([]); 
    const [financialInsight, _setFinancialInsight] = useState<{
        revenue: number;
        foodCostPercent: number;
        laborCostPercent: number;
        primeCost: number;
    }>({
        revenue: 425000,
        foodCostPercent: 28.5,
        laborCostPercent: 32.1,
        primeCost: 60.6
    });

    const runSimulation = useCallback(async (config: { name: string; description: string; inputs?: { priceChange?: number } }) => {
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
            },
            inputs: config.inputs || {}
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
            const mappedInstances: EmpireInstance[] = (fleetData || []).map((f: SiteTelemetry): EmpireInstance => {
                const branding = f.branding;
                const security = f.security;
                
                const lastSeenDate = (() => {
                    const ls = f.lastSeen;
                    if (typeof ls === 'string') return ls;
                    if (typeof ls === 'number') return new Date(ls).toISOString();
                    const seconds = (ls as { seconds?: number })?.seconds;
                    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
                    return new Date().toISOString();
                })();
                
                return {
                    id: f.id || f.key || `node-${Math.random().toString(36).substring(7)}`,
                    key: f.key || f.id || `key-${Math.random().toString(36).substring(7)}`,
                    name: f.name || `Nexus Node ${(f.id || '').slice(0, 4) || '??'}`,
                    status: f.status || 'ONLINE',
                    tier: f.tier || 'STANDARD',
                    version: f.engineVersion || '1.0.0',
                    createdAt: f.createdAt || new Date().toISOString(),
                    updatedAt: f.updatedAt || new Date().toISOString(),
                    lastHeartbeat: lastSeenDate,
                    metrics: {
                        activeUsers: Number(f.activeUsers) || 0,
                        dailyRevenue: Number(f.dailyRevenue) || 0,
                        revenue24h: Number(f.dailyRevenue) || 0,
                        aiUsageCost: 0,
                        healthScore: (() => {
                            if (!f.healthScore) {
                                import('@/lib/nexus/TelemetryService').then(({ TelemetryService }) => 
                                    TelemetryService.reportIssue('FALLBACK_VALUE', 'FleetEngine', { field: 'healthScore' })
                                );
                            }
                            return Number(f.healthScore) || 100;
                        })(),
                        complianceScore: Number(f.complianceScore) || 100,
                        lowStockAlerts: Number(f.lowStockAlerts) || 0,
                        expiringItemsCount: 0,
                        alerts: 0,
                        errorRate: 0,
                        uptime: 99.9
                    },
                    branding: {
                        primaryColor: (branding?.primaryColor as string) || '#6366f1',
                        secondaryColor: (branding?.secondaryColor as string) || '#a5b4fc',
                        logoUrl: (branding?.logoUrl as string) || '',
                        tagline: (branding?.tagline as string) || ''
                    },
                    featureFlags: Object.entries(f.featureFlags || {}).reduce((acc, [key, val]) => ({
                        ...acc,
                        [key]: Boolean(val)
                    }), {} as Record<string, boolean>),
                    security: {
                        twoFactorEnabled: Boolean(security?.twoFactorEnabled) || true,
                        nf525Certified: Boolean(security?.nf525Certified) || true,
                        maintenanceAccessGranted: Boolean(security?.maintenanceAccessGranted) || false,
                        supportAccessGranted: Boolean(security?.supportAccessGranted) || false
                    }
                };
            });
            
            setInstanceIds(mappedInstances); // Update global state
            setLiveFleet(mappedInstances);

            // Atomic upgrade to Grade X Intelligence
            const intelligence = await fleetEngine.updateFleetIntelligence(mappedInstances);
            
            if (intelligence.metrics) {
                const metrics: EmpireGlobalMetrics = {
                    totalInstances: mappedInstances.length,
                    activeFleetCount: mappedInstances.filter(m => m.status === 'ONLINE').length,
                    fleetTotalRevenue: Number(intelligence.metrics.totalRevenue) || 0,
                    totalActiveUsers: Number(intelligence.metrics.activeUsers) || 0,
                    averageHealthScore: Number(intelligence.metrics.averageHealth) || 0,
                    averageComplianceScore: 100,
                    criticalAlerts: mappedInstances.filter(m => m.status === 'CRITICAL').length,
                    totalRisks: 0,
                    totalMRR: 0,
                    averageDiscount: 0,
                    lockedInstances: 0,
                    totalLaborCost: Number(intelligence.metrics.totalLaborCost) || 0,
                    averageFoodCost: Number(intelligence.metrics.averageFoodCost) || 0
                };
                setGlobalMetrics(metrics);
            }
            
            if (intelligence.insights) {
                setMacroInsights(intelligence.insights);
            }

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

    const registerInstance = async (instance: EmpireInstance) => {
        console.log('[Fleet] Registering new instance:', instance);
        await fleetTelemetry.registerNode(instance.id as TenantID);
        await refreshFleet(true);
    };

    const launchPreview = (key: string) => {
        console.log('[Fleet] Launching digital twin preview for:', key);
        window.open(`/preview/${key}`, '_blank');
    };

    const broadcastConfiguration = async (config: { 
        priceMultiplier?: number; 
        targetVersion?: string; 
        maintenanceMode?: boolean;
        licenceStatus?: 'ACTIVE' | 'LOCKED';
    }) => {
        console.log('[Fleet] Broadcasting global configuration via stream:', config);
        
        const patch: Record<string, SovereignValue> = {};
        if (config.priceMultiplier !== undefined) patch['status.priceMultiplier'] = config.priceMultiplier;
        if (config.targetVersion !== undefined) patch['status.targetVersion'] = config.targetVersion;
        if (config.maintenanceMode !== undefined) patch['status.maintenance'] = config.maintenanceMode;
        if (config.licenceStatus !== undefined) patch['status.licenceStatus'] = config.licenceStatus;

        const targetIds = liveFleet.map(f => f.id);
        await fleetTelemetry.broadcastConfiguration(patch, targetIds);
        
        console.log('[Fleet] Broadcast events emitted into the sovereign stream.');
    };

    useEffect(() => {
        refreshFleet();
        const intervalId = setInterval(() => refreshFleet(true), 120000);
        return () => clearInterval(intervalId);
    }, [refreshFleet]);

    const stats = useMemo(() => ({
        totalRevenue: globalMetrics?.fleetTotalRevenue || 0,
        averageHealth: globalMetrics?.averageHealthScore || 0,
        consolidated: {
            totalLaborCost: globalMetrics?.totalLaborCost || 0,
            averageFoodCost: globalMetrics?.averageFoodCost || 0
        }
    }), [globalMetrics]);

    const contextValue: NexusFleetStateInternal = useMemo(() => ({
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
        refreshFleet,
        syncFleet,
        selectInstance,
        registerInstance,
        launchPreview,
        broadcastConfiguration,
        complianceService: FleetComplianceService,
        haccpBridge: HACCPTelemetryBridge,
        fleet: globalMetrics, 
        customer: { customers: [] as import('@/shared/nexus-contract').SovereignData[] },
        intelligence: { 
            globalInflationRate,
            setGlobalInflationRate,
            scenarios,
            runSimulation,
            financialInsight,
            predictSignatureChance: () => 0.5,
            predictLaborCost: () => 0.0
        },
        isTrainingMode: false,
        toggleTrainingMode: () => { console.log('[Fleet] Toggling training mode...'); },
        triggerRebalancing: async () => { console.log('[Fleet] Triggering rebalancing...'); },
        nodes: [] as import('@/shared/nexus-contract').SovereignData[],
        health: 'stable',
        tutorial: {
            isActive: false,
            step: 0,
            start: () => {},
            stop: () => {},
            startTutorial: (section?: import('@nexus/contracts/nexus.types').NexusTutorialSection) => {
                console.log('[Tutorial] Starting section:', section?.id);
            },
            stopTutorial: () => {},
            nextStep: () => {},
            prevStep: () => {},
            currentSection: {
                id: 'nexus_core',
                points: [] as import('@nexus/contracts/nexus.types').NexusTutorialStep[]
            },
            currentPointIndex: 0
        }
    }), [liveFleet, globalMetrics, stats, macroInsights, isLoading, isEmpireMode, selectedInstanceId, isUpdateAvailable, updateInfo, priceMultiplier, refreshFleet, syncFleet, broadcastConfiguration, globalInflationRate, scenarios, runSimulation, financialInsight]);


    return (
        <NexusFleetContext.Provider value={contextValue}>
            {children}
        </NexusFleetContext.Provider>
    );
};

export const useNexusFleet = () => {
    const context = useContext(NexusFleetContext);
    if (!context) throw new Error('useNexusFleet error');
    return context as NexusFleetStateInternal;
};
