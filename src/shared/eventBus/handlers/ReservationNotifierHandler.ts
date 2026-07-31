import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerReservationNotifierHandler() {
  const unsubCreated = NexusEventBus.on(
    'reservation.created',
    async (payload) => {
      const { tenantId, reservationId } = payload;
      logger.info(`[ReservationNotifier] Envoi notification client pour reservation.created sur réservation ${reservationId}`);
      empireAudit.log({
        module: 'crm',
        action: 'RESERVATION_NOTIFIED',
        details: { reservationId, eventType: 'reservation.created' },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'reservation-notifier-created', priority: 'BACKGROUND' }
  );

  const unsubUpdated = NexusEventBus.on(
    'reservation.updated',
    async (payload) => {
      const { tenantId, reservationId } = payload;
      logger.info(`[ReservationNotifier] Envoi notification client pour reservation.updated sur réservation ${reservationId}`);
      empireAudit.log({
        module: 'crm',
        action: 'RESERVATION_NOTIFIED',
        details: { reservationId, eventType: 'reservation.updated' },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'reservation-notifier-updated', priority: 'BACKGROUND' }
  );

  const unsubCancelled = NexusEventBus.on(
    'reservation.cancelled',
    async (payload) => {
      const { tenantId, reservationId } = payload;
      logger.info(`[ReservationNotifier] Envoi notification client pour reservation.cancelled sur réservation ${reservationId}`);
      empireAudit.log({
        module: 'crm',
        action: 'RESERVATION_NOTIFIED',
        details: { reservationId, eventType: 'reservation.cancelled' },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'reservation-notifier-cancelled', priority: 'BACKGROUND' }
  );

  return () => {
    unsubCreated();
    unsubUpdated();
    unsubCancelled();
  };
}
