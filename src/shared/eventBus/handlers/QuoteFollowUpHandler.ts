import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/**
 * QuoteFollowUpHandler (P07-H)
 * Écoute quote.sent et :
 * 1. Crée une tâche de relance à J+7
 * 2. Crée une notification planifiée
 */
export function registerQuoteFollowUpHandler(): () => void {
  return NexusEventBus.on(
    'quote.sent',
    async (payload) => {
      const { tenantId, quoteId, customerId, totalInMicrounits, sentAt } = payload;

      const now = new Date().toISOString();
      const followUpDate = new Date(new Date(sentAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Lire le devis pour enrichissement éventuel
      const quote = await Nexus.adapter.get<Record<string, unknown>>(
        `tenants/${tenantId}/quotes/${quoteId}`
      );

      if (!quote) {
        logger.warn(`[QuoteFollowUp] Devis ${quoteId} introuvable dans Nexus — relance planifiée avec les données du payload`);
      }

      // 1. Tâche de relance
      await Nexus.adapter.set(`tenants/${tenantId}/tasks/FOLLOWUP-${quoteId}`, {
        type: 'quote_followup',
        quoteId,
        customerId,
        totalInMicrounits,
        followUpDate,
        status: 'scheduled',
        createdAt: now,
      });

      logger.info(`[QuoteFollowUp] Relance planifiée pour devis ${quoteId} le ${followUpDate}`);

      // 2. Notification planifiée
      await Nexus.adapter.set(`tenants/${tenantId}/notifications/NOTIF-QF-${quoteId}`, {
        message: `Relancer devis ${quoteId} — sans réponse depuis 7j`,
        scheduledFor: followUpDate,
        priority: 'medium',
      });

      // 3. Audit
      empireAudit.log({
        module: 'finance',
        action: 'QUOTE_FOLLOWUP_SCHEDULED',
        details: { quoteId, customerId, totalInMicrounits, followUpDate },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'quote-followup', priority: 'BACKGROUND' }
  );
}
