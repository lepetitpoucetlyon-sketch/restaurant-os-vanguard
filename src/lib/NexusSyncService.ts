import { logger } from '@/lib/logger';
import { Mutex } from '@/lib/utils/Mutex';
import { TaskContext } from '@/lib/icm';
import { bootstrapNexusSync } from './sync/NexusSyncBootstrap';
import { shutdownNexusSync } from './sync/NexusSyncShutdown';
import { replayPendingEvents } from './sync/outboxReplayer';

const syncMutex = new Mutex();

/**
 * 🛰️ NexusSyncService — Restaurant OS (Orchestrator shell).
 *
 * Fragmenté (anti god-file) :
 *   - Bootstrap séquence  → `sync/NexusSyncBootstrap.ts`
 *   - Shutdown séquence   → `sync/NexusSyncShutdown.ts`
 *   - Sub-syncs pilier    → `sync/pillarSyncRegistry.ts`
 *   - Gates sécurité      → `sync/syncGates.ts`
 *
 * Cet orchestrateur ne fait plus que : mutex + délégation + tenue des handles runtime.
 */
export const NexusSyncService = {
  healing_interval: null as NodeJS.Timeout | null,
  master_unsub: null as (() => void) | null,

  /**
   * Initialise les listeners opérationnels en parallèle.
   * Avec ICM-lite : seuls les modules HIGH/MEDIUM du TaskContext sont initialisés.
   * Target switch time: < 180ms.
   */
  async init(tenantId: string, task?: TaskContext) {
    const result = await syncMutex.run(async () => {
      await this._stopAllInternal();
      const handles = await bootstrapNexusSync(tenantId, task);
      if (handles) {
        this.master_unsub = handles.master_unsub;
        this.healing_interval = handles.healing_interval;
      }
    });

    if (result === null) {
      logger.warn('[NexusSyncService] Initialisation interceptée par le Mutex (Lock & Abort).');
    }
  },

  async stopAll() {
    return syncMutex.run(async () => {
      await this._stopAllInternal();
    });
  },

  async _stopAllInternal() {
    await shutdownNexusSync({
      healing_interval: this.healing_interval,
      master_unsub: this.master_unsub,
    });
    this.healing_interval = null;
    this.master_unsub = null;
  },

  async clearCache() {
    return this.stopAll();
  },

  /** P0-1 : Rejoue les événements bloqués dans l'Outbox au démarrage. */
  async replayPendingEvents(): Promise<void> {
    return replayPendingEvents();
  },
};
