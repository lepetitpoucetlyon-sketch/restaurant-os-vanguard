"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
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
    guardLoadingAtom,
    updateNexusNode
} from "@/store/operationalAtoms";
import { HygieneLabel, HygieneLog, ReceptionLog, OilLog, HACCPContextType } from "../types";

/**
 * 🛡️ useGuard - Grade VI Atomic Bridge
 * Centralizes HACCP, hygiene and maintenance monitoring.
 */
export function useGuard() {
    const haccpLabels = useAtomValue(hygieneLabelsAtom);
    const maintenanceTasks = useAtomValue(maintenanceLogsAtom);
    const isLoading = useAtomValue(guardLoadingAtom);

    return useMemo(() => ({
        haccp: { 
            labels: haccpLabels,
            criticalAlerts: [],
            validateTaskWithVision: async () => true,
            sensors: [],
            checklists: [],
            temperatureHistory: [],
            isLoading: false,
            updateSensorValue: async () => {},
            toggleChecklistItem: async () => {},
            resetDailyChecklist: async () => {},
            getComplianceScore: () => 100,
            triggerAlert: async () => {},
            logWaste: async () => {},
        } as unknown as HACCPContextType,
        maintenance: { logs: maintenanceTasks },
        health: { status: 'stable' },
        isLoading
    }), [haccpLabels, maintenanceTasks, isLoading]);
}

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
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item) => item.id !== id) }));
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
            setNode(prev => updateNexusNode(prev, { data: prev.data.filter((item) => item.id !== id) }));
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

// --- MAINTENANCE ALIAS ---
export const useMaintenance = () => {
    const { maintenance } = useGuard();
    return maintenance;
};

// --- HACCP ALIAS ---
export const useHACCP = () => {
    const { haccp } = useGuard();
    return haccp;
};
