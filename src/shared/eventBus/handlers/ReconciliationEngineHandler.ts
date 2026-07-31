import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerReconciliationEngineHandler() {
  return NexusEventBus.on(
    'finance.reconciliation_completed',
    async (payload) => {
      const { tenantId, reconciliationId, bankTransactionId, matchedEntityId, matchedEntityType, reconciledBy } = payload;
      
      logger.info(`[ReconciliationEngine] Lettrage validé par ${reconciledBy}. Transaction ${bankTransactionId} matchée avec ${matchedEntityType} ${matchedEntityId}.`);

      // Scellement du lettrage
      // La transaction passe à 'reconciled'
      await Nexus.adapter.update(`tenants/${tenantId}/bankTransactions/${bankTransactionId}`, {
        status: 'reconciled',
        reconciliationId,
        reconciledAt: Date.now()
      });

      // L'entité cible (Ticket Z ou Invoice) passe aussi à 'reconciled'
      let targetPath = '';
      if (matchedEntityType === 'invoice') targetPath = `tenants/${tenantId}/fiscalLedger/ap_entry_${matchedEntityId}`;
      else if (matchedEntityType === 'ticket_z') targetPath = `tenants/${tenantId}/fiscalLedger/ticket_z_${matchedEntityId}`;
      
      if (targetPath) {
        await Nexus.adapter.update(targetPath, {
          status: 'reconciled',
          reconciliationId
        });
      }

      empireAudit.log({
        module: 'finance',
        action: 'RECONCILIATION_SEALED',
        details: { reconciliationId, bankTransactionId, matchedEntityId, matchedEntityType },
        severity: 'high', // Impact comptable NF525 majeur
        timestamp: new Date(),
      });
    },
    { id: 'reconciliation-engine', priority: 'HIGH' }
  );
}
