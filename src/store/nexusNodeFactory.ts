import { atom } from 'jotai';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import type { ModuleId } from '@/shared/genome.types';

// --- 🧹 MEMORY PROTECTION (PHASE 4 - ZERO LEAK) ---
export const orphanNodesRegistry = new Map<string, WeakRef<object>>();

/**
 * Interface NexusNode - Grade VI Standard
 * Le contrat atomique universel pour tous les domaines.
 */
import { NexusNode } from './base';
export type { NexusNode };

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
