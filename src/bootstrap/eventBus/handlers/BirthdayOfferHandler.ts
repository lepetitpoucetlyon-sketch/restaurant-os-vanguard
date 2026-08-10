import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { toError } from "@/lib/toError";

export class BirthdayOfferHandler {
  static register() {
    return NexusEventBus.on('crm.birthday_approaching', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, customerId, birthdayAt, daysUntil } = payload;

      logger.info(`[BirthdayOffer] Anniversaire client ${customerId} dans ${daysUntil} jours. Envoi offre.`);

      try {
        const couponId = `bday_${customerId}_${new Date().getFullYear()}`;
        const discountPercent = 15;
        const validUntil = new Date(new Date(birthdayAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

        await Nexus.adapter.update(`tenants/${tenantId}/crm/coupons/${couponId}`, {
            customerId,
            type: 'birthday',
            discountBps: discountPercent * 100,
            status: 'active',
            validUntil,
            createdAt: Date.now()
        });

        // Récupérer les données client pour l'envoi email
        const customer = await Nexus.adapter.get<{ email?: string; firstName?: string; lastName?: string }>(
          `tenants/${tenantId}/customers/${customerId}`
        );

        if (customer?.email) {
          const tenantSettings = await Nexus.adapter.get<{ name?: string }>(`tenants/${tenantId}/settings/general`);
          const restaurantName = tenantSettings?.name || 'Notre restaurant';
          const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Client';
          const validUntilFormatted = new Date(validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

          await NotificationGateway.send({
            tenantId,
            to: customer.email,
            subject: `${restaurantName} — Joyeux anniversaire ${customer.firstName || ''} !`,
            text: [
              `Bonjour ${customerName},`,
              ``,
              `Toute l'équipe de ${restaurantName} vous souhaite un très bon anniversaire !`,
              ``,
              `Pour l'occasion, nous vous offrons ${discountPercent}% de réduction sur votre prochaine visite.`,
              ``,
              `Votre code promo : ${couponId}`,
              `Valable jusqu'au : ${validUntilFormatted}`,
              ``,
              `Au plaisir de vous revoir,`,
              `L'équipe ${restaurantName}`
            ].join('\n')
          });

          logger.info(`[BirthdayOffer] Email anniversaire envoyé à ${customer.email} pour client ${customerId}`);
        } else {
          logger.warn(`[BirthdayOffer] Pas d'email pour le client ${customerId}, notification email ignorée`);
        }

        empireAudit.log({
            module: 'crm',
            action: 'CRM_BIRTHDAY_OFFER_SENT',
            userId: 'system',
            instanceId: tenantId,
            details: { customerId, birthdayAt, daysUntil, couponId, emailSent: !!customer?.email },
            severity: 'low',
            timestamp: new Date(),
        });

        // Notification interne pour le staff (conservée)
        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-birthday-${customerId}`,
            type: 'info',
            title: 'Offre Anniversaire Envoyée',
            message: `Une offre a été envoyée au client ${customerId} pour son anniversaire dans ${daysUntil} jours. (Coupon: ${couponId})`,
            priority: 'low',
            read: false,
            timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('[BirthdayOfferHandler] Error generating birthday offer', toError(err).message);
        throw err;
      }
    }, { id: 'birthday-offer', priority: 'BACKGROUND' });
  }
}
