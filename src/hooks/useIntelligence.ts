// @ts-nocheck
"use client";

import { useStrategicOracle } from './useStrategicOracle';

/**
 * 🧠 useIntelligence - Grade VI Atomic Bridge
 * Connecte l'UI aux insights générés par l'Oracle stratégique.
 */
export function useIntelligence() {
    const oracle = useStrategicOracle();

    return {
        ...oracle,
        // Compatibilité legacy pour les pages d'inventaire/finance
        globalInflationRate: 4.2, 
        getInsights: () => oracle.insights,
        refreshInsights: oracle.getExecutiveBriefing
    };
}
