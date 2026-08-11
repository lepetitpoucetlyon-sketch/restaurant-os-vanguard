import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';

/**
 * NoShowTableReleaseHandler (P05-F)
 * Écoute 'reservation.no_show' (même événement que NoShowCRMHandler).
 * Libère la table associée et notifie l'hôtesse via WebPush.
 */
export function registerNoShowTableReleaseHandler(): () => void {
  return NexusEventBus.on(
    'reservation.no_show',
    async (payload) => {
      const { tenantId, reservationId } = payload;

      const reservation = await Nexus.adapter.get<{
        tableId?: string;
      }>(`tenants/${tenantId}/reservations/${reservationId}`);

      const tableId = reservation?.tableId;

      if (tableId) {
        await Nexus.adapter.update(`tenants/${tenantId}/tables/${tableId}`, {
          status: 'available',
          reservationId: null,
          updatedAt: new Date().toISOString(),
        });
        logger.info(`[NoShowTableRelease] Table ${tableId} libérée — no-show réservation ${reservationId}`);
      } else {
        logger.info(`[NoShowTableRelease] Pas de tableId pour la réservation ${reservationId} — aucune table à libérer`);
      }

      await browserPush.sendToRole(tenantId, 'hotesse', {
        title: 'Table libérée',
        body: `No-show confirmé — table disponible`,
      });

      empireAudit.log({
        module: 'ops',
        action: 'TABLE_RELEASED_NOSHOW',
        details: { reservationId, tableId: tableId ?? null },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'noshow-table-release', priority: 'HIGH' },
  );
}
