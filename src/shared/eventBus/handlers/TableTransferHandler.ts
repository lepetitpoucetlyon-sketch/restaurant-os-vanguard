/**
 * TableTransferHandler — Ops 1.3 : transfert de table
 *
 * Quand une commande est transférée d'une table à une autre (`table.transferred`),
 * met à jour le lien order→table dans Nexus et libère le lock de l'ancienne table.
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerTableTransferHandler(): () => void {
  return NexusEventBus.on(
    'table.transferred',
    async (payload) => {
      const { tenantId, fromTableId, toTableId, orderId, operatorId, transferredAt } = payload;

      try {
        // 1. Mettre à jour l'ordre avec le nouveau tableId
        const orderPath = `tenants/${tenantId}/orders/${orderId}`;
        const order = await Nexus.adapter.get<{ tableId?: string }>(orderPath);
        if (order) {
          await Nexus.adapter.update(orderPath, {
            tableId: toTableId,
            previousTableId: fromTableId,
            transferredAt,
            transferredBy: operatorId,
          });
        }

        // 2. Libérer le lock de la table source
        await Nexus.adapter.update(
          `tenants/${tenantId}/tableLocks/${fromTableId}`,
          { clearedAt: transferredAt, clearedReason: 'transferred' }
        ).catch(() => {
          // Pas de lock existant — OK
        });

        // 3. Émettre table.released pour l'ancienne table
        await NexusEventBus.emit('table.released', {
          v: 1,
          tenantId,
          tableId: fromTableId,
          orderId,
        });

        logger.info(
          `[TableTransfer] Commande ${orderId} : ${fromTableId} → ${toTableId} par ${operatorId}`
        );

        empireAudit.log({
          module: 'ops',
          action: 'TABLE_TRANSFERRED',
          details: { orderId, fromTableId, toTableId, operatorId },
          severity: 'low',
          timestamp: new Date(transferredAt),
        });
      } catch (err) {
        logger.error('[TableTransfer] Erreur transfert table', err);
        throw err;
      }
    },
    { id: 'table-transfer', priority: 'HIGH' }
  );
}
