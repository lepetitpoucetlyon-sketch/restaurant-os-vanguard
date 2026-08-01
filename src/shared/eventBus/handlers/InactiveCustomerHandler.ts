import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { NotificationGateway } from '@/infrastructure/adapters/NotificationGateway';
import { logger } from '@/lib/logger';

/**
 * InactiveCustomerHandler (P06-E)
 * Écoute inactive.90d et :
 * 1. Crée une campagne de réactivation
 * 2. Envoie un email au client
 * 3. Pose un tag 'reactivation_campaign_sent' sur le client
 */
export function registerInactiveCustomerHandler(): () => void {
  return NexusEventBus.on(
    'inactive.90d',
    async (payload) => {
      const { tenantId, customerId, lastVisitDate, totalSpentInMicrounits } = payload;

      const customer = await Nexus.adapter.get<{
        email?: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        tags?: string[];
      }>(`tenants/${tenantId}/customers/${customerId}`);

      const customerName =
        customer
          ? (customer.name ?? [customer.firstName, customer.lastName].filter(Boolean).join(' ')) || customerId
          : customerId;

      const now = new Date();
      const campaignId = `REACT-${customerId}-${now.getTime()}`;
      const scheduledFor = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      // 1. Créer la campagne de réactivation
      await Nexus.adapter.set(`tenants/${tenantId}/marketing/campaigns/${campaignId}`, {
        type: 'reactivation',
        customerId,
        customerName,
        lastVisitDate,
        totalSpentInMicrounits,
        status: 'scheduled',
        scheduledFor,
        createdAt: now.toISOString(),
      });

      logger.info(`[InactiveCustomer] Campagne ${campaignId} planifiée pour client ${customerId}`);

      // 2. Email de réactivation
      if (customer?.email) {
        await NotificationGateway.send({
          tenantId,
          to: customer.email,
          subject: 'Vous nous manquez !',
          text: `${customerName}, cela fait 90 jours... Voici une offre exclusive.`,
          channel: 'email',
        });
        logger.info(`[InactiveCustomer] Email réactivation envoyé à ${customer.email}`);
      } else {
        logger.warn(`[InactiveCustomer] Pas d'email pour le client ${customerId}, notification ignorée`);
      }

      // 3. Tag client
      const existingTags: string[] = customer?.tags ?? [];
      if (!existingTags.includes('reactivation_campaign_sent')) {
        await Nexus.adapter.update(`tenants/${tenantId}/customers/${customerId}`, {
          tags: [...existingTags, 'reactivation_campaign_sent'],
        });
      }

      // 4. Audit
      empireAudit.log({
        module: 'crm',
        action: 'REACTIVATION_CAMPAIGN_SENT',
        details: { campaignId, customerId, customerName, lastVisitDate, scheduledFor },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'inactive-customer', priority: 'BACKGROUND' }
  );
}
