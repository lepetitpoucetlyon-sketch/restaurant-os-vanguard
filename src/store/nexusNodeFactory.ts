import { atom } from 'jotai';
import { GlobalRegistryService } from '@/infrastructure/services/GlobalRegistryService';
import type { ModuleId } from '@shared/genome.types';

// --- 🧹 MEMORY PROTECTION (PHASE 4 - ZERO LEAK) ---
export const orphanNodesRegistry = new Map<string, WeakRef<object>>();

/**
 * Interface NexusNode - Grade VI Standard
 * Le contrat atomique universel pour tous les domaines.
 */
import { NexusNode } from './base';
export type { NexusNode };
// updateNexusNode vit dans ./base (module neutre) : ré-export pour préserver la
// surface, et GlobalRegistryService l'importe directement depuis base (cassage
// du cycle nexusNodeFactory <-> GlobalRegistryService).
export { updateNexusNode } from './base';

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

    GlobalRegistryService.register(id, nodeAtom);
    return nodeAtom;
}

import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { canDoAtom } from '@shared/nexus/state/SovereignGenome';

// --- ⚛️ PROXY PATTERN FACTORY (Grade VI Stability) ---

/**
 * createProxyDomain
 * Crée un triplet (node, data selector, loading selector) pour un domaine métier.
 * GRADE X: Injecte systématiquement un middleware de vérification RBAC.
 */
export function createProxyDomain<T>(id: string, initialData: T[] = [], moduleId?: ModuleId) {
    const node = createNexusNode<T>(id, initialData, true, moduleId);
    
    // Resolve permission for this domain
    const metadata = DomainRegistry.getMetadata(id);
    const permission = metadata.requiredPermission;

    return {
        id,
        node,
        data: atom((get) => {
            // 🛡️ RBAC ENFORCEMENT (Invisible & Automatic)
            const hasAccess = get(canDoAtom)(permission);
            if (!hasAccess) {
                return []; // Return empty array to prevent leak
            }
            return get(node).data;
        }),
        loading: atom((get) => {
            const hasAccess = get(canDoAtom)(permission);
            if (!hasAccess) return false;
            return get(node).loading;
        })
    };
}

// Re-export du hook depuis le fichier client
export { useNexusNode } from './useNexusNode';
