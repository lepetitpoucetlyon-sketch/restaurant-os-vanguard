import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/**
 * TableAutoReleaseHandler (Item R6)
 * Libère la table en fin de service et envoie une notification push instantanée à l'hôtesse et au chef de rang.
 */
export function registerTableAutoReleaseHandler(): () => void {
  return NexusEventBus.on(
    'table.cleared',
    async (payload) => {
      const { tenantId, tableId, sessionEnd } = payload;

      if (sessionEnd !== true) {
        logger.info(`[TableAutoRelease] table.cleared sans sessionEnd=true pour table ${tableId} — aucune action`);
        return;
      }

      await Nexus.adapter.update(`tenants/${tenantId}/tables/${tableId}`, {
        status: 'available',
        seatedAt: null,
        updatedAt: new Date().toISOString(),
      });

      logger.info(`[TableAutoRelease] Table ${tableId} libérée automatiquement (fin de service)`);

      // ── Item R6: Notification WebPush Hôtesse & Chef de rang ───────────────
      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: `La Table ${tableId} est maintenant nettoyée et disponible pour accueil.`,
        roles: ['hotesse', 'chef_rang', 'manager'],
        priority: 'HIGH',
      });

      empireAudit.log({
        module: 'ops',
        action: 'TABLE_AUTO_RELEASED',
        details: { tableId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'table-auto-release', priority: 'HIGH' },
  );
}
