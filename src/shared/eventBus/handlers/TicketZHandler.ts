import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';
import type { SovereignData } from '@shared/nexus-contract';

type TicketZDoc = {
  id: string;
  date: string;
  tenantId: string;
  ordersCount: number;
  totalInMicrounits: number;
  taxBreakdown: Record<string, number>;
  updatedAt: string;
  closed?: boolean;
  closedAt?: string;
};

/**
 * Met à jour l'agrégat Ticket Z en temps réel à chaque paiement.
 * Utilise runTransaction pour éviter les race conditions (double-comptage).
 * BACKGROUND : non-bloquant, le serveur n'attend pas.
 */
export function registerTicketZHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async ({ tenantId, totalInMicrounits, items }) => {
      const today = new Date().toISOString().split('T')[0];
      const path = `tenants/${tenantId}/ticketZ/${today}`;

      await Nexus.adapter.runTransaction(async (tx) => {
        const existing = (await tx.get<TicketZDoc>(path)) ?? {
          id: today,
          date: today,
          tenantId,
          ordersCount: 0,
          totalInMicrounits: 0,
          taxBreakdown: {},
          updatedAt: new Date().toISOString(),
        };

        // Ne pas accumuler si déjà clôturé (protection post-clôture Z)
        if (existing.closed) return;

        const taxBreakdown = { ...existing.taxBreakdown };
        for (const item of items) {
          const rate = item.taxRate ?? '0.10';
          const lineTotal = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
          const tva = Math.round(lineTotal * parseFloat(rate));
          taxBreakdown[rate] = (taxBreakdown[rate] ?? 0) + tva;
        }

        const updated: TicketZDoc = {
          ...existing,
          ordersCount: existing.ordersCount + 1,
          totalInMicrounits: existing.totalInMicrounits + totalInMicrounits,
          taxBreakdown,
          updatedAt: new Date().toISOString(),
        };

        tx.set(path, updated as unknown as SovereignData);

        logger.info(
          `[TicketZ] Jour ${today} — total ${(updated.totalInMicrounits / 1_000_000).toFixed(2)}€ (${updated.ordersCount} tickets)`
        );
      });
    },
    { id: 'ticketz-update', priority: 'BACKGROUND' }
  );
}

/**
 * Clôture définitive du Ticket Z d'une journée :
 *  1. Scelle le document ticketZ/{date} comme immuable (closed: true)
 *  2. Écrit une JournalEntry agrégée dans journalEntries/Z_{date}
 *
 * Idempotent — sans effet si déjà clôturé.
 */
export async function closeTicketZForDay(tenantId: string, date: string): Promise<void> {
  const ticketPath = `tenants/${tenantId}/ticketZ/${date}`;
  const entryId = `Z_${date.replace(/-/g, '')}`;
  const entryPath = `tenants/${tenantId}/journalEntries/${entryId}`;

  await Nexus.adapter.runTransaction(async (tx) => {
    const ticketZ = await tx.get<TicketZDoc>(ticketPath);

    if (!ticketZ) {
      logger.warn(`[TicketZ] Aucun Ticket Z trouvé pour ${date} — clôture annulée`);
      return;
    }
    if (ticketZ.closed) {
      logger.info(`[TicketZ] Ticket Z ${date} déjà clôturé — no-op`);
      return;
    }

    const closedAt = new Date().toISOString();
    const totalTVAInMicrounits = Object.values(ticketZ.taxBreakdown ?? {}).reduce((a, b) => a + b, 0);

    // Sceller le Ticket Z (immuable après clôture)
    tx.update(ticketPath, {
      closed: true,
      closedAt,
      updatedAt: closedAt,
    } as unknown as SovereignData);

    // Écriture JournalEntry agrégée — pont vers la comptabilité
    tx.set(entryPath, {
      id: entryId,
      date: date,
      pieceNumber: `Z-${date}`,
      description: `Clôture Z — ${date} — ${ticketZ.ordersCount} tickets`,
      lines: [],
      referenceType: 'order',
      isSystemGenerated: true,
      isValidated: true,
      type: 'revenue',
      amountInCents: Math.round(ticketZ.totalInMicrounits / 10000),
      totalInMicrounits: ticketZ.totalInMicrounits,
      totalTVAInMicrounits,
      taxBreakdown: ticketZ.taxBreakdown,
      ordersCount: ticketZ.ordersCount,
      status: 'validated',
      updatedAt: closedAt,
    } as unknown as SovereignData);
  });

  empireAudit.log({
    module: 'accounting',
    action: 'TICKET_Z_CLOSED',
    details: { date, entryId, tenantId },
    severity: 'low',
    timestamp: new Date(),
  });

  logger.info(`[TicketZ] Clôture Z ${date} — JournalEntry ${entryId} créé`);
}
