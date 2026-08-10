import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerSegmentTargetingHandler() {
  return NexusEventBus.on(
    'crm.segment_matched',
    async (payload) => {
      const { tenantId: _tenantId, customerId, segmentId, segmentName } = payload;
      
      logger.info(`[CRM] Le client ${customerId} entre dans le segment '${segmentName}' (${segmentId})`);
      
      // Ici, on pourrait déclencher l'ajout du client à une liste de diffusion spécifique (Mailchimp, etc.)
      
      empireAudit.log({
        module: 'crm',
        action: 'CUSTOMER_SEGMENT_MATCHED',
        details: { customerId, segmentId, segmentName },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'segment-targeting-handler', priority: 'BACKGROUND' }
  );
}
