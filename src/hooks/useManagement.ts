"use client";

import { useAtomValue } from "jotai";
import { 
    wasteLogsNodeAtom,
    wasteLogsAtom, 
    menuAnalysisSelector, 
    staffPerformanceSelector, 
    laborCostRatioSelector 
} from "@/store/operationalAtoms";

/**
 * 📊 useManagement - Grade VI Atomic Bridge
 * Aide à la décision stratégique et optimisation des marges opérationnelles.
 */
export function useManagement() {
    const wasteNode = useAtomValue(wasteLogsNodeAtom) as { data: import('@nexus/contracts').RegulatoryWasteLog[], loading: boolean, error: string | null };
    const waste = wasteNode.data;
    const analysis = useAtomValue(menuAnalysisSelector);
    const staffPerformance = useAtomValue(staffPerformanceSelector);
    const laborCostRatio = useAtomValue(laborCostRatioSelector);

    return {
        waste: { 
            data: waste || [], 
            isLoading: wasteNode.loading, 
            error: wasteNode.error 
        },
        analysis: { 
            data: analysis, 
            isLoading: false, 
            error: null as string | null
        },
        staffPerformance: { 
            data: staffPerformance, 
            isLoading: false, 
            error: null as string | null
        },
        laborCostRatio
    };
}
