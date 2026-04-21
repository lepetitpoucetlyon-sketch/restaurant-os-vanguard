/**
 * 🧱 Nexus Base Store - Grade VI
 * Eradicates circular dependencies between Registry and Atoms.
 */

export interface NexusNode<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    lastUpdated: number;
    // --- Grade X Survival Legalisation (Array Mimicry) ---
    filter: (callback: (item: T, index: number, array: T[]) => boolean) => T[];
    find: (callback: (item: T, index: number, array: T[]) => boolean) => T | undefined;
    map: <U>(callback: (item: T, index: number, array: T[]) => U) => U[];
    forEach: (callback: (item: T, index: number, array: T[]) => void) => void;
    reduce: <U>(callback: (acc: U, item: T, index: number, array: T[]) => U, initial: U) => U;
    every: (callback: (item: T, index: number, array: T[]) => boolean) => boolean;
    some: (callback: (item: T, index: number, array: T[]) => boolean) => boolean;
    includes: (item: T) => boolean;
    sort: (compareFn?: (a: T, b: T) => number) => T[];
    slice: (start?: number, end?: number) => T[];
    join: (separator?: string) => string;
    reverse: () => T[];
    shift: () => T | undefined;
    unshift: (...items: T[]) => number;
    splice: (start: number, deleteCount?: number, ...items: T[]) => T[];
    length: number;
    pop: () => T | undefined;
    push: (...items: T[]) => number;
    concat: (...items: T[]) => T[];
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
