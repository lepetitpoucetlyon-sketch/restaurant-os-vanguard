import { WritableAtom } from 'jotai';
import { logger } from '@/lib/logger';
// Import depuis le module neutre ./base (et non nexusNodeFactory) pour casser
// le cycle GlobalRegistryService <-> nexusNodeFactory.
import { NexusNode, updateNexusNode } from '@/store/base';
import type { SetStateAction } from 'jotai';

interface RegisteredAtom<T> {
    atom: WritableAtom<NexusNode<T>, [SetStateAction<NexusNode<T>>], void>;
    lastAccessed: number;
    usageCount: number;
}

type NexusStoreSetter = { set: <T>(atom: WritableAtom<NexusNode<T>, [SetStateAction<NexusNode<T>>], void>, value: NexusNode<T> | ((prev: NexusNode<T>) => NexusNode<T>)) => void };


const registry = new Map<string, RegisteredAtom<unknown>>();

/**
 * 🧛 Orphan Registry (Grade VI)
 * Uses WeakRef to track temporary nodes that should not block GC.
 */
const orphanNodesRegistry = new Map<string, WeakRef<import("@/shared/nexus/contracts").SovereignData>>();

const cleanupRegistry = new FinalizationRegistry((id: string) => {
    logger.debug(`[Registry] GC collected orphan node: ${id}`);
    orphanNodesRegistry.delete(id);
});

export const GlobalRegistryService = {
    /**
     * Registers a new domain atom for memory management.
     */
    register<T>(id: string, atom: WritableAtom<NexusNode<T>, [SetStateAction<NexusNode<T>>], void>) {

        if (!registry.has(id)) {
            registry.set(id, {
                atom: atom as RegisteredAtom<unknown>['atom'],
                lastAccessed: Date.now(),
                usageCount: 0
            });
            if (typeof logger?.debug === 'function') {
                logger.debug(`[Registry] Atom '${id}' registered.`);
            }
        }
    },

    /**
     * 🛰️ Orphan Registration (WeakRef)
     * Tracks temporary atoms for manual GC monitoring or leak detection.
     */
    registerOrphan(id: string, atom: import("@/shared/nexus/contracts").SovereignData) {

        if (!orphanNodesRegistry.has(id)) {
            orphanNodesRegistry.set(id, new WeakRef(atom));
            cleanupRegistry.register(atom, id);
        }
    },

    /**
     * Marks an atom as strictly active.
     */
    touch(id: string) {
        const entry = registry.get(id);
        if (entry) {
            entry.lastAccessed = Date.now();
            entry.usageCount++;
        }
    },

    /**
     * Decrements usage count (for hook cleanup).
     * TRIGGER: Immediate GC if count reaches 0 for volatile domains.
     */
    release(id: string, store?: NexusStoreSetter) {

        const entry = registry.get(id);
        if (entry && entry.usageCount > 0) {
            entry.usageCount--;
            
            if (entry.usageCount === 0 && store) {
                logger.debug(`[Registry] Auto-purging unmounted domain: ${id}`);
                this.forceNuclearPurge(store);
            }
        }
    },

    /**
     * 🧹 Nuclear Purge (Zero Leak Policy)
     */
    purgeInactive(store: NexusStoreSetter, ttlMax: number = 120000) {

        const now = Date.now();
        let purgedCount = 0;

        registry.forEach((entry, id) => {
            const isIdle = entry.usageCount === 0;
            const isExpired = (now - entry.lastAccessed) > ttlMax;

            if (isIdle && isExpired) {
                logger.info(`[Registry] Purging idle atom: ${id}`);
                store.set(entry.atom, (prev: NexusNode<unknown>) => updateNexusNode(prev, { 
                    data: [], 
                    loading: true 
                }));
                purgedCount++;
            }
        });

        if (purgedCount > 0) {
            logger.info(`[Registry] Memory optimization complete. Purged: ${purgedCount} domains.`);
        }
    },

    /**
     * ☢️ Force Nuclear Purge
     */
    forceNuclearPurge(store: NexusStoreSetter) {

        this.purgeInactive(store, -1);
    },

    getInventory() {
        return Array.from(registry.keys());
    },
    
    getEntry(id: string) {
        return registry.get(id);
    }
};

