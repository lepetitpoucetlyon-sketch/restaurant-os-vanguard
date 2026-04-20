import { atom } from 'jotai';
import { v4 as uuidv4 } from 'uuid';

export interface NexusPulse {
    id: string;
    type: string;
    sourceModule: string;
    payload: any;
    timestamp: string;
}

/**
 * 🛰️ nexusPulseAtom
 * Shared event stream for cross-domain communication.
 */
export const nexusPulseAtom = atom<NexusPulse | null>(null);

/**
 * 📢 emitPulseAtom (Write-only)
 * Standardized way to broadcast a system event.
 */
export const emitPulseAtom = atom(
    null,
    (get, set, update: Omit<NexusPulse, 'id' | 'timestamp'>) => {
        const pulse: NexusPulse = {
            ...update,
            id: uuidv4(),
            timestamp: new Date().toISOString()
        };
        set(nexusPulseAtom, pulse);
        // On pourrait ici ajouter une persistance en base si besoin d'audit
    }
);
