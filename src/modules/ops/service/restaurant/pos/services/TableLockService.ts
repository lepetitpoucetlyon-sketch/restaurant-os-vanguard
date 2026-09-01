import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface TableLockData {
  tableId: string;
  lockedBy: string;
  lockedByName?: string;
  reason: string;
  lockedAt: number;
  expiresAt: number;
  version: number;
}

export interface AcquireLockResult {
  success: boolean;
  lock?: TableLockData;
  holder?: TableLockData;
  error?: string;
}

export interface ReleaseLockResult {
  success: boolean;
  error?: string;
}

/** TTL par défaut du lock : 2 minutes (renouvelé automatiquement par heartbeat) ou configuré via RBAC */
export function getDefaultLockTtlMs(): number {
  return getSetting<number>('pos', 'table_lock_ttl_sec', 120) * 1000;
}

/**
 * 🔒 TableLockService — Invariant #2 & #3 de Concurrence (DF-A1)
 *
 * Implémente le verrouillage optimiste / CAS (Compare-And-Swap) sur les tables de restaurant.
 * Empêche les conflits d'encaissement et de modification simultanée lors des rushs.
 */
export class TableLockService {
  /**
   * Tente d'acquérir le verrou CAS sur une table.
   */
  static async acquireLock(
    tenantId: string,
    tableId: string,
    operatorId: string,
    operatorName?: string,
    reason: string = 'order_in_progress',
    ttlMs: number = getDefaultLockTtlMs()
  ): Promise<AcquireLockResult> {
    const lockPath = `tenants/${tenantId}/tableLocks/${tableId}`;
    const now = Date.now();

    try {
      const existing = (await Nexus.adapter.get<TableLockData>(lockPath)) || null;

      // 1. Si un verrou actif existe et appartient à un AUTRE opérateur
      if (existing && existing.expiresAt > now && existing.lockedBy !== operatorId) {
        logger.warn(
          `[TableLockService] Concurrence rejetée: Table ${tableId} déjà verrouillée par ${existing.lockedByName || existing.lockedBy}`
        );
        return {
          success: false,
          holder: existing,
          error: 'TABLE_LOCKED_BY_OTHER',
        };
      }

      // 2. Acquisition ou renouvellement du verrou CAS
      const newVersion = (existing?.version ?? 0) + 1;
      const newLock: TableLockData = {
        tableId,
        lockedBy: operatorId,
        lockedByName: operatorName,
        reason,
        lockedAt: now,
        expiresAt: now + ttlMs,
        version: newVersion,
      };

      await Nexus.adapter.set(lockPath, newLock);

      // Émission de l'événement sur le bus
      await NexusEventBus.emit('table.locked', {
        v: 1,
        tenantId,
        tableId,
        lockedBy: operatorId,
        reason,
        lockedAt: now,
      });

      return {
        success: true,
        lock: newLock,
      };
    } catch (err) {
      logger.error(`[TableLockService] Échec acquisition lock table ${tableId}`, err);
      return {
        success: false,
        error: 'LOCK_ACQUISITION_FAILED',
      };
    }
  }

  /**
   * Libère le verrou d'une table.
   */
  static async releaseLock(
    tenantId: string,
    tableId: string,
    operatorId: string,
    force: boolean = false,
    reason: string = 'order_completed'
  ): Promise<ReleaseLockResult> {
    const lockPath = `tenants/${tenantId}/tableLocks/${tableId}`;
    const now = Date.now();

    try {
      const existing = (await Nexus.adapter.get<TableLockData>(lockPath)) || null;

      if (!existing) {
        return { success: true };
      }

      // Seul le détenteur ou un superviseur (force: true) peut libérer le verrou
      if (!force && existing.lockedBy !== operatorId && existing.expiresAt > now) {
        return {
          success: false,
          error: 'NOT_LOCK_OWNER',
        };
      }

      await Nexus.adapter.delete(lockPath);

      await NexusEventBus.emit('table.unlocked', {
        v: 1,
        tenantId,
        tableId,
        unlockedBy: operatorId,
        reason,
        unlockedAt: now,
      });

      return { success: true };
    } catch (err) {
      logger.error(`[TableLockService] Échec libération lock table ${tableId}`, err);
      return {
        success: false,
        error: 'LOCK_RELEASE_FAILED',
      };
    }
  }

  /**
   * Prolonge le TTL du verrou si l'opérateur est toujours actif sur la table.
   */
  static async heartbeat(
    tenantId: string,
    tableId: string,
    operatorId: string,
    ttlMs: number = getDefaultLockTtlMs()
  ): Promise<boolean> {
    const lockPath = `tenants/${tenantId}/tableLocks/${tableId}`;
    const now = Date.now();

    try {
      const existing = (await Nexus.adapter.get<TableLockData>(lockPath)) || null;
      if (!existing || existing.lockedBy !== operatorId) {
        return false;
      }

      const updatedLock: TableLockData = {
        ...existing,
        expiresAt: now + ttlMs,
      };

      await Nexus.adapter.set(lockPath, updatedLock);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupère l'état actuel du verrou d'une table (null si libre ou expiré).
   */
  static async getLock(tenantId: string, tableId: string): Promise<TableLockData | null> {
    const lockPath = `tenants/${tenantId}/tableLocks/${tableId}`;
    try {
      const lock = (await Nexus.adapter.get<TableLockData>(lockPath)) || null;
      if (!lock) return null;
      if (lock.expiresAt <= Date.now()) {
        return null;
      }
      return lock;
    } catch {
      return null;
    }
  }
}
