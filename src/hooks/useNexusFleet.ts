"use client";

import { useAtom, useSetAtom } from "jotai";
import { useState, useMemo, useCallback } from "react";
import { fleetSnapshotAtom } from "@/store/operationalAtoms";
import { fleetTelemetry } from "@/domain/services/FleetTelemetryService";
import { fleetEngine } from "@/lib/nexus/NexusFleetEngine";
import { FleetComplianceService } from "@/domain/services/FleetComplianceService";
import { HACCPTelemetryBridge } from "@/domain/services/HACCPTelemetryBridge";
import { EmpireInstance } from "@/domain/types/empire";
import { FleetInsight, MacroBrain } from "@/domain/services/MacroBrain";

/**
 * 🛰️ useNexusFleet - Grade VI Atomic Bridge
 * Master Controller for Empire-wide instance monitoring and telemetry.
 */
export function useNexusFleet() {
    const [liveFleet, setLiveFleet] = useAtom(fleetSnapshotAtom);
    
    const [globalMetrics, setGlobalMetrics] = useState<any | null>(null);
    const [macroInsights, setMacroInsights] = useState<FleetInsight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

    const isEmpireMode = selectedInstanceId === null;

    const refreshFleet = useCallback(async (isBackground = false) => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

        if (!isBackground) setIsLoading(true);
        try {
            const fleetData = await fleetTelemetry.discoverRealFleet();
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
                    healthScore: f.healthScore || 100,
                    complianceScore: f.complianceScore || 100,
                    lowStockAlerts: f.lowStockAlerts || 0
                },
                branding: f.branding || { primaryColor: '#6366f1' },
                security: f.security || {
                    twoFactorEnabled: true,
                    nf525Certified: true,
                    supportAccessGranted: false
                }
            }));
            
            setLiveFleet(mappedInstances);

            const intelligence = await fleetEngine.updateFleetIntelligence(mappedInstances);
            if (intelligence.metrics) setGlobalMetrics(intelligence.metrics);
            if (intelligence.insights) setMacroInsights(intelligence.insights);

        } catch (error) {
            console.error('[useNexusFleet] Bridge: Sync failed:', error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [setLiveFleet]);

    const stats = useMemo(() => ({
        totalRevenue: globalMetrics?.totalRevenue || 0,
        averageHealth: globalMetrics?.averageHealth || 0,
        consolidated: {
            totalLaborCost: globalMetrics?.totalLaborCost || 0,
            averageFoodCost: globalMetrics?.averageFoodCost || 0
        }
    }), [globalMetrics]);

    return {
        instanceIds: liveFleet.map(f => f.id),
        instances: liveFleet,
        globalMetrics,
        stats,
        macroInsights,
        isLoading,
        isSyncing: isLoading,
        isEmpireMode,
        selectedInstanceId,
        refreshFleet,
        syncFleet: () => refreshFleet(false),
        triggerRebalancing: (insight: any) => MacroBrain.executeStrategicAction(insight),
        selectInstance: (id: string | null) => setSelectedInstanceId(id),
        registerInstance: async (instance: any) => {
            await refreshFleet(true);
        },
        launchPreview: (key: string) => {
            window.open(`/preview/${key}`, '_blank');
        },
        broadcastConfiguration: async (config: any) => {
            await new Promise(r => setTimeout(r, 800));
        },
        complianceService: FleetComplianceService,
        haccpBridge: HACCPTelemetryBridge,
        fleet: null, 
        crm: { customers: [] },
        intelligence: { insights: macroInsights }
    };
}
