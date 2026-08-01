"use client";
import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { fleetSnapshotAtom } from '@/store/pillars/sovereign';
import { fleetTelemetry } from './FleetTelemetryService';
import { FleetComplianceService } from './FleetComplianceService';
import { HACCPTelemetryBridge } from '@modules/compliance/qualite/haccp/services/HACCPTelemetryBridge';
import { NexusTelemetryService } from '@domain/services/NexusTelemetryService';
import { TenantID } from '@domain/types/brands';
import { fleetEngine } from '@/infrastructure/adapters/FleetAdapter';
import { EmpireInstance, EmpireGlobalMetrics } from '@nexus/contracts';
import { FleetInsight } from '@modules/intelligence/services/MacroBrain';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { whiteLabelInstanceConfig } from '@/config/instance';
import { mapSiteTelemetryToInstance, buildGlobalMetrics, buildConfigPatch } from './fleetMappers';
import { logger } from '@/lib/logger';

import { NexusFleetState } from '@nexus/contracts/nexus.types';

interface NexusFleetStateInternal extends Omit<NexusFleetState, 'tutorial'> {
    tutorial?: import('@nexus/contracts/nexus.types').NexusTutorialState;
}

const NexusFleetContext = createContext<NexusFleetStateInternal | undefined>(undefined);

function checkOtaUpdate(
  tenantConfig: { status?: { targetVersion?: string; otaUrl?: string } },
  currentVersion: string
): { isUpdateAvailable: boolean; updateInfo: { version: string; url: string } | null } {
  const target = tenantConfig.status?.targetVersion;
  if (target && target !== currentVersion) {
    console.warn(`[NexusOTA] NEW VERSION DETECTED: ${target}. Current: ${currentVersion}`);
    return { isUpdateAvailable: true, updateInfo: { version: target, url: tenantConfig.status?.otaUrl || '' } };
  }
  return { isUpdateAvailable: false, updateInfo: null };
}

function applyIntelligenceUpdate(
  intelligence: { metrics?: unknown; insights?: FleetInsight[] },
  mappedInstances: EmpireInstance[],
  setGlobalMetrics: (m: EmpireGlobalMetrics) => void,
  setMacroInsights: (i: FleetInsight[]) => void,
): void {
  if (intelligence.metrics) setGlobalMetrics(buildGlobalMetrics(mappedInstances, intelligence.metrics));
  if (intelligence.insights) setMacroInsights(intelligence.insights);
}

function startAuthAwarePolling(
  refreshFleet: (bg?: boolean) => Promise<void>,
  onCleanup: (cleanup: () => void) => void
) {
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    if (cancelled || intervalId) return;
    refreshFleet();
    intervalId = setInterval(() => refreshFleet(true), 120000);
  };

  import('@/lib/firebase').then(({ auth }) => {
    if (cancelled) return;
    const unsub = auth.onAuthStateChanged(user => {
      if (cancelled) return;
      const devBypass = process.env.NEXT_PUBLIC_MCC_DEV_BYPASS === 'true';
      if (user || devBypass) {
        startPolling();
      } else if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    });
    onCleanup(() => unsub());
  }).catch(() => { /* firebase absent — skip polling */ });

  return () => {
    cancelled = true;
    if (intervalId) clearInterval(intervalId);
  };
}

function buildFleetStats(metrics: EmpireGlobalMetrics | null) {
    return {
        totalRevenue: metrics?.fleetTotalRevenue || 0,
        averageHealth: metrics?.averageHealthScore || 0,
        consolidated: {
            totalLaborCost: metrics?.totalLaborCost || 0,
            averageFoodCost: metrics?.averageFoodCost || 0
        }
    };
}

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
    const [globalInflationRate, setGlobalInflationRate] = useState(0);
    const [scenarios, setScenarios] = useState<import('@nexus/contracts').SimulationScenario[]>([]);

    const financialInsight = useMemo(() => ({
        revenue: globalMetrics?.fleetTotalRevenue ?? 0,
        foodCostPercent: globalMetrics?.averageFoodCost ?? 0,
        laborCostPercent: globalMetrics?.totalLaborCost ?? 0,
        primeCost: (globalMetrics?.averageFoodCost ?? 0) + (globalMetrics?.totalLaborCost ?? 0),
    }), [globalMetrics]);

    const runSimulation = useCallback(async (config: { name: string; description: string; inputs?: { priceChange?: number } }) => {
        logger.debug('[FleetIntelligence] Running simulation...', config);
        const priceChange = config.inputs?.priceChange ?? 1;
        const baseRevenue = globalMetrics?.fleetTotalRevenue ?? 0;
        const instanceCount = liveFleet.length;
        // Confidence grows with fleet size (more data = more reliable), capped at 80%
        // Revenue impact uses a conservative 8% elasticity; labor offset at 3%
        const newScenario = {
            id: crypto.randomUUID(),
            name: config.name,
            description: config.description,
            confidenceScore: Math.min(0.80, 0.50 + instanceCount * 0.05),
            projections: {
                revenueImpact: Math.round(baseRevenue * priceChange * 0.08),
                laborCostImpact: Math.round(baseRevenue * -0.03),
                netProfitChange: Math.round(baseRevenue * priceChange * 0.05)
            },
            inputs: config.inputs || {}
        };
        setScenarios(prev => [newScenario, ...prev]);
    }, [globalMetrics, liveFleet.length]);
    
    const setInstanceIds = useSetAtom(fleetSnapshotAtom);
    const tenantConfig = useAtomValue(tenantConfigAtom);

    const priceMultiplier = tenantConfig.status?.priceMultiplier || 1.0;

    useEffect(() => {
        if (!tenantConfig.id) return;
        NexusTelemetryService.start(tenantConfig.id);
        const ota = checkOtaUpdate(tenantConfig, whiteLabelInstanceConfig.version);
        setIsUpdateAvailable(ota.isUpdateAvailable);
        setUpdateInfo(ota.updateInfo);
        return () => NexusTelemetryService.stop();
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

            applyIntelligenceUpdate(intelligence, mappedInstances, setGlobalMetrics, setMacroInsights);

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
        logger.debug('[Fleet] Registering new instance:', instance);
        await fleetTelemetry.registerNode(instance.id as TenantID);
        await refreshFleet(true);
    };

    const launchPreview = (key: string) => {
        logger.debug('[Fleet] Launching digital twin preview for:', key);
        window.open(`/preview/${key}`, '_blank');
    };

    const broadcastConfiguration = async (config: { 
        priceMultiplier?: number; 
        targetVersion?: string; 
        maintenanceMode?: boolean;
        licenceStatus?: 'ACTIVE' | 'LOCKED';
    }) => {
        logger.debug('[Fleet] Broadcasting global configuration via stream:', config);

        const patch = buildConfigPatch(config);
        const targetIds = liveFleet.map(f => f.id);
        await fleetTelemetry.broadcastConfiguration(patch, targetIds);
        
        logger.debug('[Fleet] Broadcast events emitted into the sovereign stream.');
    };

    useEffect(() => {
        let authCleanup: (() => void) | undefined;
        const stopPolling = startAuthAwarePolling(refreshFleet, (fn) => { authCleanup = fn; });
        return () => { stopPolling(); authCleanup?.(); };
    }, [refreshFleet]);

    const stats = useMemo(() => buildFleetStats(globalMetrics), [globalMetrics]);

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
        toggleTrainingMode: () => { logger.debug('[Fleet] Toggling training mode...'); },
        triggerRebalancing: async () => { logger.debug('[Fleet] Triggering rebalancing...'); },
        nodes: [] as import('@/shared/nexus-contract').SovereignData[],
        health: 'stable',
        tutorial: {
            isActive: false,
            step: 0,
            start: () => {},
            stop: () => {},
            startTutorial: (section?: import('@nexus/contracts/nexus.types').NexusTutorialSection) => {
                logger.debug('[Tutorial] Starting section:', section?.id);
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
