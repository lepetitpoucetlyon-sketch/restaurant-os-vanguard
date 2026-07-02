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
import { EmpireInstance, EmpireGlobalMetrics } from '@nexus/contracts';
import { FleetInsight } from '@domain/services/MacroBrain';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { whiteLabelInstanceConfig } from '@/config/instance';
import { mapSiteTelemetryToInstance, buildGlobalMetrics, buildConfigPatch } from './fleetMappers';

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
            const mappedInstances: EmpireInstance[] = (fleetData || []).map(mapSiteTelemetryToInstance);

            setInstanceIds(mappedInstances); // Update global state
            setLiveFleet(mappedInstances);

            // Atomic upgrade to Grade X Intelligence
            const intelligence = await fleetEngine.updateFleetIntelligence(mappedInstances);

            if (intelligence.metrics) {
                setGlobalMetrics(buildGlobalMetrics(mappedInstances, intelligence.metrics));
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

        const patch = buildConfigPatch(config);
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
