import { NexusEventBus, NexusEventPayload } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NotificationGateway } from '@/infrastructure/adapters/NotificationGateway';

export function registerReservationNotifierHandler() {
  const sendNotification = async (tenantId: string, reservationId: string, eventType: string, payload: any) => {
    if (payload.isSimulation) return;
    try {
      await NotificationGateway.send({
          tenantId,
          to: payload.customerId || 'unknown_customer',
          subject: 'Mise à jour de votre réservation',
          text: `Votre réservation ${reservationId} est passée au statut : ${eventType}.`
      });

      // Enregistrement en base de l'envoi de la notification pour traçabilité
      await Nexus.adapter.update(`tenants/${tenantId}/crm/reservations/${reservationId}`, {
          lastNotificationSent: eventType,
          lastNotificationAt: Date.now()
      });
    } catch (err) {
      logger.error(`[ReservationNotifier] Erreur envoi notif pour ${reservationId}`, String(err));
    }
  };

  const unsubCreated = NexusEventBus.on('reservation.created', async (payload) => {
    const { tenantId, reservationId } = payload;
    logger.info(`[ReservationNotifier] Envoi notification client pour reservation.created sur réservation ${reservationId}`);
    await sendNotification(tenantId, reservationId, 'reservation.created', payload);
    empireAudit.log({
      module: 'crm',
      action: 'RESERVATION_NOTIFIED',
      details: { reservationId, eventType: 'reservation.created' },
      severity: 'low',
      timestamp: new Date(),
    });
  }, { id: 'reservation-notifier-created', priority: 'BACKGROUND' });

  const unsubUpdated = NexusEventBus.on('reservation.updated', async (payload) => {
    const { tenantId, reservationId } = payload;
    logger.info(`[ReservationNotifier] Envoi notification client pour reservation.updated sur réservation ${reservationId}`);
    await sendNotification(tenantId, reservationId, 'reservation.updated', payload);
    empireAudit.log({
      module: 'crm',
      action: 'RESERVATION_NOTIFIED',
      details: { reservationId, eventType: 'reservation.updated' },
      severity: 'low',
      timestamp: new Date(),
    });
  }, { id: 'reservation-notifier-updated', priority: 'BACKGROUND' });

  const unsubCancelled = NexusEventBus.on('reservation.cancelled', async (payload) => {
    const { tenantId, reservationId } = payload;
    logger.info(`[ReservationNotifier] Envoi notification client pour reservation.cancelled sur réservation ${reservationId}`);
    await sendNotification(tenantId, reservationId, 'reservation.cancelled', payload);
    empireAudit.log({
      module: 'crm',
      action: 'RESERVATION_NOTIFIED',
      details: { reservationId, eventType: 'reservation.cancelled' },
      severity: 'low',
      timestamp: new Date(),
    });
  }, { id: 'reservation-notifier-cancelled', priority: 'BACKGROUND' });

  const unsubConfirmed = NexusEventBus.on('reservation.confirmed', async (payload: NexusEventPayload<'reservation.confirmed'>) => {
    const { tenantId, reservationId } = payload;
    logger.info(`[ReservationNotifier] Envoi notification client pour reservation.confirmed sur réservation ${reservationId}`);
    await sendNotification(tenantId, reservationId, 'reservation.confirmed', payload);
    empireAudit.log({
      module: 'crm',
      action: 'RESERVATION_NOTIFIED',
      details: { reservationId, eventType: 'reservation.confirmed' },
      severity: 'low',
      timestamp: new Date(),
    });
  }, { id: 'reservation-notifier-confirmed', priority: 'BACKGROUND' });

  return () => {
    unsubCreated();
    unsubUpdated();
    unsubCancelled();
    unsubConfirmed();
  };
}
