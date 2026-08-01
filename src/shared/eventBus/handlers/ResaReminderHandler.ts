import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { NotificationGateway } from '@/infrastructure/adapters/NotificationGateway';

/**
 * ResaReminderHandler (P05-B)
 * Écoute 'resa.j1' (ajouté dans NexusEventBus.ts — émis par un job planifié J-1).
 * Envoie un rappel email/SMS au client et persiste la notification.
 */
export function registerResaReminderHandler(): () => void {
  return NexusEventBus.on(
    'resa.j1',
    async (payload) => {
      const { tenantId, reservationId, customerId, date, covers, time } = payload;

      const reservation = await Nexus.adapter.get<{
        email?: string;
        customerEmail?: string;
        time?: string;
      }>(`tenants/${tenantId}/reservations/${reservationId}`);

      if (!reservation) {
        logger.warn(`[ResaReminder] Réservation ${reservationId} introuvable`);
        return;
      }

      const settings = await Nexus.adapter.get<{ name?: string }>(`tenants/${tenantId}/settings/general`);
      const restaurantName = settings?.name ?? 'Notre restaurant';

      const customerEmail = reservation.email ?? reservation.customerEmail ?? customerId;
      const reservationTime = time ?? reservation.time ?? '';

      await NotificationGateway.send({
        tenantId,
        to: customerEmail,
        subject: `Rappel réservation — ${restaurantName}`,
        text: `Votre table pour ${covers} couverts est confirmée pour demain à ${reservationTime}`,
      });

      await Nexus.adapter.set(
        `tenants/${tenantId}/notifications/NOTIF-RESA-J1-${reservationId}`,
        {
          id: `NOTIF-RESA-J1-${reservationId}`,
          reservationId,
          customerId,
          type: 'reminder',
          sentAt: new Date().toISOString(),
          channel: customerEmail.includes('@') ? 'email' : 'sms',
          date,
          covers,
        },
      );

      logger.info(`[ResaReminder] Rappel J-1 envoyé pour réservation ${reservationId} (${covers} couverts)`);

      empireAudit.log({
        module: 'crm',
        action: 'RESA_REMINDER_SENT',
        details: { reservationId, customerId, restaurantName, covers },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'resa-reminder-j1', priority: 'BACKGROUND' },
  );
}
