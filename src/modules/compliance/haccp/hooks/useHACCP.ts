import { useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { SovereignData } from '@shared/nexus-contract';
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
    maintenanceLogsNodeAtom
} from '../store/complianceAtoms';
import { useNexusMutation } from '@shared/hooks/useNexusMutation';
import { 
    HygieneLog, 
    ReceptionLog, 
    MaintenanceLog, 
    SensorReading 
} from '../types';

/**
 * 🛡️ useHACCP - Domatized Grade X Sovereign Bridge
 * Orchestre la sécurité alimentaire via la Forge de Souveraineté (Module HACCP).
 */
export function useHACCP() {
    const hygieneLabels = useAtomValue(hygieneLabelsAtom) as unknown as SovereignData[];
    const hygieneLogs = useAtomValue(hygieneLogsAtom) as HygieneLog[];
    const receptionLogs = useAtomValue(receptionLogsAtom) as ReceptionLog[];
    const oilLogs = useAtomValue(oilLogsAtom) as unknown as SovereignData[];
    const wasteLogs = useAtomValue(wasteLogsAtom) as unknown as SovereignData[];
    const maintenanceLogs = useAtomValue(maintenanceLogsAtom) as MaintenanceLog[];
    const isLoading = useAtomValue(guardLoadingAtom);

    // --- 🔨 LA FORGE DU MODULE ---
    type NexusNodeAtom = import('jotai').WritableAtom<import('@/store/base').NexusNode<{ id: string }>, [import('jotai').SetStateAction<import('@/store/base').NexusNode<{ id: string }>>], void>;
    const hygieneForge = useNexusMutation(hygieneLogsNodeAtom as unknown as NexusNodeAtom, 'hygieneLogs', 'HACCP');
    const labelForge = useNexusMutation(hygieneLabelsNodeAtom as unknown as NexusNodeAtom, 'hygieneLabels', 'HACCP');
    const receptionForge = useNexusMutation(receptionLogsNodeAtom as unknown as NexusNodeAtom, 'receptionLogs', 'HACCP');
    const maintenanceForge = useNexusMutation(maintenanceLogsNodeAtom as unknown as NexusNodeAtom, 'maintenanceLogs', 'HACCP');

    /**
     * 🛰️ SIMULACRA : Capteurs Fantômes
     */
    const getSimulatedSensors = useCallback((): SensorReading[] => {
        const now = new Date();
        const sensors: SensorReading[] = [
        { id: 'S1', name: 'Chambre Froide Positive', type: 'temperature', value: 3.2, unit: '°C', status: 'ok', lastUpdated: new Date() },
        { id: 'S2', name: 'Congélateur Négatif', type: 'temperature', value: -18.5, unit: '°C', status: 'ok', lastUpdated: new Date() },
        { id: 'S3', name: 'Stock Sec', type: 'humidity', value: 45, unit: '%', status: 'ok', lastUpdated: new Date() }
        ];

        return sensors.map(s => {
            const drift = Math.sin(now.getTime() / 10000) * 0.5;
            return { ...s, value: parseFloat((s.value + drift).toFixed(1)) };
        });
    }, []);

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
            ...receptionLogs.filter(l => (l as unknown as Record<string, string>).integrityStatus === 'non-conforme'),
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
            ('critical_issue' in log && (log as { critical_issue?: boolean }).critical_issue) || 
            ('integrityStatus' in log && log.integrityStatus === 'non-conforme')
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
        checklists: ['Nettoyage Sol', 'Vidange Friteuse', 'Contrôle Températures'],
        sensors: getSimulatedSensors(),
        temperatureHistory,

        // --- 🔨 Forge Actions ---
        addHygieneLog: (data: Partial<HygieneLog>) => hygieneForge.mutate('SET', `log_${Date.now()}`, data as SovereignData),
        addLabel: (data: SovereignData) => labelForge.mutate('SET', `lab_${Date.now()}`, data),
        addReception: (data: Partial<ReceptionLog>) => receptionForge.mutate('SET', `rec_${Date.now()}`, data as SovereignData),
        addMaintenance: (data: Partial<MaintenanceLog>) => maintenanceForge.mutate('SET', `maint_${Date.now()}`, data as SovereignData)
    };
}
