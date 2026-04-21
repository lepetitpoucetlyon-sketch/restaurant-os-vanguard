import { WritableAtom } from 'jotai';
import { logger } from '@/lib/logger';
import { NexusNode, updateNexusNode } from '@/store/nexusNodeFactory';

/**
 * 🏛️ GlobalRegistryService - Restaurant OS (Grade VI)
 * Single source of truth for all operational atoms.
 * Enables O(1) fleet-wide purge and memory management.
 */
interface RegisteredAtom {
    atom: WritableAtom<NexusNode<unknown>, [NexusNode<unknown> | ((prev: NexusNode<unknown>) => NexusNode<unknown>)], void>;
    lastAccessed: number;
    usageCount: number;
}

const registry = new Map<string, RegisteredAtom>();

/**
 * 🧛 Orphan Registry (Grade VI)
 * Uses WeakRef to track temporary nodes that should not block GC.
 */
const orphanNodesRegistry = new Map<string, WeakRef<object>>();
const cleanupRegistry = new FinalizationRegistry((id: string) => {
    logger.debug(`[Registry] GC collected orphan node: ${id}`);
    orphanNodesRegistry.delete(id);
});

export const GlobalRegistryService = {
    /**
     * Registers a new domain atom for memory management.
     */
    register(id: string, atom: WritableAtom<NexusNode<unknown>, [NexusNode<unknown> | ((prev: NexusNode<unknown>) => NexusNode<unknown>)], void>) {
        if (!registry.has(id)) {
            registry.set(id, {
                atom,
                lastAccessed: Date.now(),
                usageCount: 0
            });
            logger.debug(`[Registry] Atom '${id}' registered.`);
        }
    },

    /**
     * 🛰️ Orphan Registration (WeakRef)
     * Tracks temporary atoms for manual GC monitoring or leak detection.
     */
    registerOrphan(id: string, atom: object) {
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
    release(id: string, store?: { set: (atom: WritableAtom<unknown, unknown[], void>, value: unknown) => void }) {
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
    purgeInactive(store: { set: (atom: WritableAtom<unknown, unknown[], void>, value: unknown) => void }, ttlMax: number = 120000) {
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
    forceNuclearPurge(store: { set: (atom: WritableAtom<unknown, unknown[], void>, value: unknown) => void }) {
        this.purgeInactive(store, -1);
    },

    getInventory() {
        return Array.from(registry.keys());
    },
    
    getEntry(id: string) {
        return registry.get(id);
    }
};

