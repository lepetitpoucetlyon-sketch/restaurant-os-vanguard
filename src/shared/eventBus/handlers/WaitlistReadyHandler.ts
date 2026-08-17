import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * Écoute 'commerce.waitlist_ready'.
 * Envoie un SMS au client si guestPhone est renseigné,
 * et crée une notification interne pour le staff.
 */
export function registerWaitlistReadyHandler(): () => void {
  return NexusEventBus.on(
    'commerce.waitlist_ready',
    async (payload) => {
      const { tenantId, waitlistEntryId, guestName, guestPhone, partySize, estimatedWaitMinutes } = payload;

      logger.info(`[WaitlistReady] Table disponible → notification ${guestName} (${partySize}p)`);

      // Notification interne staff
      await Nexus.adapter.set(
        `tenants/${tenantId}/notifications/waitlist_${waitlistEntryId}_${Date.now()}`,
        {
          type: 'waitlist_ready',
          title: 'Table disponible — file d\'attente',
          message: `${guestName} (${partySize} pers.) est prêt à être placé.`,
          priority: 'high',
          read: false,
          waitlistEntryId,
          createdAt: new Date().toISOString(),
        }
      );

      // SMS via provider SMS (fire-and-forget si pas configuré)
      if (guestPhone) {
        const smsApiUrl = process.env.SMS_API_URL;
        const smsApiKey = process.env.SMS_API_KEY;

        if (smsApiUrl && smsApiKey) {
          const waitText = estimatedWaitMinutes
            ? ` Votre temps d'attente estimé est de ${estimatedWaitMinutes} minutes.`
            : '';

          fetch(smsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${smsApiKey}` },
            body: JSON.stringify({
              to: guestPhone,
              message: `Bonjour ${guestName}, votre table est prête !${waitText} Merci de vous présenter à l'accueil.`,
            }),
          }).catch(err => {
            logger.error('[WaitlistReady] Erreur envoi SMS', err);
          });
        } else {
          logger.info(`[WaitlistReady] SMS non configuré (SMS_API_URL/SMS_API_KEY absent) — notification interne créée uniquement`);
        }
      }
    },
    { id: 'waitlist-ready', priority: 'HIGH' }
  );
}
