// @ts-nocheck
import { atom } from 'jotai';

export interface IngestionStatus {
    total: number;
    processed: number;
    errors: number;
    startTime: number | null;
    endTime: number | null;
    isProcessing: boolean;
    lastError: string | null;
}

export const ingestionStatusAtom = atom<IngestionStatus>({
    total: 0,
    processed: 0,
    errors: 0,
    startTime: null,
    endTime: null,
    isProcessing: false,
    lastError: null,
});

/**
 * Calculateur de progression (0-100)
 */
export const ingestionProgressAtom = atom((get) => {
    const status = get(ingestionStatusAtom);
    if (status.total === 0) return 0;
    return Math.round((status.processed / status.total) * 100);
});

/**
 * Estimation du temps restant (ms)
 */
export const ingestionETAtom = atom((get) => {
    const status = get(ingestionStatusAtom);
    if (!status.isProcessing || !status.startTime || status.processed === 0) return null;
    
    const elapsed = Date.now() - status.startTime;
    const rate = status.processed / elapsed; // items per ms
    const remaining = status.total - status.processed;
    
    return Math.round(remaining / rate);
});
