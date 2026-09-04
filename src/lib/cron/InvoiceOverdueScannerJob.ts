import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * InvoiceOverdueScannerJob (audit P2 — event pairing, invoice.overdue)
 *
 * `OverdueInvoiceHandler` écoute `invoice.overdue` (relance J+30, J+60,
 * contentieux) mais aucun émetteur n'existait → l'escalade était morte.
 *
 * Ce job scanne quotidiennement `tenants/{id}/invoices` par-dessus Nexus
 * (provider-agnostique, PAS de couplage au module finance qui est en travaux),
 * détecte les factures dont `dueDate` est passée et `status ∈ {pending, sent}`
 * (non payées, non annulées), et émet `invoice.overdue` — le handler prend
 * ensuite le relais pour l'email + tag + WebPush manager.
 *
 * Idempotence : le handler est marqué mutation dans `mutationEvents.ts` (dedup
 * par `invoiceId`), donc un re-jeu quotidien n'accumule ni email ni tag.
 */
export const InvoiceOverdueScannerJob = {
  name: 'InvoiceOverdueScannerJob',
  // Chaque jour à 08:00 (heure du serveur) — cadence classique de relance.
  schedule: '0 8 * * *',
  async runForTenant(tenantId: string): Promise<void> {
    try {
      const invoices = await Nexus.adapter.query<{
        id?: string;
        invoiceId?: string;
        customerId?: string;
        status?: string;
        dueDate?: string | number;
        amountInMicrounits?: number;
        amountInCents?: number;
      }>(`tenants/${tenantId}/invoices`);

      const now = Date.now();
      let emitted = 0;
      for (const inv of invoices ?? []) {
        const status = inv.status ?? '';
        if (status !== 'pending' && status !== 'sent') continue;
        const due = typeof inv.dueDate === 'number'
          ? inv.dueDate
          : (inv.dueDate ? new Date(inv.dueDate).getTime() : NaN);
        if (!Number.isFinite(due) || due >= now) continue;

        const dueDaysOverdue = Math.floor((now - due) / 86_400_000);
        if (dueDaysOverdue <= 0) continue;

        const invoiceId = inv.id ?? inv.invoiceId ?? '';
        const customerId = inv.customerId ?? '';
        if (!invoiceId || !customerId) continue;

        // Compat : conversion cents → microunits si legacy.
        const amountInMicrounits =
          typeof inv.amountInMicrounits === 'number'
            ? inv.amountInMicrounits
            : typeof inv.amountInCents === 'number'
            ? inv.amountInCents * 10_000
            : 0;

        await NexusEventBus.emit('invoice.overdue', {
          v: 1,
          tenantId,
          invoiceId,
          customerId,
          amountInMicrounits,
          dueDaysOverdue,
        });
        emitted++;
      }

      if (emitted > 0) {
        logger.info(`[InvoiceOverdueScanner] ${tenantId} → ${emitted} facture(s) en retard signalée(s).`);
      }
    } catch (err) {
      logger.error(`[InvoiceOverdueScanner] ${tenantId} — scan échoué`, toError(err).message);
    }
  },
};
