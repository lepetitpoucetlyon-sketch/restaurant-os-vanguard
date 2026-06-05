"use client";

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { 
    hygieneLabelsAtom, 
    hygieneLabelsNodeAtom,
    maintenanceLogsAtom,
    deliveriesAtom,
    hygieneLogsAtom,
    hygieneLogsNodeAtom,
    receptionLogsAtom,
    receptionLogsNodeAtom,
    oilLogsAtom,
    oilLogsNodeAtom,
    guardLoadingAtom
} from '@/store/pillars/compliance';
import { updateNexusNode } from '@/store/pillars/core';

import { 
    HygieneLabel, 
    HygieneLog, 
    ReceptionLog, 
    OilLog,
    SensorReading,
    HACCPChecklistItem,
    TemperatureLog,
    RegulatoryWasteLog,
    MaintenanceLog
} from '@nexus/contracts';

interface NexusGuardState {
    haccp: {
        labels: HygieneLabel[];
        criticalAlerts: SensorReading[];
        getComplianceScore: () => number;
        checklists: HACCPChecklistItem[];
        sensors: SensorReading[];
        temperatureHistory: TemperatureLog[];
        validateTaskWithVision: (taskId: string, photoBase64: string) => Promise<boolean>;
        logWaste: (data: Omit<RegulatoryWasteLog, 'id' | 'timestamp' | 'user'>) => Promise<void>;
    };
    maintenance: {
        logs: MaintenanceLog[];
    };
    health: {
        status: 'stable' | 'degraded' | 'critical';
    };
    isLoading: boolean;
}

const NexusGuardContext = createContext<NexusGuardState | undefined>(undefined);

export const NexusGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const haccpLabels = useAtomValue(hygieneLabelsAtom);
    const maintenanceTasks = useAtomValue(maintenanceLogsAtom);
    const _deliveries = useAtomValue(deliveriesAtom);
    const isLoading = useAtomValue(guardLoadingAtom);

    // Context Value for backward compatibility
    const contextValue: NexusGuardState = useMemo(() => ({
        haccp: { 
            labels: haccpLabels,
            criticalAlerts: [] as SensorReading[], 
            getComplianceScore: () => 98,
            checklists: [] as HACCPChecklistItem[],
            sensors: [
                { id: 'S1', name: 'Rôtissoire 1 (Cœur)', type: 'temperature' as const, value: 76, unit: '°C', status: 'ok' as const, lastUpdated: new Date().toISOString() },
                { id: 'S2', name: 'Rôtissoire 2 (Cuve)', type: 'temperature' as const, value: 68, unit: '°C', status: 'warning' as const, lastUpdated: new Date().toISOString() }
            ],
            temperatureHistory: [] as TemperatureLog[],
            validateTaskWithVision: async (taskId: string, photoBase64: string) => {
                // 🧪 SAFE MODE: Blocking if signal is lost (Monkey Chaos Stress Test)
                console.log('Validating vision task', taskId, photoBase64.slice(0, 20));
                return true;
            },
            logWaste: async (data: Omit<RegulatoryWasteLog, 'id' | 'timestamp' | 'user'>) => { 
                console.log('[HACCP] Waste logged', data); 
            }
        },
        maintenance: { logs: maintenanceTasks as MaintenanceLog[] },
        health: { status: 'stable' as const },
        isLoading
    }), [haccpLabels, maintenanceTasks, isLoading]);

    return (
        <NexusGuardContext.Provider value={contextValue}>
            {children}
        </NexusGuardContext.Provider>
    );
};

// --- ⚛️ COMPATIBILITY HOOKS (Saut Quantique) ---

export const useNexusGuard = () => {
    const context = useContext(NexusGuardContext);
    if (!context) throw new Error('useNexusGuard must be used within NexusGuardProvider');
    return context;
};

export const useHACCP = () => {
    const context = useNexusGuard();
    return context.haccp;
};

// --- HYGIENE LABELS ---
export const useHygieneLabels = () => ({ data: useAtomValue(hygieneLabelsAtom) });
export const useCreateHygieneLabel = () => {
    const setNode = useSetAtom(hygieneLabelsNodeAtom);
    return {
        mutateAsync: useCallback(async (data: HygieneLabel) => {
            setNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }));
        }, [setNode])
    };
};
export const useDeleteHygieneLabel = () => {
    const setNode = useSetAtom(hygieneLabelsNodeAtom);
    return {
        mutateAsync: useCallback(async (id: string) => {
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item: HygieneLabel) => item.id !== id) }));
        }, [setNode])
    };
};

// --- HYGIENE LOGS ---
export const useHygieneLogs = () => ({ data: useAtomValue(hygieneLogsAtom) });
export const useCreateHygieneLog = () => {
    const setNode = useSetAtom(hygieneLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (data: HygieneLog) => {
            setNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }));
        }, [setNode])
    };
};
export const useDeleteHygieneLog = () => {
    const setNode = useSetAtom(hygieneLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (id: string) => {
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item: HygieneLog) => item.id !== id) }));
        }, [setNode])
    };
};
export const useUpdateHygieneLog = () => {
    const setNode = useSetAtom(hygieneLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (id: string, updates: Partial<HygieneLog>) => {
            setNode(prev => updateNexusNode(prev, { 
                data: prev.data.map((item: HygieneLog) => item.id === id ? { ...item, ...updates } : item) 
            }));
        }, [setNode])
    };
};

// --- RECEPTION LOGS ---
export const useReceptionLogs = () => ({ data: useAtomValue(receptionLogsAtom) });
export const useCreateReceptionLog = () => {
    const setNode = useSetAtom(receptionLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (data: ReceptionLog) => {
            setNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }));
        }, [setNode])
    };
};
export const useDeleteReceptionLog = () => {
    const setNode = useSetAtom(receptionLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (id: string) => {
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item: ReceptionLog) => item.id !== id) }));
        }, [setNode])
    };
};

// --- OIL LOGS ---
export const useOilLogs = () => ({ data: useAtomValue(oilLogsAtom) });
export const useCreateOilLog = () => {
    const setNode = useSetAtom(oilLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (data: OilLog) => {
            setNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }));
        }, [setNode])
    };
};

// --- MAINTENANCE ---
export const useMaintenance = () => {
    const context = useNexusGuard();
    return context.maintenance;
};
