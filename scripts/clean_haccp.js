const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = '/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE';
const NEXUS_GUARD_PATH = path.join(PROJECT_ROOT, 'src/shared/nexus/guards/NexusGuardProvider.tsx');
const HACCP_HOOKS_DIR = path.join(PROJECT_ROOT, 'src/verticals/restaurant/compliance/haccp/hooks');
const HACCP_HOOKS_FILE = path.join(HACCP_HOOKS_DIR, 'useHaccpHooks.ts');
const HACCP_HOOKS_INDEX = path.join(HACCP_HOOKS_DIR, 'index.ts');

// 1. EXTRACT HOOKS AND CREATE useHaccpHooks.ts
console.log('Creating useHaccpHooks.ts...');
const hooksContent = `
import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { 
    hygieneLabelsAtom, 
    hygieneLabelsNodeAtom,
    maintenanceLogsAtom,
    hygieneLogsAtom,
    hygieneLogsNodeAtom,
    receptionLogsAtom,
    receptionLogsNodeAtom,
    oilLogsAtom,
    oilLogsNodeAtom,
    guardLoadingAtom
} from '@/store/pillars/compliance';
import { updateNexusNode } from '@/store/pillars/core';
import { logger } from '@/lib/logger';

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
} from '@/verticals/restaurant/compliance/haccp/types/domain';

// --- HACCP CONTEXT ---
export const useHACCP = () => {
    const haccpLabels = useAtomValue(hygieneLabelsAtom);
    
    return useMemo(() => ({
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
            logger.debug('Validating vision task', taskId, photoBase64.slice(0, 20));
            return true;
        },
        logWaste: async (data: Omit<RegulatoryWasteLog, 'id' | 'timestamp' | 'user'>) => { 
            logger.debug('[HACCP] Waste logged', data);
        }
    }), [haccpLabels]);
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
    const maintenanceTasks = useAtomValue(maintenanceLogsAtom);
    return { logs: maintenanceTasks as MaintenanceLog[] };
};
`;
fs.writeFileSync(HACCP_HOOKS_FILE, hooksContent);

try {
    const indexContent = fs.readFileSync(HACCP_HOOKS_INDEX, 'utf-8');
    if (!indexContent.includes('./useHaccpHooks')) {
        fs.appendFileSync(HACCP_HOOKS_INDEX, '\nexport * from \'./useHaccpHooks\';\n');
    }
} catch (e) {
    fs.writeFileSync(HACCP_HOOKS_INDEX, 'export * from \'./useHaccpHooks\';\n');
}

// 2. PURGE NexusGuardProvider.tsx
console.log('Purging NexusGuardProvider.tsx...');
let nexusGuardContent = fs.readFileSync(NEXUS_GUARD_PATH, 'utf-8');
// Keep only NexusGuard core logic, remove HACCP imports and hooks
nexusGuardContent = `
"use client";

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { guardLoadingAtom } from '@/store/pillars/compliance';

interface NexusGuardState {
    health: {
        status: 'stable' | 'degraded' | 'critical';
    };
    isLoading: boolean;
}

const NexusGuardContext = createContext<NexusGuardState | undefined>(undefined);

export const NexusGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const isLoading = useAtomValue(guardLoadingAtom);

    const contextValue: NexusGuardState = useMemo(() => ({
        health: { status: 'stable' as const },
        isLoading
    }), [isLoading]);

    return (
        <NexusGuardContext.Provider value={contextValue}>
            {children}
        </NexusGuardContext.Provider>
    );
};

export const useNexusGuard = () => {
    const context = useContext(NexusGuardContext);
    if (!context) throw new Error('useNexusGuard must be used within NexusGuardProvider');
    return context;
};
`;
fs.writeFileSync(NEXUS_GUARD_PATH, nexusGuardContent);

// 3. FIX IMPORTS ACROSS THE PROJECT
console.log('Fixing imports across the project...');

// Files to check based on ts_errors.log
const findCmd = `find ${PROJECT_ROOT}/src -type f \\( -name "*.ts" -o -name "*.tsx" \\)`;
const allFiles = execSync(findCmd).toString().trim().split('\n');

let updatedFiles = 0;

for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    // Fix imports from NexusGuardProvider
    const hooksToReplace = ['useHACCP', 'useHygieneLabels', 'useCreateHygieneLabel', 'useDeleteHygieneLabel', 'useHygieneLogs', 'useCreateHygieneLog', 'useDeleteHygieneLog', 'useUpdateHygieneLog', 'useReceptionLogs', 'useCreateReceptionLog', 'useDeleteReceptionLog', 'useOilLogs', 'useCreateOilLog', 'useMaintenance'];
    
    let hasNexusGuardImport = content.includes('@/shared/nexus/guards/NexusGuardProvider');
    
    if (hasNexusGuardImport) {
        let extractedHooks = [];
        for (const hook of hooksToReplace) {
            if (content.includes(hook)) {
                extractedHooks.push(hook);
                // Remove the hook from the original import line. A bit complex with regex.
                const regex = new RegExp(`\\b${hook}\\b\\s*,?\\s*`, 'g');
                content = content.replace(regex, '');
            }
        }
        
        // Clean up empty imports
        content = content.replace(/import\s*\{\s*\}\s*from\s*['"]@\/shared\/nexus\/guards\/NexusGuardProvider['"];?\n?/g, '');
        
        if (extractedHooks.length > 0) {
            modified = true;
            const newImport = `import { ${extractedHooks.join(', ')} } from '@/verticals/restaurant/compliance/haccp/hooks';\n`;
            content = newImport + content;
        }
    }

    // Fix imports of types from @nexus/contracts that belong to HACCP
    const typesToReplace = ['HygieneLabel', 'HygieneLog', 'ReceptionLog', 'OilLog', 'SensorReading', 'HACCPChecklistItem', 'TemperatureLog', 'RegulatoryWasteLog', 'MaintenanceLog'];
    let hasNexusContractsImport = content.includes('@nexus/contracts');
    
    if (hasNexusContractsImport && file !== HACCP_HOOKS_FILE && !file.includes('contracts/index.ts')) {
        let extractedTypes = [];
        for (const type of typesToReplace) {
            if (content.includes(type)) {
                extractedTypes.push(type);
                const regex = new RegExp(`\\b${type}\\b\\s*,?\\s*`, 'g');
                content = content.replace(regex, '');
            }
        }
        
        // Clean up empty imports
        content = content.replace(/import\s*\{\s*\}\s*from\s*['"]@nexus\/contracts['"];?\n?/g, '');
        
        if (extractedTypes.length > 0) {
            modified = true;
            const newImport = `import { ${extractedTypes.join(', ')} } from '@/verticals/restaurant/compliance/haccp/types/domain';\n`;
            content = newImport + content;
        }
    }

    if (modified) {
        fs.writeFileSync(file, content);
        updatedFiles++;
    }
}

console.log(`Updated ${updatedFiles} files.`);
