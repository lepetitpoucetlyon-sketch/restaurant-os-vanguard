import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

function parseHeartbeatDate(h: unknown): Date | null {
    if (h instanceof Date) return h;
    if (h && typeof h === 'object' && 'toDate' in h && typeof (h as { toDate: unknown }).toDate === 'function') {
        return (h as unknown as { toDate: () => Date }).toDate();
    }
    if (typeof h === 'string' || typeof h === 'number') return new Date(h);
    return null;
}

function applyTimeSyncData(ts: { offset: number; isSynced: boolean }, data: import('@/shared/nexus-contract').SovereignData): void {
    if (!data?.heartbeat) return;
    const serverDate = parseHeartbeatDate(data.heartbeat as unknown);
    if (!serverDate) return;
    ts.offset = serverDate.getTime() - Date.now();
    ts.isSynced = true;
    logger.debug(`[TimeSync] Offset recalibrated: ${ts.offset}ms`);
}

/**
 * ⏰ TimeSync - Restaurant OS
 * Synchronizes local clock with Firestore Server Time to solve Clock Drift.
 * Ensures ephemeral signatures (< 500ms) are valid regardless of local device time.
 */
export const TimeSync = {
  offset: 0,
  isSynced: false,

  private_unsub: null as (() => void) | null,
  private_interval: null as NodeJS.Timeout | null, // NodeJS.Timeout depends on environment


  /**
   * Initializes the heartbeat to calculate the drift offset.
   * Hardened to preserve singleton behavior and prevent leak cascades.
   */
  async init() {
    if (typeof window === 'undefined') return;
    if (this.private_interval || this.private_unsub) {
        logger.debug(`[TimeSync] Already active. Skipping re-init.`);
        return;
    }

    logger.info(`[TimeSync] Initializing Clock Synchronization...`);
    const syncPath = 'system/time_sync';
    
    // Heartbeat: Write server timestamp to calculate offset
    const performSync = async () => {
        try {
            await Nexus.adapter.set(syncPath, { heartbeat: new Date() }); 
        } catch (_e) {
            logger.warn('[TimeSync] Heartbeat failed (Offline?)');
        }
    };

    this.private_unsub = Nexus.adapter.onSnapshot<import('@/shared/nexus-contract').SovereignData>(syncPath, (data) => {
        applyTimeSyncData(this, data);
    });

    // Sync every 5 minutes (300,000ms) to maintain precision
    this.private_interval = setInterval(performSync, 300000);
    await performSync();
  },

  /**
   * 🧹 Cleanup - Zero Leak Policy
   */
  stop() {
    if (this.private_unsub) {
        this.private_unsub();
        this.private_unsub = null;
    }
    if (this.private_interval) {
        clearInterval(this.private_interval);
        this.private_interval = null;
    }
    this.isSynced = false;
    logger.info(`[TimeSync] Stopped.`);
  },

  /**
   * Returns the estimated server time.
   */
  now(): number {
    return Date.now() + this.offset;
  }
};
