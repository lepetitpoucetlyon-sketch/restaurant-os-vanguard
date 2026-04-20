// @ts-nocheck
// @ts-nocheck
"use client";

import { useAtomValue } from "jotai";
import { 
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
    const waste = useAtomValue(wasteLogsAtom);
    const analysis = useAtomValue(menuAnalysisSelector);
    const staffPerformance = useAtomValue(staffPerformanceSelector);
    const laborCostRatio = useAtomValue(laborCostRatioSelector);

    return {
        waste: { 
            data: waste.data || [], 
            isLoading: waste.loading, 
            error: waste.error 
        },
        analysis: { 
            data: analysis, 
            isLoading: false, 
            error: null 
        },
        staffPerformance: { 
            data: staffPerformance, 
            isLoading: false, 
            error: null 
        },
        laborCostRatio
    };
}
