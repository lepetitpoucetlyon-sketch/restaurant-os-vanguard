import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class BirthdayOfferHandler {
  static register() {
    return NexusEventBus.on('crm.birthday_approaching', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, customerId, birthdayAt, daysUntil } = payload;
      
      logger.info(`[BirthdayOffer] Anniversaire client ${customerId} dans ${daysUntil} jours. Envoi offre.`);

      try {
        const couponId = `bday_${customerId}_${new Date().getFullYear()}`;
        
        await Nexus.adapter.update(`tenants/${tenantId}/crm/coupons/${couponId}`, {
            customerId,
            type: 'birthday',
            discountBps: 1500, // 15% par défaut
            status: 'active',
            validUntil: new Date(new Date(birthdayAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: Date.now()
        });

        empireAudit.log({
            module: 'crm',
            action: 'CRM_BIRTHDAY_OFFER_SENT',
            userId: 'system',
            instanceId: tenantId,
            details: { customerId, birthdayAt, daysUntil, couponId },
            severity: 'low',
            timestamp: new Date(),
        });
        
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
        logger.error('[BirthdayOfferHandler] Error generating birthday offer', String(err));
      }
    }, { id: 'birthday-offer', priority: 'BACKGROUND' });
  }
}
