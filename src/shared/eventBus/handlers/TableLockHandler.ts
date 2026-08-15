/**
 * TableLockHandler — Ops 1.3 : prévention accès concurrent table
 *
 * Quand une table est verrouillée (`table.locked`), persiste le lock dans Nexus
 * pour que tout autre opérateur qui tenterait d'accéder à cette table soit bloqué.
 * Le lock expire automatiquement après 5 minutes d'inactivité (géré par TTL Nexus).
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/** Durée du lock en ms (5 min) — toute action sur la table réinitialise ce TTL */
const LOCK_TTL_MS = 5 * 60 * 1000;

export function registerTableLockHandler(): () => void {
  const unbindLocked = NexusEventBus.on(
    'table.locked',
    async (payload) => {
      const { tenantId, tableId, lockedBy, reason, lockedAt } = payload;

      try {
        const lockPath = `tenants/${tenantId}/tableLocks/${tableId}`;
        await Nexus.adapter.set(lockPath, {
          tableId,
          lockedBy,
          reason,
          lockedAt,
          expiresAt: lockedAt + LOCK_TTL_MS,
        });

        logger.info(
          `[TableLock] Table ${tableId} verrouillée par ${lockedBy} (${reason})`
        );

        empireAudit.log({
          module: 'ops',
          action: 'TABLE_LOCKED',
          details: { tableId, lockedBy, reason },
          severity: 'low',
          timestamp: new Date(lockedAt),
        });
      } catch (err) {
        logger.error('[TableLock] Erreur verrouillage table', err);
        throw err;
      }
    },
    { id: 'table-lock', priority: 'HIGH' }
  );

  const unbindUnlocked = NexusEventBus.on(
    'table.unlocked',
    async (payload) => {
      const { tenantId, tableId, unlockedBy, reason, unlockedAt } = payload;

      try {
        const lockPath = `tenants/${tenantId}/tableLocks/${tableId}`;
        await Nexus.adapter.delete(lockPath);

        logger.info(
          `[TableLock] Table ${tableId} déverrouillée par ${unlockedBy} (${reason ?? 'normal'})`
        );

        empireAudit.log({
          module: 'ops',
          action: 'TABLE_UNLOCKED',
          details: { tableId, unlockedBy, reason },
          severity: 'low',
          timestamp: new Date(unlockedAt),
        });
      } catch (err) {
        logger.error('[TableLock] Erreur déverrouillage table', err);
        throw err;
      }
    },
    { id: 'table-unlock', priority: 'HIGH' }
  );

  return () => {
    unbindLocked();
    unbindUnlocked();
  };
}
