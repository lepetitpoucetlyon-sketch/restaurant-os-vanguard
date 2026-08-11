import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export class OracleQueryAuditHandler {
  static register() {
    return NexusEventBus.on('ai.query_received', async (payload) => {
      if (payload.isSimulation) return; // P08-K

      const { tenantId, userId, query, contextScope } = payload;
      
      logger.info(`[OracleQueryAudit] AI Query par ${userId} (Scope: ${contextScope})`);

      try {
        const queryId = `query_${Date.now()}`;
        await Nexus.adapter.update(`tenants/${tenantId}/ai/queries/${queryId}`, {
            userId,
            query,
            contextScope,
            timestamp: Date.now()
        });

        empireAudit.log({
            module: 'system',
            action: 'AI_QUERY_EXECUTED',
            userId,
            instanceId: tenantId,
            details: { queryId, query, contextScope },
            severity: 'low',
            timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[OracleQueryAuditHandler] Error auditing AI query', toError(err).message);
        throw err;
      }
    }, { id: 'oracle-query-audit', priority: 'BACKGROUND' });
  }
}
