/**
 * M109 — Giftcard double-spend lock (POS vs Web)
 *
 * Un bon 100 € peut être scanné en caisse au moment précis où le web-store
 * l'applique sur un ticket en ligne — les deux voient encore `balance = 100 €`
 * avant que le premier redeem persiste. Solution : lock déterministe court TTL
 * autour de (giftcardId, canal), avec rollback si le seal fiscal côté POS échoue.
 *
 * Storage : `tenants/{id}/giftCardLocks/{giftcardId}` — TTL 90 s défaut.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M109.
 * RBAC : `marketing.issue_giftcard` (Manager + PIN) pour émettre / débloquer.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type GiftCardChannel = 'pos' | 'web';

export interface GiftCardLock {
  giftcardId: string;
  lockedBy: GiftCardChannel;
  orderId?: string;
  amountInMicrounits: number;
  lockedAt: number;
  expiresAt: number;
  version: number;
}

export interface AcquireLockResult {
  success: boolean;
  lock?: GiftCardLock;
  conflict?: GiftCardLock;
  error?: 'ALREADY_LOCKED' | 'ACQUISITION_FAILED';
}

const DEFAULT_TTL_MS = 90 * 1000;

export class GiftCardLockService {
  private static path(tenantId: string, giftcardId: string): string {
    return `tenants/${tenantId}/giftCardLocks/${giftcardId}`;
  }

  static async acquire(
    tenantId: string,
    giftcardId: string,
    lockedBy: GiftCardChannel,
    amountInMicrounits: number,
    orderId?: string,
    ttlMs: number = DEFAULT_TTL_MS,
    now: number = Date.now(),
  ): Promise<AcquireLockResult> {
    const p = this.path(tenantId, giftcardId);
    try {
      const existing = (await Nexus.adapter.get<GiftCardLock>(p)) || null;
      if (existing && existing.expiresAt > now) {
        return { success: false, conflict: existing, error: 'ALREADY_LOCKED' };
      }

      const lock: GiftCardLock = {
        giftcardId,
        lockedBy,
        orderId,
        amountInMicrounits,
        lockedAt: now,
        expiresAt: now + ttlMs,
        version: (existing?.version ?? 0) + 1,
      };

      await Nexus.adapter.set(p, lock);
      await NexusEventBus.emit('finance.giftcard_locked', {
        v: 1,
        tenantId,
        giftcardId,
        lockedBy,
        orderId,
        amountInMicrounits,
        expiresAt: lock.expiresAt,
      });

      return { success: true, lock };
    } catch {
      return { success: false, error: 'ACQUISITION_FAILED' };
    }
  }

  static async release(tenantId: string, giftcardId: string): Promise<void> {
    try {
      await Nexus.adapter.delete(this.path(tenantId, giftcardId));
    } catch {
      /* idempotent : la lib delete peut throw sur missing, on ignore */
    }
  }

  static async get(tenantId: string, giftcardId: string, now: number = Date.now()): Promise<GiftCardLock | null> {
    try {
      const lock = (await Nexus.adapter.get<GiftCardLock>(this.path(tenantId, giftcardId))) || null;
      if (!lock) return null;
      if (lock.expiresAt <= now) return null;
      return lock;
    } catch {
      return null;
    }
  }
}
