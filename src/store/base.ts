/**
 * 🧱 Nexus Base Store - Grade VI
 * Eradicates circular dependencies between Registry and Atoms.
 */

export interface NexusNode<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    lastUpdated: number;
}

/**
 * 🛰️ updateNexusNode
 * Helper de mise à jour atomique pour le store.
 */
export function updateNexusNode<T>(prev: NexusNode<T>, updates: Partial<NexusNode<T>>): NexusNode<T> {
    return {
        ...prev,
        ...updates,
        lastUpdated: Date.now()
    };
}
