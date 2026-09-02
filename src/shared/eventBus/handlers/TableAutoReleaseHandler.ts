import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/**
 * TableAutoReleaseHandler (Item R6)
 * Libère la table en fin de service et envoie une notification push instantanée à l'hôtesse et au chef de rang.
 */
export function registerTableAutoReleaseHandler(): () => void {
  const releaseTable = async (tenantId: string, tableId: string, reason: string) => {
    await Nexus.adapter.update(`tenants/${tenantId}/ops_nodes/${tableId}`, {
      status: 'available',
      seatedAt: null,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`[TableAutoRelease] Table ${tableId} libérée automatiquement (${reason})`);

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
      details: { tableId, reason },
      severity: 'low',
      timestamp: new Date(),
    });
  };

  const unsubCleaned = NexusEventBus.on(
    'table.cleaned',
    async (payload) => {
      const { tenantId, tableId } = payload;
      await releaseTable(tenantId, tableId, 'table nettoyée');
    },
    { id: 'table-auto-release-cleaned', priority: 'HIGH' },
  );

  const unsubCleared = NexusEventBus.on(
    'table.cleared',
    async (payload) => {
      const { tenantId, tableId, sessionEnd } = payload;
      if (sessionEnd !== true) {
        logger.info(`[TableAutoRelease] table.cleared sans sessionEnd=true pour table ${tableId} — aucune action`);
        return;
      }
      await releaseTable(tenantId, tableId, 'fin de service');
    },
    { id: 'table-auto-release-cleared', priority: 'HIGH' },
  );

  return () => {
    unsubCleared();
    unsubCleaned();
  };
}
