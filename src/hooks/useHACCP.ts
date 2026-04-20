import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
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
    oilLogsNodeAtom,
    wasteLogsNodeAtom,
    maintenanceLogsNodeAtom,
} from '@/store/operationalAtoms';
import { 
    HygieneLog, 
    HygieneLabel, 
    ReceptionLog, 
    OilLog, 
    RegulatoryWasteLog, 
    MaintenanceLog,
    SensorReading,
    TemperatureLog,
    HACCPChecklistItem
} from '@/types/haccp.types';
import { useNexusMutation } from './useNexusMutation';

/**
 * 🛡️ useHACCP - Grade X Sovereign Bridge
 * Orchestre la sécurité alimentaire via la Forge de Souveraineté.
 */
export function useHACCP() {
    const hygieneLabels = useAtomValue(hygieneLabelsAtom);
    const hygieneLogs = useAtomValue(hygieneLogsAtom);
    const receptionLogs = useAtomValue(receptionLogsAtom);
    const oilLogs = useAtomValue(oilLogsAtom);
    const wasteLogs = useAtomValue(wasteLogsAtom);
    const maintenanceLogs = useAtomValue(maintenanceLogsAtom);
    const isLoading = useAtomValue(guardLoadingAtom);

    // --- 🔨 LA FORGE (Sovereign Mutators) ---
    const hygieneForge = useNexusMutation<HygieneLog[]>(hygieneLogsNodeAtom, 'hygieneLogs', 'HACCP');
    const labelForge = useNexusMutation<HygieneLabel[]>(hygieneLabelsNodeAtom, 'hygieneLabels', 'HACCP');
    const receptionForge = useNexusMutation<ReceptionLog[]>(receptionLogsNodeAtom, 'receptionLogs', 'HACCP');
    const maintenanceForge = useNexusMutation<MaintenanceLog[]>(maintenanceLogsNodeAtom, 'maintenanceLogs', 'HACCP');
    const oilForge = useNexusMutation<OilLog[]>(oilLogsNodeAtom, 'oilLogs', 'HACCP');
    const wasteForge = useNexusMutation<RegulatoryWasteLog[]>(wasteLogsNodeAtom, 'wasteLogs', 'HACCP');

    /**
     * 🛰️ SIMULACRA : Capteurs Fantômes
     * Génère des données de capteurs réalistes pour la densification du système.
     */
    const getSimulatedSensors = useCallback((): SensorReading[] => {
        const now = new Date();
        const sensors: Omit<SensorReading, 'lastUpdated'>[] = [
            { id: 'S1', name: 'Chambre Froide Positive', type: 'temperature', value: 3.2, unit: '°C', status: 'ok' },
            { id: 'S2', name: 'Congélateur Négatif', type: 'temperature', value: -18.5, unit: '°C', status: 'ok' },
            { id: 'S3', name: 'Stock Sec', type: 'air_quality', value: 45, unit: '%', status: 'ok' }
        ];

        return sensors.map(s => {
            const drift = Math.sin(now.getTime() / 10000) * 0.5;
            return { 
                ...s, 
                value: parseFloat((s.value + drift).toFixed(1)),
                lastUpdated: now,
                status: (s.value + drift > 5) ? 'warning' : 'ok' 
            } as SensorReading;
        });
    }, []);

    const temperatureHistory = useMemo((): TemperatureLog[] => {
        return Array.from({ length: 24 }).map((_, i) => ({
            id: `temp_${i}`,
            storageLocationId: 'SL1',
            recordedAt: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
            temperature: 3 + Math.sin(i / 3) + (Math.random() * 0.5),
            recordedBy: 'System',
            isCompliant: true
        }));
    }, []);

    /**
     * Calcule le score de conformité global (Simulation logique Grade VI)
     */
    const getComplianceScore = useCallback(() => {
        const totalChecks = hygieneLogs.length + receptionLogs.length + maintenanceLogs.length;
        if (totalChecks === 0) return 100;

        const failedChecks = [
            ...hygieneLogs.filter(l => l.status === 'alert'),
            ...receptionLogs.filter(l => l.integrityStatus === 'non-conforme'),
            ...maintenanceLogs.filter(l => l.status === 'pending')
        ].length;

        return Math.max(0, Math.min(100, 100 - (failedChecks * 5)));
    }, [hygieneLogs, receptionLogs, maintenanceLogs]);

    const criticalAlerts = useMemo(() => {
        return [
            ...hygieneLogs,
            ...receptionLogs,
            ...maintenanceLogs
        ].filter((log: any) => 
            log.status === 'critical' || 
            log.status === 'alert' || 
            log.critical_issue || 
            log.integrityStatus === 'non-conforme'
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
        
        // 🛰️ Densified Stubs
        getComplianceScore,
        checklists: [
            { id: '1', task: 'Nettoyage Sol', frequency: 'daily', completed: false },
            { id: '2', task: 'Vidange Friteuse', frequency: 'weekly', completed: false },
            { id: '3', task: 'Contrôle Températures', frequency: 'daily', completed: true }
        ] as HACCPChecklistItem[],
        sensors: getSimulatedSensors(),
        temperatureHistory,

        // --- 🔨 Forge Actions ---
        addHygieneLog: (data: Partial<HygieneLog>) => hygieneForge.mutate('SET', `log_${Date.now()}`, { ...data, createdAt: new Date().toISOString() }),
        addLabel: (data: Partial<HygieneLabel>) => labelForge.mutate('SET', `lab_${Date.now()}`, { ...data, createdAt: new Date().toISOString() }),
        addReception: (data: Partial<ReceptionLog>) => receptionForge.mutate('SET', `rec_${Date.now()}`, { ...data, receptionDate: new Date().toISOString() }),
        addMaintenance: (data: Partial<MaintenanceLog>) => maintenanceForge.mutate('SET', `maint_${Date.now()}`, data),
        logOilControl: (data: Partial<OilLog>) => oilForge.mutate('SET', `oil_${Date.now()}`, { ...data, createdAt: new Date().toISOString() }),
        logWaste: (data: Partial<RegulatoryWasteLog>) => wasteForge.mutate('SET', `waste_${Date.now()}`, { ...data, timestamp: new Date().toISOString() }),
        
        // Stubs for future integration
        validateTaskWithVision: async (taskId: string, photoBase64: string) => {
            console.log('Vision Validation Requested', { taskId });
            return true;
        }
    };
}
