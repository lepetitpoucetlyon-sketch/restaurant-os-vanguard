import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { SharedKernel } from '@/lib/shared-kernel';
import type { JournalLine } from '@nexus/contracts';

const PCG_REFUND_ACCOUNTS: Record<string, { code: string; name: string }> = {
  card:    { code: '411100', name: 'Clients CB — Remboursement' },
  cash:    { code: '411200', name: 'Clients Espèces — Remboursement' },
  ticket:  { code: '411300', name: 'Clients Ticket — Remboursement' },
  default: { code: '411000', name: 'Clients — Remboursement' },
};

import { withRoleGuard } from '../middleware/withRoleGuard';

/**
 * RefundJournalHandler (P01-H)
 * Écoute order.refunded et génère une écriture extourne miroir NF525 :
 * - Débit 70xxxx (Ventes) = annule le produit
 * - Crédit 411xxx (Clients) = remboursement au client
 *
 * L'extourne est immuable (jamais delete/update) — conforme NF525.
 */
export function registerRefundJournalHandler(): () => void {
  return NexusEventBus.on(
    'order.refunded',
    withRoleGuard('admin', async (payload) => {
      const { tenantId, orderId, operatorId, amountInMicrounits, originalPaymentMode } = payload;

      const entryId = SharedKernel.generateId('JE-REFUND');
      const now = new Date().toISOString();
      const amountInCents = Math.round(amountInMicrounits / 10_000);

      const payAcct = PCG_REFUND_ACCOUNTS[originalPaymentMode] ?? PCG_REFUND_ACCOUNTS.default;

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
        amountInMicrounits,
        date: now,
        pieceNumber: entryId,
      } as JournalLine);

      // Écriture extourne : inversion des sens comptables
      const lines: JournalLine[] = [
        // Débit 707 Ventes → annule le produit du CA
        makeLine('707000', 'Ventes de marchandises — Extourne', 'debit', `Remboursement cmde ${orderId}`),
        // Crédit 411 Client → remboursement au client
        makeLine(payAcct.code, payAcct.name, 'credit', `Remboursement ${originalPaymentMode} cmde ${orderId}`),
      ];

      const entry = {
        id: entryId,
        type: 'sales' as const,
        orderId,
        operatorId,
        date: now,
        totalInMicrounits: amountInMicrounits,
        lines,
        status: 'refunded' as const,
        createdAt: now,
      };

      // Immuable NF525 — set, jamais update
      await Nexus.adapter.set(
        `tenants/${tenantId}/journalEntries/${entryId}`,
        entry,
      );

      logger.info(`[RefundJournal] Extourne ${entryId} générée pour cmde ${orderId} (${amountInMicrounits}µ via ${originalPaymentMode})`);

      empireAudit.log({
        module: 'fiscal',
        action: 'REFUND_EXTOURNE_CREATED',
        details: { entryId, orderId, operatorId, amountInMicrounits, originalPaymentMode },
        severity: 'medium',
        timestamp: new Date(),
      });
    }),
    { id: 'refund-journal', priority: 'HIGH' },
  );
}
