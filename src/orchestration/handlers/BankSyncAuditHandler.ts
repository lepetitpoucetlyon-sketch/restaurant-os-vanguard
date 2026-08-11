import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
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

      // P10-H fallback: Dedup par montant + date si pas de match par transactionId.
      // Certaines banques changent l'ID de transaction entre deux synchros.
      // On cherche une transaction avec le même montant dans une fenêtre de 24h.
      const ONE_DAY_MS = 86_400_000;
      const syncedAtMs = typeof syncedAt === 'string' ? new Date(syncedAt).getTime() : syncedAt;
      const dayStart = syncedAtMs - ONE_DAY_MS;
      const dayEnd = syncedAtMs + ONE_DAY_MS;

      const candidateDups = await Nexus.adapter.query<{
        id: string;
        amountInMicrounits: number;
        syncedAt: number | string;
        bankAccountId: string;
      }>(`tenants/${tenantId}/bankTransactions`, {
        where: [
          { field: 'bankAccountId', operator: '==', value: bankAccountId },
          { field: 'amountInMicrounits', operator: '==', value: amountInMicrounits },
        ]
      });

      const amountDateDup = candidateDups.find(tx => {
        const txTime = typeof tx.syncedAt === 'string' ? new Date(tx.syncedAt).getTime() : tx.syncedAt;
        return txTime >= dayStart && txTime <= dayEnd;
      });

      if (amountDateDup) {
        logger.warn(
          `[BankSyncAudit] Doublon potentiel détecté par montant+date : ` +
          `nouvelle=${transactionId}, existante=${amountDateDup.id}, montant=${amountInMicrounits / 1_000_000} EUR`
        );
      }

      // Écriture de la transaction dans la base en attente de lettrage.
      // Cela répare le "Blind Spot" de la Phase 1 en imposant le passage par le bus événementiel.
      await Nexus.adapter.set(`tenants/${tenantId}/bankTransactions/${transactionId}`, {
        id: transactionId,
        bankAccountId,
        amountInMicrounits,
        status: amountDateDup ? 'potential_duplicate' : 'unreconciled',
        duplicateOf: amountDateDup?.id ?? null,
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
