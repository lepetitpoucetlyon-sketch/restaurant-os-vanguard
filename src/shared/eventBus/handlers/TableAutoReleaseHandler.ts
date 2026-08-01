import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

/**
 * TableAutoReleaseHandler (P05-I)
 * L'événement 'table.seated' n'existe pas dans NexusEventBus.
 * L'événement 'table.cleared' a été ajouté dans NexusEventBus.ts — il convient mieux
 * (table vidée, fin de service). Ce handler libère la table uniquement si sessionEnd=true.
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
