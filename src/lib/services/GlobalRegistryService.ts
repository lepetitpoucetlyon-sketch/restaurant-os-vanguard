// @ts-nocheck
// @ts-nocheck
import { WritableAtom } from 'jotai';
import { logger } from '@/lib/logger';
import { NexusNode, updateNexusNode } from '@/store/operationalAtoms';

/**
 * 🏛️ GlobalRegistryService - Restaurant OS (Grade VI)
 * Single source of truth for all operational atoms.
 * Enables O(1) fleet-wide purge and memory management.
 */
interface RegisteredAtom {
    atom: WritableAtom<NexusNode<any>, [any], void>;
    lastAccessed: number;
    usageCount: number;
}

const registry = new Map<string, RegisteredAtom>();

/**
 * 🧛 Orphan Registry (Grade VI)
 * Uses WeakRef to track temporary nodes that should not block GC.
 */
const orphanNodesRegistry = new Map<string, WeakRef<any>>();
const cleanupRegistry = new FinalizationRegistry((id: string) => {
    logger.debug(`[Registry] GC collected orphan node: ${id}`);
    orphanNodesRegistry.delete(id);
});

export const GlobalRegistryService = {
    /**
     * Registers a new domain atom for memory management.
     */
    register(id: string, atom: WritableAtom<NexusNode<any>, [any], void>) {
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
    registerOrphan(id: string, atom: any) {
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
    release(id: string, store?: any) {
        const entry = registry.get(id);
        if (entry && entry.usageCount > 0) {
            entry.usageCount--;
            
            // Phase 4: Immediate purge if no longer used
            if (entry.usageCount === 0 && store) {
                logger.debug(`[Registry] Auto-purging unmounted domain: ${id}`);
                this.forceNuclearPurge(store);
            }
        }
    },


    /**
     * 🧹 Nuclear Purge (Zero Leak Policy)
     * Resets all registered atoms that are NOT currently being used.
     * Prevents 8GB RAM saturation by freeing stale domain data.
     */
    purgeInactive(store: any, ttlMax: number = 120000) { // Default 2 min (Phase 4)
        const now = Date.now();
        let purgedCount = 0;

        registry.forEach((entry, id) => {
            const isIdle = entry.usageCount === 0;
            const isExpired = (now - entry.lastAccessed) > ttlMax;

            if (isIdle && isExpired) {
                logger.info(`[Registry] Purging idle atom: ${id}`);
                store.set(entry.atom, (prev: any) => updateNexusNode(prev, { 
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
     * IMMEDIATELY purges all idle atoms regardless of TTL.
     */
    forceNuclearPurge(store: any) {
        this.purgeInactive(store, -1); // Force immediate purge for all idle
    },

    /**
     * Returns the full map of registered entities.
     */
    getInventory() {
        return Array.from(registry.keys());
    },
    
    /**
     * Returns a specific registered entry.
     */
    getEntry(id: string) {
        return registry.get(id);
    }
};

