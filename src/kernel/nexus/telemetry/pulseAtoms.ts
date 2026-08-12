import { atom, WritableAtom } from 'jotai';
import { SovereignData } from '@nexus/contracts/nexus-contract';

export interface NexusPulse {
    id: string;
    type: string;
    sourceModule: string;
    payload: SovereignData;
    timestamp: string;
}

/**
 * 🛰️ nexusPulseAtom
 * Shared event stream for cross-domain communication.
 */
export const nexusPulseAtom = atom<NexusPulse | null>(null) as WritableAtom<NexusPulse | null, [NexusPulse | null], void>;

/**
 * 📢 emitPulseAtom (Write-only)
 * Standardized way to broadcast a system event.
 */
export const emitPulseAtom = atom(
    null,
    (get, set, update: Omit<NexusPulse, 'id' | 'timestamp'>) => {
        const pulse: NexusPulse = {
            ...update,
            id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
        set(nexusPulseAtom, pulse);
        // On pourrait ici ajouter une persistance en base si besoin d'audit
    }
);
