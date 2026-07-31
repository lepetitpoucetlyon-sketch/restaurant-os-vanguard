import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class BirthdayOfferHandler {
  static register() {
    return NexusEventBus.on('crm.birthday_approaching', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, customerId, birthdayAt, daysUntil } = payload;
      
      logger.info(`[BirthdayOffer] Anniversaire client ${customerId} dans ${daysUntil} jours. Envoi offre.`);

      empireAudit.log({
        module: 'crm',
        action: 'CRM_BIRTHDAY_OFFER_SENT',
        userId: 'system',
        instanceId: tenantId,
        details: { customerId, birthdayAt, daysUntil },
        severity: 'low',
        timestamp: new Date(),
      });
      
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-birthday-${customerId}`,
        type: 'info',
        title: 'Offre Anniversaire Envoyée',
        message: `Une offre a été envoyée au client ${customerId} pour son anniversaire dans ${daysUntil} jours.`,
        priority: 'low',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
