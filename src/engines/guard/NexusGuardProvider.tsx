"use client";

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { 
    hygieneLabelsAtom, 
    hygieneLabelsNodeAtom,
    maintenanceLogsAtom, 
    maintenanceLogsNodeAtom,
    deliveriesAtom, 
    deliveriesNodeAtom,
    hygieneLogsAtom,
    hygieneLogsNodeAtom,
    receptionLogsAtom,
    receptionLogsNodeAtom,
    oilLogsAtom,
    oilLogsNodeAtom,
    wasteLogsAtom,
    wasteLogsNodeAtom,
    guardLoadingAtom,
    updateNexusNode
} from '@/store/operationalAtoms';
import { 
    HygieneLabel, 
    HygieneLog, 
    ReceptionLog, 
    OilLog,
    SensorReading,
    HACCPChecklistItem,
    TemperatureLog
} from '@/types/haccp.types';

interface NexusGuardState {
    haccp: {
        labels: HygieneLabel[];
        criticalAlerts: SensorReading[];
        getComplianceScore: () => number;
        checklists: HACCPChecklistItem[];
        sensors: SensorReading[];
        temperatureHistory: TemperatureLog[];
        validateTaskWithVision: (data: any) => Promise<boolean>;
    };
    maintenance: {
        logs: any[];
    };
    health: {
        status: string;
    };
    isLoading: boolean;
}

const NexusGuardContext = createContext<NexusGuardState | undefined>(undefined);

export const NexusGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const haccpLabels = useAtomValue(hygieneLabelsAtom);
    const maintenanceTasks = useAtomValue(maintenanceLogsAtom);
    const deliveries = useAtomValue(deliveriesAtom);
    const isLoading = useAtomValue(guardLoadingAtom);

    // Context Value for backward compatibility
    const contextValue = useMemo(() => ({
        haccp: { 
            labels: haccpLabels,
            criticalAlerts: [], // Placeholder for real-time sensor integration
            getComplianceScore: () => 98,
            checklists: [],
            sensors: [],
            temperatureHistory: [],
            validateTaskWithVision: async () => true
        },
        maintenance: { logs: maintenanceTasks },
        health: { status: 'stable' },
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
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item: any) => item.id !== id) }));
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
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item: any) => item.id !== id) }));
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
        mutateAsync: useCallback(async (data: any) => {
            setNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }));
        }, [setNode])
    };
};
export const useDeleteReceptionLog = () => {
    const setNode = useSetAtom(receptionLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (id: string) => {
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item: any) => item.id !== id) }));
        }, [setNode])
    };
};

// --- OIL LOGS ---
export const useOilLogs = () => ({ data: useAtomValue(oilLogsAtom) });
export const useCreateOilLog = () => {
    const setNode = useSetAtom(oilLogsNodeAtom);
    return {
        mutateAsync: useCallback(async (data: any) => {
            setNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }));
        }, [setNode])
    };
};

// --- MAINTENANCE ---
export const useMaintenance = () => {
    const context = useNexusGuard();
    return context.maintenance;
};
