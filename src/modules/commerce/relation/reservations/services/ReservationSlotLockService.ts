/**
 * M104 — CAS Google Reserve vs Widget Web
 *
 * Verrou atomique compare-and-swap sur un couple (tableId, slotIso) avant tout write
 * de réservation. Les deux canaux (Google Reserve + widget web) se battent pour la
 * dernière table à 19h59m58s : le premier acquiert le lock, le second reçoit une
 * `SLOT_ALREADY_LOCKED` et le UI propose une alternative.
 *
 * Storage Nexus `tenants/{id}/reservationSlotLocks/{tableId}__{slotIso}` — TTL par
 * défaut 5 min (holdTimeout, override via settings).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M104.
 * RBAC : `reservations.resolve_conflict` (Manager) pour forcer la libération.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

export type SlotLockHolder = 'google_reserve' | 'widget_web' | 'staff' | 'phone';

export interface ReservationSlotLock {
  tableId: string;
  slotIso: string;
  holder: SlotLockHolder;
  reservationId: string;
  lockedAt: number;
  expiresAt: number;
  version: number;
}

export interface AcquireSlotResult {
  success: boolean;
  lock?: ReservationSlotLock;
  conflict?: ReservationSlotLock;
  error?: 'SLOT_ALREADY_LOCKED' | 'ACQUISITION_FAILED';
}

const DEFAULT_HOLD_MINUTES = 5;

export class ReservationSlotLockService {
  private static keyFor(tableId: string, slotIso: string): string {
    return `${tableId}__${slotIso}`;
  }

  private static pathFor(tenantId: string, tableId: string, slotIso: string): string {
    return `tenants/${tenantId}/reservationSlotLocks/${this.keyFor(tableId, slotIso)}`;
  }

  /**
   * Tente d'acquérir le lock atomique (CAS via read → check → set).
   * Le "read then set" reste vulnérable à une vraie race si l'adapter n'expose pas
   * de transaction — les adapters Firestore doivent implémenter runTransaction()
   * en dessous ; ici on garantit au moins la sémantique holder-based.
   */
  static async acquire(
    tenantId: string,
    tableId: string,
    slotIso: string,
    holder: SlotLockHolder,
    reservationId: string,
    holdMinutes: number = DEFAULT_HOLD_MINUTES,
    now: number = Date.now(),
  ): Promise<AcquireSlotResult> {
    const path = this.pathFor(tenantId, tableId, slotIso);
    try {
      const existing = (await Nexus.adapter.get<ReservationSlotLock>(path)) || null;

      if (existing && existing.expiresAt > now) {
        // Idempotent : même holder + même reservation → renewal silencieux
        if (existing.holder === holder && existing.reservationId === reservationId) {
          const renewed: ReservationSlotLock = {
            ...existing,
            expiresAt: now + holdMinutes * 60 * 1000,
            version: existing.version + 1,
          };
          await Nexus.adapter.set(path, renewed);
          return { success: true, lock: renewed };
        }
        return {
          success: false,
          conflict: existing,
          error: 'SLOT_ALREADY_LOCKED',
        };
      }

      const lock: ReservationSlotLock = {
        tableId,
        slotIso,
        holder,
        reservationId,
        lockedAt: now,
        expiresAt: now + holdMinutes * 60 * 1000,
        version: (existing?.version ?? 0) + 1,
      };

      await Nexus.adapter.set(path, lock);

      await NexusEventBus.emit('commerce.table_lock_acquired', {
        v: 1,
        tenantId,
        tableId,
        slotIso,
        holder,
        reservationId,
        expiresAt: lock.expiresAt,
      });

      return { success: true, lock };
    } catch (err) {
      logger.error(`[ReservationSlotLockService] acquire failed`, err);
      return { success: false, error: 'ACQUISITION_FAILED' };
    }
  }

  static async release(tenantId: string, tableId: string, slotIso: string): Promise<void> {
    const path = this.pathFor(tenantId, tableId, slotIso);
    try {
      await Nexus.adapter.delete(path);
    } catch (err) {
      logger.warn(`[ReservationSlotLockService] release failed`, err);
    }
  }

  static async get(tenantId: string, tableId: string, slotIso: string, now: number = Date.now()): Promise<ReservationSlotLock | null> {
    const path = this.pathFor(tenantId, tableId, slotIso);
    try {
      const lock = (await Nexus.adapter.get<ReservationSlotLock>(path)) || null;
      if (!lock) return null;
      if (lock.expiresAt <= now) return null;
      return lock;
    } catch {
      return null;
    }
  }
}
