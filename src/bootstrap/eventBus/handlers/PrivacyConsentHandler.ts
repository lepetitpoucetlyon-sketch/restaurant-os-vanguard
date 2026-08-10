import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerPrivacyConsentHandler() {
  return NexusEventBus.on(
    'crm.customer_updated',
    async (payload) => {
      const { tenantId, customerId, updates } = payload;
      
      if (updates && updates.deleteRequested === true) {
        logger.warn(`[PrivacyConsent] Droit à l'oubli invoqué pour le client ${customerId}. Anonymisation en cours...`);
        
        // On écrase les PII par "ANONYMOUS_USER" mais on garde l'ID pour que le Ledger financier
        // ne perde pas la trace de la transaction (NF525 : pas de trou dans le CA).
        const customerPath = `tenants/${tenantId}/customers/${customerId}`;
        
        await Nexus.adapter.update(customerPath, {
          email: 'ANONYMOUS_USER',
          phone: 'ANONYMOUS_USER',
          name: 'ANONYMOUS_USER',
          deleteRequested: false, // reset
          anonymizedAt: Date.now()
        });

        empireAudit.log({
          module: 'crm',
          action: 'CUSTOMER_ANONYMIZED_GDPR',
          details: { customerId },
          severity: 'high', // Légal RGPD
          timestamp: new Date(),
        });
      }
    },
    { id: 'privacy-consent', priority: 'HIGH' }
  );
}
