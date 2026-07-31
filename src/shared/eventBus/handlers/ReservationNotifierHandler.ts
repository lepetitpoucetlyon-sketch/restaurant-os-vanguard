import { NexusEventBus, NexusEventPayload } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export function registerReservationNotifierHandler() {
  const sendNotification = async (tenantId: string, reservationId: string, eventType: string, payload: any) => {
    if (payload.isSimulation) return;
    try {
      // Mock d'un appel à un prestataire SMS/Email (Twilio/SendGrid)
      // [TEMPORARY MOCK] Simulation d'un appel à l'API SendGrid/Twilio pour notifier le client.
      // A remplacer par l'URL réelle de notre service de notification en production.
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          body: JSON.stringify({
              to: payload.customerId,
              subject: 'Confirmation de Réservation',
              text: `Votre réservation ${reservationId} est bien confirmée.`
          }),
          headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('API SMS/Email en erreur');

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
