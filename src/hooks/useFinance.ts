// @ts-nocheck
"use client";

import { useAccounting } from './useAccounting';

/**
 * 💰 useFinance - Grade VI Atomic Bridge
 * Redirige les appels legacy vers le moteur Accounting Core.
 */
export function useFinance() {
    const accounting = useAccounting();

    return {
        ...accounting,
        // Aligner les signatures si nécessaire
        stats: accounting.metrics,
        validateTransaction: accounting.validateJournalEntry
    };
}
