import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

interface CustomerRecord {
  visitCount?: number;
  segment?: string;
  lastVisitAt?: number;
  updatedAt?: number;
}

export function registerCustomerRFMAnalyzerHandler() {
  return NexusEventBus.on(
    'crm.points_earned',
    async (payload) => {
      const { tenantId, customerId, points } = payload;
      
      const customerPath = `tenants/${tenantId}/customers/${customerId}`;
      
      await Nexus.adapter.runTransaction(async (tx) => {
        const customer = await Nexus.adapter.get<CustomerRecord>(customerPath);
        if (!customer) return;

        // Recalcul du RFM simplifié (Récence, Fréquence, Montant)
        const now = Date.now();
        const frequency = (customer.visitCount || 0) + 1;
        
        let segment = 'new';
        if (frequency > 10) segment = 'vip';
        else if (frequency > 3) segment = 'regular';

        await Nexus.adapter.update(customerPath, {
          lastVisitAt: now,
          visitCount: frequency,
          segment,
          updatedAt: now
        });

        logger.info(`[CustomerRFM] Client ${customerId} mis à jour. Segment actuel: ${segment}.`);
      });

      empireAudit.log({
        module: 'crm',
        action: 'CUSTOMER_RFM_UPDATED',
        details: { customerId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'customer-rfm-analyzer', priority: 'BACKGROUND' }
  );
}
