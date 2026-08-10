import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerReconciliationEngineHandler() {
  const unsubCompleted = NexusEventBus.on(
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
    { id: 'reconciliation-engine-completed', priority: 'HIGH' }
  );

  const unsubSync = NexusEventBus.on(
    'finance.bank_transaction_synced',
    async (payload) => {
      const { tenantId, transactionId, amountInMicrounits, syncedAt: _syncedAt } = payload;
      logger.info(`[ReconciliationEngine] Bank transaction synced: ${transactionId} for ${amountInMicrounits}µ. Running heuristics...`);

      // 1. Chercher un journal entry non lettré avec montant exact
      let matchedEntityId: string | null = null;
      let matchedEntityType: 'ticket_z' | 'invoice' = 'ticket_z';

      // Pour les montants positifs (recettes), chercher dans les journalEntries
      if (amountInMicrounits > 0) {
        const unreconciledEntries = await Nexus.adapter.query<{
          id?: string;
          totalInMicrounits: number;
          status: string;
        }>(`tenants/${tenantId}/journalEntries`, {
          where: [
            { field: 'status', operator: '!=', value: 'reconciled' }
          ]
        });

        const exactMatch = unreconciledEntries.find(
          (entry) => entry.totalInMicrounits === amountInMicrounits
        );
        if (exactMatch) {
          matchedEntityId = exactMatch.id ?? null;
          matchedEntityType = 'ticket_z';
        }
      }

      // Pour les montants négatifs (décaissements), chercher dans les factures fournisseurs
      if (!matchedEntityId && amountInMicrounits < 0) {
        const supplierInvoices = await Nexus.adapter.query<{
          id?: string;
          totalInMicrounits: number;
          status: string;
        }>(`tenants/${tenantId}/supplierInvoices`, {
          where: [
            { field: 'status', operator: '!=', value: 'reconciled' }
          ]
        });

        const invoiceMatch = supplierInvoices.find(
          (inv) => inv.totalInMicrounits === Math.abs(amountInMicrounits)
        );
        if (invoiceMatch) {
          matchedEntityId = invoiceMatch.id ?? null;
          matchedEntityType = 'invoice';
        }
      }

      if (matchedEntityId) {
        logger.info(`[ReconciliationEngine] Exact match found for transaction ${transactionId} -> ${matchedEntityType} ${matchedEntityId}`);

        // Auto-emit le rapprochement
        NexusEventBus.emitDurable('finance.reconciliation_completed', {
          v: 1,
          tenantId,
          reconciliationId: `recon_${Date.now()}`,
          bankTransactionId: transactionId,
          matchedEntityId,
          matchedEntityType,
          reconciledBy: 'system_heuristic'
        });
      } else {
        logger.info(`[ReconciliationEngine] No exact match for ${transactionId}. Added to manual queue.`);
        
        // Notification pour le DAF
        NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
        id: `recon-manual-${transactionId}`,
          type: 'info',
          title: 'Transaction à lettrer',
          message: `Une nouvelle transaction bancaire de ${(amountInMicrounits / 1000000).toFixed(2)}€ nécessite un rapprochement manuel.`,
          priority: 'low',
          read: false,
          timestamp: new Date().toISOString()
        });
      }
    },
    { id: 'reconciliation-engine-synced', priority: 'BACKGROUND' }
  );

  return () => {
    unsubCompleted();
    unsubSync();
  };
}
