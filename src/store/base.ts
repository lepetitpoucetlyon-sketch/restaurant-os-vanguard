/**
 * 🧱 Nexus Base Store - Grade VI
 * Eradicates circular dependencies between Registry and Atoms.
 */

import { atom } from 'jotai';

// --- 🧹 MEMORY PROTECTION (PHASE 4 - ZERO LEAK) ---
export const orphanNodesRegistry = new Map<string, WeakRef<object>>();

export interface NexusNode<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    lastUpdated: number;
    moduleId?: string;
}

/**
 * 🛰️ updateNexusNode
 * Helper de mise à jour atomique pour le store.
 * Guard : si data est la même référence, on ne bumpe pas lastUpdated — évite
 * de déclencher un re-render sur tous les subscribers quand le contenu n'a pas changé.
 */
export function updateNexusNode<T>(prev: NexusNode<T>, updates: Partial<NexusNode<T>>): NexusNode<T> {
    const incomingData = updates.data;
    if (incomingData !== undefined && incomingData === prev.data) {
        // Même référence → on applique les autres champs (loading, error…) sans changer lastUpdated
        const { data: _data, ...rest } = updates;
        return { ...prev, ...rest };
    }
    return {
        ...prev,
        ...updates,
        lastUpdated: Date.now(),
    };
}

/**
 * Atom partagé pour la date du jour (YYYY-MM-DD).
 * Initialisé au démarrage ; peut être mis à jour par un provider à minuit
 * pour que les selectors de stats (réservations, HACCP) recalculent au changement de jour.
 */
export const currentDateAtom = atom(new Date().toISOString().split('T')[0]);
