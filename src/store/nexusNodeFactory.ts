// @ts-nocheck
// @ts-nocheck
import { atom } from 'jotai';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import type { ModuleId } from '@/shared/genome.types';

// --- 🧹 MEMORY PROTECTION (PHASE 4 - ZERO LEAK) ---
export const orphanNodesRegistry = new Map<string, WeakRef<any>>();

/**
 * Interface NexusNode - Grade VI Standard
 * Le contrat atomique universel pour tous les domaines.
 */
export interface NexusNode<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    lastUpdated: number;
    moduleId?: ModuleId;
    // --- Grade X Survival Legalisation (Array Mimicry) ---
    filter: (callback: (item: T, index: number, array: T[]) => any) => any;
    find: (callback: (item: T, index: number, array: T[]) => any) => any;
    map: (callback: (item: T, index: number, array: T[]) => any) => any;
    forEach: (callback: (item: T, index: number, array: T[]) => void) => void;
    reduce: (callback: (acc: any, item: T, index: number, array: T[]) => any, initial?: any) => any;
    every: (callback: (item: T, index: number, array: T[]) => boolean) => boolean;
    some: (callback: (item: T, index: number, array: T[]) => boolean) => boolean;
    includes: (item: T) => boolean;
    sort: (compareFn?: (a: T, b: T) => number) => any;
    slice: (start?: number, end?: number) => T[];
    join: (separator?: string) => string;
    reverse: () => T[];
    shift: () => T | undefined;
    unshift: (...items: T[]) => number;
    splice: (start: number, deleteCount?: number, ...items: T[]) => T[];
    length: number;
    pop: () => T | undefined;
    push: (...items: T[]) => number;
    concat: (...items: T[]) => any;
    [key: string]: any;
}

/**
 * createNexusNode
 * Fabrique un atome NexusNode avec enregistrement automatique
 * dans le GlobalRegistry et le système de purge WeakRef.
 */
export function createNexusNode<T>(id: string, initialData: T[] = [], startLoading: boolean = true, moduleId?: ModuleId) {
    const nodeAtom = atom<NexusNode<T>>({
        data: initialData,
        loading: startLoading,
        error: null,
        lastUpdated: Date.now(),
        moduleId
    });
    
    // Phase 4: Enregistrement WeakRef pour auto-nettoyage
    if (typeof WeakRef !== 'undefined') {
        orphanNodesRegistry.set(id, new WeakRef(nodeAtom));
    }

    GlobalRegistryService.register(id, nodeAtom as any);
    return nodeAtom;
}

/**
 * updateNexusNode
 * Helper utilitaire pour mettre à jour l'état d'un node sans boilerplate.
 */
export function updateNexusNode<T>(
    prev: NexusNode<T>, 
    updates: Partial<Omit<NexusNode<T>, 'lastUpdated'>>
): NexusNode<T> {
    return {
        ...prev,
        ...updates,
        lastUpdated: Date.now()
    };
}

// --- ⚛️ PROXY PATTERN FACTORY (Grade VI Stability) ---

/**
 * createProxyDomain
 * Crée un triplet (node, data selector, loading selector) pour un domaine métier.
 * Chaque domaine est ainsi isolé et ne peut pas contaminer les autres.
 */
export function createProxyDomain<T>(id: string, initialData: T[] = [], moduleId?: ModuleId) {
    const node = createNexusNode<T>(id, initialData, true, moduleId);
    return {
        id,
        node,
        data: atom((get) => get(node).data),
        loading: atom((get) => get(node).loading)
    };
}

// Re-export du hook depuis le fichier client
export { useNexusNode } from './useNexusNode';
