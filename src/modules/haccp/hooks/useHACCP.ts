import { useAtomValue } from 'jotai';
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
    maintenanceLogsNodeAtom
} from '../store/complianceAtoms';
import { useNexusMutation } from '@/shared/hooks/useNexusMutation';
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
    const hygieneLabels = useAtomValue(hygieneLabelsAtom) as any[];
    const hygieneLogs = useAtomValue(hygieneLogsAtom) as any[];
    const receptionLogs = useAtomValue(receptionLogsAtom) as any[];
    const oilLogs = useAtomValue(oilLogsAtom) as any[];
    const wasteLogs = useAtomValue(wasteLogsAtom) as any[];
    const maintenanceLogs = useAtomValue(maintenanceLogsAtom) as any[];
    const isLoading = useAtomValue(guardLoadingAtom);

    // --- 🔨 LA FORGE DU MODULE ---
    const hygieneForge = useNexusMutation(hygieneLogsNodeAtom as any, 'hygieneLogs', 'HACCP');
    const labelForge = useNexusMutation(hygieneLabelsNodeAtom as any, 'hygieneLabels', 'HACCP');
    const receptionForge = useNexusMutation(receptionLogsNodeAtom as any, 'receptionLogs', 'HACCP');
    const maintenanceForge = useNexusMutation(maintenanceLogsNodeAtom as any, 'maintenanceLogs', 'HACCP');

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
            temp: 3 + Math.sin(i / 3) + (Math.random() * 0.5)
        }));
    }, []);

    const getComplianceScore = useCallback(() => {
        const totalChecks = hygieneLogs.length + receptionLogs.length + maintenanceLogs.length;
        if (totalChecks === 0) return 100;

        const failedChecks = [
            ...(hygieneLogs as any[]).filter(l => l.status === 'alert'),
            ...(receptionLogs as any[]).filter(l => l.integrityStatus === 'non-conforme'),
            ...(maintenanceLogs as any[]).filter(l => l.status === 'pending')
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
        addHygieneLog: (data: any) => hygieneForge.mutate('SET', `log_${Date.now()}`, data),
        addLabel: (data: any) => labelForge.mutate('SET', `lab_${Date.now()}`, data),
        addReception: (data: any) => receptionForge.mutate('SET', `rec_${Date.now()}`, data),
        addMaintenance: (data: any) => maintenanceForge.mutate('SET', `maint_${Date.now()}`, data)
    };
}
