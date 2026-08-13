import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { JournalLine } from '@nexus/contracts';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

/**
 * CompJournalHandler (P01-G)
 * Écoute order.comp et génère une écriture journal NF525 doublement équilibrée :
 * - Débit 658000 "Charges exceptionnelles — Offerts"
 * - Crédit 707000 "Ventes — Offerts"
 *
 * L'écriture est immuable (jamais delete/update) — conforme NF525.
 */
export function registerCompJournalHandler(): () => void {
  return NexusEventBus.on(
    'order.comp',
    async (payload) => {
      const { tenantId, orderId, operatorId, items, totalValueInMicrounits, reason } = payload;

      const entryId = `JE-COMP-${orderId}`;
      const now = new Date().toISOString();
      const amountInCents = Math.round(totalValueInMicrounits / 10_000);

      const makeLine = (
        accountCode: string,
        accountName: string,
        side: 'debit' | 'credit',
        description: string,
      ): JournalLine => ({
        accountId: accountCode,
        accountCode,
        accountName,
        description,
        side,
        amountInCents,
        amountInMicrounits: totalValueInMicrounits,
        date: now,
        pieceNumber: entryId,
        debitInCents: side === 'debit' ? amountInCents : 0,
        debitInMicrounits: side === 'debit' ? totalValueInMicrounits : 0,
        creditInCents: side === 'credit' ? amountInCents : 0,
        creditInMicrounits: side === 'credit' ? totalValueInMicrounits : 0,
        runningBalanceInCents: 0,
        runningBalanceInMicrounits: 0,
      } as JournalLine);

      const lines: JournalLine[] = [
        makeLine('658000', 'Charges exceptionnelles — Offerts', 'debit', `Offert cmde ${orderId} : ${reason}`),
        makeLine('707000', 'Ventes — Offerts', 'credit', `Contrepartie offert cmde ${orderId}`),
      ];

      const entry = {
        id: entryId,
        pieceNumber: entryId,
        description: `Comp (offert) commande ${orderId} — ${reason}`,
        type: 'sales' as const,
        orderId,
        operatorId,
        date: now,
        totalInMicrounits: totalValueInMicrounits,
        amountInCents,
        amountInMicrounits: totalValueInMicrounits,
        lines,
        status: 'validated' as const,
        isSystemGenerated: true,
        isValidated: true,
        createdAt: now,
        updatedAt: now,
      };

      // Immuable NF525 — set, jamais update
      const journalPath = `tenants/${tenantId}/journalEntries/${entryId}`;
      assertHandlerTenant('comp-journal', tenantId, journalPath);
      await Nexus.adapter.set(journalPath, entry);

      const compLogPath = `tenants/${tenantId}/compLog/COMP-${orderId}`;
      assertHandlerTenant('comp-journal', tenantId, compLogPath);
      await Nexus.adapter.set(compLogPath, {
        orderId,
        operatorId,
        reason,
        totalValueInMicrounits,
        items,
        createdAt: now,
      });

      logger.info(`[CompJournal] Écriture ${entryId} créée pour cmde ${orderId} (${totalValueInMicrounits}µ)`);

      empireAudit.log({
        module: 'fiscal',
        action: 'COMP_JOURNAL_CREATED',
        details: { entryId, orderId, operatorId, totalValueInMicrounits, reason },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'comp-journal', priority: 'HIGH' },
  );
}
