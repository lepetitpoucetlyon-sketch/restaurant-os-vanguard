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
    maintenanceLogsNodeAtom,
    updateNexusNode
} from '@/store/operationalAtoms';

/**
 * 🛡️ useHACCP - Grade VI Atomic Bridge
 * Orchestre la sécurité alimentaire et la conformité via Jotai.
 */
export function useHACCP() {
    const hygieneLabels = useAtomValue(hygieneLabelsAtom);
    const hygieneLogs = useAtomValue(hygieneLogsAtom);
    const receptionLogs = useAtomValue(receptionLogsAtom);
    const oilLogs = useAtomValue(oilLogsAtom);
    const wasteLogs = useAtomValue(wasteLogsAtom);
    const maintenanceLogs = useAtomValue(maintenanceLogsAtom);
    const isLoading = useAtomValue(guardLoadingAtom);

    // Helpers de mise à jour (Nodes)
    const setHygieneNode = useSetAtom(hygieneLogsNodeAtom);
    const setLabelNode = useSetAtom(hygieneLabelsNodeAtom);
    const setReceptionNode = useSetAtom(receptionLogsNodeAtom);
    const setMaintenanceNode = useSetAtom(maintenanceLogsNodeAtom);

    /**
     * Calcule le score de conformité global (Simulation logique Grade VI)
     */
    const getComplianceScore = useCallback(() => {
        const totalChecks = hygieneLogs.length + receptionLogs.length + maintenanceLogs.length;
        if (totalChecks === 0) return 100;

        const failedChecks = [
            ...hygieneLogs,
            ...receptionLogs,
            ...maintenanceLogs
        ].filter(log => log.status === 'fail' || log.critical).length;

        return Math.max(0, Math.min(100, 100 - (failedChecks * 5)));
    }, [hygieneLogs, receptionLogs, maintenanceLogs]);

    /**
     * Identifie les alertes critiques actives
     */
    const criticalAlerts = useMemo(() => {
        return [
            ...hygieneLogs,
            ...receptionLogs,
            ...maintenanceLogs
        ].filter(log => log.status === 'critical' || log.critical_issue);
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
        
        // Computed
        getComplianceScore,
        checklists: [], // Fallback pour compatibilité
        sensors: [],    // Fallback pour compatibilité
        temperatureHistory: [], // Fallback pour compatibilité

        // Actions
        addHygieneLog: (data: any) => setHygieneNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] })),
        addLabel: (data: any) => setLabelNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] })),
        addReception: (data: any) => setReceptionNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] })),
        addMaintenance: (data: any) => setMaintenanceNode(prev => updateNexusNode(prev, { data: [data, ...prev.data] }))
    };
}
