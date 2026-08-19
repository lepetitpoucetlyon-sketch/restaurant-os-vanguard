import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { TaxCalculator } from '@/modules/finance/fiscalite/TaxCalculator';
import { CryptoService } from '@/lib/CryptoService';
import type { SovereignData } from '@shared/nexus-contract';
import { toSovereignData } from "@/lib/toSovereignData";

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
    async (payload) => {
      const { tenantId, totalInMicrounits, items, tableId } = payload;
      
      // P11-D, P11-E, P11-I : Libérer la table et la marquer à nettoyer (avec optimistic locking via tx)
      if (tableId) {
        const tablePath = `tenants/${tenantId}/tables/${tableId}`;
        await Nexus.adapter.runTransaction(async (tx) => {
          const table = await tx.get<{ status: string; cleaningRequired: boolean; version?: number }>(tablePath);
          if (table && table.status !== 'available') {
            tx.set(tablePath, {
              ...table,
              status: 'available',
              freedAt: new Date().toISOString(),
              cleaningRequired: true,
            });
          }
        }).catch(err => logger.error(`[TicketZHandler] Erreur libération table ${tableId}`, err));
      }

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
          const tva = TaxCalculator.applyRate(lineTotal, rate);
          taxBreakdown[rate] = (taxBreakdown[rate] ?? 0) + tva;
        }

        const updated: TicketZDoc = {
          ...existing,
          ordersCount: existing.ordersCount + 1,
          totalInMicrounits: existing.totalInMicrounits + totalInMicrounits,
          taxBreakdown,
          updatedAt: new Date().toISOString(),
        };

        tx.set(path, toSovereignData(updated));

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

  // Idempotence : si le JournalEntry scellé existe déjà, rien à faire.
  // Cela couvre aussi le cas d'un échec partiel (ticketZ clôturé mais JE non scellé).
  const existingEntry = await Nexus.adapter.get(entryPath);
  if (existingEntry) {
    logger.info(`[TicketZ] JournalEntry ${entryId} déjà scellé — no-op`);
    return;
  }

  const ticketZ = await Nexus.adapter.get<TicketZDoc>(ticketPath);

  if (!ticketZ) {
    logger.warn(`[TicketZ] Aucun Ticket Z trouvé pour ${date} — clôture annulée`);
    return;
  }

  const closedAt = new Date().toISOString();
  const totalTVAInMicrounits = Object.values(ticketZ.taxBreakdown ?? {}).reduce((a, b) => a + b, 0);

  // Numéro séquentiel NF525
  const receiptNumber = await FiscalSealer.generateSequentialReceiptNumber(tenantId);

  const journalEntryBase = {
    id: entryId,
    date,
    pieceNumber: receiptNumber,
    description: `Clôture Z — ${date} — ${ticketZ.ordersCount} tickets`,
    lines: [],
    referenceType: 'order' as const,
    isSystemGenerated: true,
    isValidated: true,
    type: 'revenue' as const,
    totalInMicrounits: ticketZ.totalInMicrounits,
    totalTVAInMicrounits,
    taxBreakdown: ticketZ.taxBreakdown,
    ordersCount: ticketZ.ordersCount,
    status: 'validated' as const,
    updatedAt: closedAt,
  };

  const dataSnapshot = CryptoService.canonicalStringify({
    id: entryId,
    receiptNumber,
    totalInMicrounits: ticketZ.totalInMicrounits,
    totalTVAInMicrounits,
    taxBreakdown: ticketZ.taxBreakdown,
    ordersCount: ticketZ.ordersCount,
    date,
  });

  // Scellement NF525 : écrit JournalEntry + FiscalSeal + clôture TicketZ atomiquement.
  // Le Ticket Z est marqué closed: true dans la MÊME transaction que le sceau — si
  // le scellement échoue, le ticket reste ouvert (aucune désynchronisation possible).
  const sealResult = await FiscalSealer.sealDataAtomically(
    dataSnapshot,
    tenantId,
    false,
    journalEntryBase,
    (tx, sealId) => tx.update(ticketPath, {
      closed: true,
      closedAt,
      fiscalSealId: sealId,
      updatedAt: closedAt,
    } as Partial<unknown>),
  );

  empireAudit.log({
    module: 'accounting',
    action: 'TICKET_Z_CLOSED',
    details: { date, entryId, tenantId, sealId: sealResult.sealId, hash: sealResult.hash.substring(0, 8) },
    severity: 'low',
    timestamp: new Date(),
  });

  logger.info(`[TicketZ] Clôture Z ${date} — JournalEntry ${entryId} scellé NF525 (hash: ${sealResult.hash.substring(0, 8)})`);

  // P08-H: Déclencher la prévision CA J+1 via l'Oracle
  NexusEventBus.emitDurable('finance.ticket_z_closed', {
    v: 1,
    tenantId,
    date,
    totalInMicrounits: ticketZ.totalInMicrounits,
    ordersCount: ticketZ.ordersCount
  }).catch(() => {});
}
