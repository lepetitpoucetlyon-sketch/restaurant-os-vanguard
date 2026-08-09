import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/**
 * 🏷️ NoShowHandler (GAP 4)
 * Écoute 'reservation.no_show' :
 * 1. Libère la table associée (`table.released`)
 * 2. Notifie le client suivant en file d'attente s'il y a un Waitlist actif
 * 3. Log l'événement d'audit
 */
export function registerNoShowHandler(): () => void {
  return NexusEventBus.on(
    'reservation.no_show',
    async (payload) => {
      const { tenantId, reservationId, customerName, covers, date, time } = payload;

      logger.info(`[NoShowHandler] Traitement No-Show pour réservation ${reservationId} (${customerName || 'Inconnu'})`);

      try {
        const resPath = `tenants/${tenantId}/reservations/${reservationId}`;
        const reservation = await Nexus.adapter.get<{ tableId?: string }>(resPath);

        const tableId = (payload as { tableId?: string }).tableId || (reservation && reservation.tableId) || `table_${reservationId}`;

        // 1. Libérer la table
        if (tableId) {
          await NexusEventBus.emit('table.released', {
            v: 1,
            tenantId,
            tableId,
            orderId: reservationId,
          });
          logger.info(`[NoShowHandler] Table ${tableId} libérée automatiquement`);
        }

        // 2. Notification Waitlist (prochain en file)
        const waitlistPath = `tenants/${tenantId}/waitlist`;
        const waitlistItems = await Nexus.adapter.query<{ id: string; status: string; customerName: string; covers: number }>(
          waitlistPath,
          { where: [{ field: 'status', operator: '==', value: 'waiting' }] }
        );

        if (waitlistItems.length > 0) {
          const nextInLine = waitlistItems[0];
          logger.info(`[NoShowHandler] Notification au prochain de la file d'attente : ${nextInLine.customerName} (${nextInLine.covers}p)`);

          await NexusEventBus.emitDurable('notification.created', {
            v: 1,
            id: `waitlist-notif-${nextInLine.id}-${Date.now()}`,
            tenantId,
            type: 'alert',
            title: 'Table Libérée !',
            message: `Une table vient de se libérer suite à un no-show. Prochain client : ${nextInLine.customerName} (${nextInLine.covers} pers).`,
            priority: 'high',
            read: false,
            timestamp: new Date().toISOString(),
          });
        }

        // 3. Audit
        empireAudit.log({
          module: 'ops',
          action: 'RESERVATION_NO_SHOW_HANDLED',
          details: { reservationId, customerName, covers, date, time },
          severity: 'medium',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[NoShowHandler] Erreur lors du traitement du no-show', err);
        throw err; // Débit pénalité Stripe possible → DLQ pour retry
      }
    },
    { id: 'no-show-handler', priority: 'HIGH' }
  );
}
