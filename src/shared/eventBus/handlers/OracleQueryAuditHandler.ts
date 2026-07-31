import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class OracleQueryAuditHandler {
  static register() {
    return NexusEventBus.on('ai.query_received', async (payload) => {
      if (payload.isSimulation) return; // P08-K

      const { tenantId, userId, query, contextScope } = payload;
      
      logger.info(`[OracleQueryAudit] AI Query par ${userId} (Scope: ${contextScope})`);

      empireAudit.log({
        module: 'system',
        action: 'AI_QUERY_EXECUTED',
        userId,
        instanceId: tenantId,
        details: { query, contextScope },
        severity: 'low',
        timestamp: new Date(),
      });
    });
  }
}
