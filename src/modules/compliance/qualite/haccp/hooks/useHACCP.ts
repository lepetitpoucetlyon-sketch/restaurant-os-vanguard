import { useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { SovereignData } from "@/shared/nexus/contracts";
import {
    hygieneLabelsAtom,
    hygieneLogsAtom,
    receptionLogsAtom,
    oilLogsAtom,
    wasteLogsAtom,
    maintenanceLogsAtom,
    guardLoadingAtom,
    hygieneLabelsNodeAtom,
    hygieneLogsNodeAtom,
    receptionLogsNodeAtom,
    maintenanceLogsNodeAtom,
    sensorReadingsAtom
} from '../store/complianceAtoms';
import { useNexusMutation } from '@shared/hooks/useNexusMutation';
import { 
    HygieneLog, 
    ReceptionLog, 
    MaintenanceLog 
} from '../types';

/**
 * 🛡️ useHACCP - Domatized Grade X Sovereign Bridge
 * Orchestre la sécurité alimentaire via la Forge de Souveraineté (Module HACCP).
 */
export function useHACCP() {
    const hygieneLabels = useAtomValue(hygieneLabelsAtom); 
    const hygieneLogs = useAtomValue(hygieneLogsAtom);
    const receptionLogs = useAtomValue(receptionLogsAtom);
    const oilLogs = useAtomValue(oilLogsAtom);
    const wasteLogs = useAtomValue(wasteLogsAtom);
    const maintenanceLogs = useAtomValue(maintenanceLogsAtom);
    const isLoading = useAtomValue(guardLoadingAtom);

    // --- 🔨 LA FORGE DU MODULE ---
    const hygieneForge = useNexusMutation<HygieneLog>(hygieneLogsNodeAtom, 'hygieneLogs', 'HACCP');
    const labelForge = useNexusMutation<SovereignData & { id: string }>(hygieneLabelsNodeAtom, 'hygieneLabels', 'HACCP');
    const receptionForge = useNexusMutation<ReceptionLog>(receptionLogsNodeAtom, 'receptionLogs', 'HACCP');
    const maintenanceForge = useNexusMutation<MaintenanceLog>(maintenanceLogsNodeAtom, 'maintenanceLogs', 'HACCP');

    const sensorReadings = useAtomValue(sensorReadingsAtom);

    const temperatureHistory = useMemo(() => {
        return Array.from({ length: 24 }).map((_, i) => ({
            time: `${i}:00`,
            temp: 3 + Math.sin(i / 3) + (Math.sin(i * 1.5) * 0.5) // Deterministic pseudo-random
        }));
    }, []);

    const getComplianceScore = useCallback(() => {
        const totalChecks = hygieneLogs.length + receptionLogs.length + maintenanceLogs.length;
        if (totalChecks === 0) return 100;

        const failedChecks = [
            ...hygieneLogs.filter(l => l.status === 'alert'),
            ...receptionLogs.filter(l => l.status === 'alert' || l.integrityStatus === 'non-conforme'),
            ...maintenanceLogs.filter(l => l.status === 'pending')
        ].length;

        return Math.max(0, Math.min(100, 100 - (failedChecks * 5)));
    }, [hygieneLogs, receptionLogs, maintenanceLogs]);

    const criticalAlerts = useMemo(() => {
        return [
            ...hygieneLogs,
            ...receptionLogs,
            ...maintenanceLogs
        ].filter((log) => 
            log.status === 'critical' || 
            (log as { critical_issue?: boolean }).critical_issue || 
            (log as { integrityStatus?: string }).integrityStatus === 'non-conforme'
        );
    }, [hygieneLogs, receptionLogs, maintenanceLogs]);

    return {
        // Data
        hygieneLabels,
        hygieneLogs,
        receptionLogs,
        oilLogs,
        wasteLogs,
        maintenanceLogs,
        isLoading,
        criticalAlerts,
        
        getComplianceScore,
        checklists: ['Nettoyage Sol', 'Vidange Friteuse', 'Contrôle Températures'],
        sensors: sensorReadings,
        temperatureHistory,

        // --- 🔨 Forge Actions ---
        addHygieneLog: (data: Partial<HygieneLog>) => hygieneForge.mutate('SET', `log_${Date.now()}`, data as SovereignData),
        addLabel: (data: SovereignData) => labelForge.mutate('SET', `lab_${Date.now()}`, data),
        addReception: (data: Partial<ReceptionLog>) => receptionForge.mutate('SET', `rec_${Date.now()}`, data as SovereignData),
        addMaintenance: (data: Partial<MaintenanceLog>) => maintenanceForge.mutate('SET', `maint_${Date.now()}`, data as SovereignData)
    };
}
