// @ts-nocheck
import { Nexus } from './nexus/NexusAdapter';
import { logger } from './logger';

/**
 * ⏰ TimeSync - Restaurant OS
 * Synchronizes local clock with Firestore Server Time to solve Clock Drift.
 * Ensures ephemeral signatures (< 500ms) are valid regardless of local device time.
 */
export const TimeSync = {
  offset: 0,
  isSynced: false,

  private_unsub: null as any,
  private_interval: null as any,

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
        } catch (e) {
            logger.warn('[TimeSync] Heartbeat failed (Offline?)');
        }
    };

    this.private_unsub = Nexus.adapter.onSnapshot(syncPath, (data) => {
        if (data) {
            const serverDate = data.heartbeat instanceof Date ? data.heartbeat : (data.heartbeat?.toDate?.() || new Date(data.heartbeat));
            if (serverDate) {
                const now = Date.now();
                this.offset = serverDate.getTime() - now;
                this.isSynced = true;
                logger.debug(`[TimeSync] Offset recalibrated: ${this.offset}ms`);
            }
        }
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
