import { NexusEventBus, NexusEventPayload } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { toError } from "@/lib/toError";

interface NotificationPayload {
  isSimulation?: boolean;
  customerId?: string;
  customerName?: string;
  date?: string;
  time?: string;
  covers?: number;
  partySize?: number;
}

export function registerReservationNotifierHandler() {
  const sendNotification = async (tenantId: string, reservationId: string, eventType: string, payload: NotificationPayload) => {
    if (payload.isSimulation) return;
    try {
      // Récupérer le nom du restaurant depuis la config tenant
      const tenantSettings = await Nexus.adapter.get<{ name?: string }>(`tenants/${tenantId}/settings/general`);
      const restaurantName = tenantSettings?.name || 'Notre restaurant';

      const customerName = payload.customerName || 'Client';
      const date = payload.date || '';
      const time = payload.time || '';
      const covers = payload.covers || payload.partySize || '';

      let subject: string;
      let text: string;

      switch (eventType) {
        case 'reservation.confirmed':
          subject = `${restaurantName} — Confirmation de votre réservation`;
          text = [
            `Bonjour ${customerName},`,
            ``,
            `Votre réservation au ${restaurantName} est confirmée :`,
            `  - Date : ${date}`,
            `  - Heure : ${time}`,
            `  - Couverts : ${covers}`,
            `  - Référence : ${reservationId}`,
            ``,
            `Nous avons hâte de vous accueillir. En cas d'empêchement, merci d'annuler au plus tôt.`,
            ``,
            `À bientôt,`,
            `L'équipe ${restaurantName}`
          ].join('\n');
          break;

        case 'reservation.cancelled':
          subject = `${restaurantName} — Annulation de votre réservation`;
          text = [
            `Bonjour ${customerName},`,
            ``,
            `Votre réservation du ${date} à ${time} (${covers} couverts, réf. ${reservationId}) a été annulée.`,
            ``,
            `N'hésitez pas à réserver à nouveau sur notre site.`,
            ``,
            `L'équipe ${restaurantName}`
          ].join('\n');
          break;

        case 'reservation.created':
          subject = `${restaurantName} — Demande de réservation reçue`;
          text = [
            `Bonjour ${customerName},`,
            ``,
            `Nous avons bien reçu votre demande de réservation :`,
            `  - Date : ${date}`,
            `  - Heure : ${time}`,
            `  - Couverts : ${covers}`,
            `  - Référence : ${reservationId}`,
            ``,
            `Vous recevrez une confirmation dès validation par notre équipe.`,
            ``,
            `L'équipe ${restaurantName}`
          ].join('\n');
          break;

        default:
          subject = `${restaurantName} — Mise à jour de votre réservation`;
          text = [
            `Bonjour ${customerName},`,
            ``,
            `Votre réservation du ${date} à ${time} (${covers} couverts, réf. ${reservationId}) a été mise à jour.`,
            `Nouveau statut : ${eventType.replace('reservation.', '')}.`,
            ``,
            `L'équipe ${restaurantName}`
          ].join('\n');
          break;
      }

      await NotificationGateway.send({
          tenantId,
          to: payload.customerId || 'unknown_customer',
          subject,
          text
      });

      // Enregistrement en base de l'envoi de la notification pour traçabilité
      await Nexus.adapter.update(`tenants/${tenantId}/crm/reservations/${reservationId}`, {
          lastNotificationSent: eventType,
          lastNotificationAt: Date.now()
      });
    } catch (err) {
      logger.error(`[ReservationNotifier] Erreur envoi notif pour ${reservationId}`, toError(err).message);
      throw err;
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
