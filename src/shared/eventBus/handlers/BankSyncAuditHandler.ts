import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerBankSyncAuditHandler() {
  return NexusEventBus.on(
    'finance.bank_transaction_synced',
    async (payload) => {
      const { tenantId, transactionId, bankAccountId, amountInMicrounits, syncedAt } = payload;
      
      logger.info(`[BankSyncAudit] Transaction bancaire ${transactionId} synchronisée (${amountInMicrounits / 1000000} EUR).`);

      // P10-H: Idempotence (dedup) — Ne pas écraser si la transaction existe déjà.
      // Cela évite de réécraser le statut 'reconciled' si on relance une synchro sur la même période.
      const existingTx = await Nexus.adapter.get(`tenants/${tenantId}/bankTransactions/${transactionId}`);
      if (existingTx) {
        logger.info(`[BankSyncAudit] Transaction bancaire ${transactionId} ignorée (déjà existante).`);
        return;
      }

      // Écriture de la transaction dans la base en attente de lettrage.
      // Cela répare le "Blind Spot" de la Phase 1 en imposant le passage par le bus événementiel.
      await Nexus.adapter.set(`tenants/${tenantId}/bankTransactions/${transactionId}`, {
        id: transactionId,
        bankAccountId,
        amountInMicrounits,
        status: 'unreconciled',
        syncedAt
      });

      empireAudit.log({
        module: 'finance',
        action: 'BANK_TRANSACTION_SYNCED_AUDITED',
        details: { transactionId, bankAccountId, amountInMicrounits },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'bank-sync-audit', priority: 'HIGH' }
  );
}
