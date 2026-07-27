import { CryptoService } from '@domain/services/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import type { JournalEntry, JournalLine, FiscalSeal } from '@nexus/contracts';
import type { CartItem } from '@/modules/ops/engine/types';
import { NexusEventBus } from '@/lib/events/NexusEventBus';
import { TaxCalculator } from '../services/finance/TaxCalculator';
import { FiscalSealer } from '../services/finance/FiscalSealer';
import { resolveVatRate, inferCategory } from '@/modules/finance/tax/vatResolver';
import type { ConsumptionMode } from '@/domain/schemas/orders';

export type PaymentMode = 'cash' | 'card' | 'check' | 'ticket_resto' | 'transfer';

export interface BridgePayload {
  cartItems: CartItem[];
  operatorId: string;
  tableId: string | null;
  tenantId: string;
  consumptionMode?: ConsumptionMode;
  paymentMode?: PaymentMode;
  covers?: number;
  isTrainingMode?: boolean;
  partialPayments?: { amount: number; guest: number; method?: string }[];
}

export interface BridgeResult {
  journalEntry: JournalEntry;
  seal: FiscalSeal;
}

const _DEVICE_ID = 'MAIN_POS';
const _SCHEMA_VERSION = '1.0.0';

/**
 * Comptes PCG d'encaissement par mode de paiement (débit de la contrepartie).
 * La contrepartie crédit est toujours 701 (ventes HT) + 44571 (TVA collectée).
 */
const PCG_PAYMENT_ACCOUNTS: Record<PaymentMode, { code: string; name: string }> = {
  cash:         { code: '531000', name: 'Caisse' },
  card:         { code: '512000', name: 'Banque (CB)' },
  check:        { code: '511200', name: 'Chèques à encaisser' },
  ticket_resto: { code: '511500', name: 'Titres-restaurant à encaisser' },
  transfer:     { code: '512000', name: 'Banque (virement)' },
};

const microToCents = (mu: number): number => Math.round(mu / 10_000);

/**
 * FinancialNexusBridge — Grade X "NF525 Suture"
 *
 * Convertit un panier POS validé en :
 *  1. Un JournalEntry NF525 en PARTIE DOUBLE (comptes PCG débit/crédit équilibrés)
 *  2. Un FiscalSeal (maillon de la chaîne de hash)
 *
 * En ligne : le JournalEntry et le sceau sont écrits ATOMIQUEMENT dans une seule
 * runTransaction (via FiscalSealer.sealDataAtomically) — numéro séquentiel inclus.
 *
 * Hors-ligne : aucune runTransaction n'est possible (Firestore l'interdit offline).
 * On produit donc un brouillon `draft` SANS numéro séquentiel ni sceau, mis en file
 * via le SyncManager ; le vrai numéro et le vrai sceau NF525 sont attribués
 * côté serveur (Admin SDK) par /api/finance/sync au retour du réseau.
 */
export const FinancialNexusBridge = {
  async processOrder(payload: BridgePayload): Promise<BridgeResult> {
    const {
      cartItems,
      operatorId,
      tableId,
      tenantId,
      consumptionMode = 'dine_in',
      isTrainingMode = false,
      paymentMode = 'card',
    } = payload;

    if (cartItems.length === 0) {
      throw new Error('FinancialNexusBridge: panier vide');
    }

    // ── 1. Résolution TVA par ligne (mode consommation) ──────────────────────
    const resolvedItems = cartItems.map(item => {
      const lineMode = (item as { consumptionMode?: ConsumptionMode }).consumptionMode ?? consumptionMode;
      const category = inferCategory(item.categoryId ?? '', item.name);
      const taxRate = resolveVatRate({ category, consumptionMode: lineMode });
      return { ...item, taxRate };
    });

    const { totalTTCInMicrounits, tvaBreakdown } = TaxCalculator.calculateTotals(resolvedItems);

    // TTC ventilé par taux (pour dériver le HT par taux : HT = TTC − TVA).
    const ttcByRate: Record<string, number> = {};
    for (const item of resolvedItems) {
      const rate = String(item.taxRate ?? '0.10');
      const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
      ttcByRate[rate] = (ttcByRate[rate] ?? 0) + lineTTC;
    }

    const entryId = SharedKernel.generateId('JE');
    const now = new Date().toISOString();
    const payAcct = PCG_PAYMENT_ACCOUNTS[paymentMode] ?? PCG_PAYMENT_ACCOUNTS.card;

    const makeLine = (
      accountCode: string,
      accountName: string,
      side: 'debit' | 'credit',
      cents: number,
      description: string,
      pieceNumber: string,
    ): JournalLine => ({
      accountId: accountCode,
      accountCode,
      accountName,
      description,
      side,
      amountInCents: cents,
      date: now,
      pieceNumber,
      debitInCents: side === 'debit' ? cents : 0,
      creditInCents: side === 'credit' ? cents : 0,
      runningBalanceInCents: 0,
    });

    // Partie double : 1 débit d'encaissement = Σ (crédits 701 HT + 445710 TVA) par taux.
    const buildLines = (pieceNumber: string): JournalLine[] => {
      const credits: JournalLine[] = [];
      let totalCreditCents = 0;
      for (const [rate, ttcMu] of Object.entries(ttcByRate)) {
        const tvaMu = tvaBreakdown[rate] ?? 0;
        const htCents = microToCents(ttcMu - tvaMu);
        const tvaCents = microToCents(tvaMu);
        const ratePct = (parseFloat(rate) * 100).toFixed(1);
        if (htCents > 0) {
          credits.push(makeLine('701000', 'Ventes de marchandises', 'credit', htCents, `Ventes HT (TVA ${ratePct}%)`, pieceNumber));
          totalCreditCents += htCents;
        }
        if (tvaCents > 0) {
          credits.push(makeLine('445710', 'TVA collectée', 'credit', tvaCents, `TVA collectée ${ratePct}%`, pieceNumber));
          totalCreditCents += tvaCents;
        }
      }
      // Le débit d'encaissement = somme des crédits → équilibre garanti au centime.
      const debit = makeLine(payAcct.code, payAcct.name, 'debit', totalCreditCents, `Encaissement ${payAcct.name}`, pieceNumber);
      return [debit, ...credits];
    };

    const buildSnapshot = (pieceNumber: string): string =>
      CryptoService.canonicalStringify({
        id: entryId,
        receiptNumber: pieceNumber,
        operatorId,
        tableId,
        totalTTCInMicrounits,
        tvaBreakdown,
        timestamp: now,
      } as import('@/shared/nexus-contract').SovereignData);

    const buildEntryBase = (pieceNumber: string, status: string) => ({
      id: entryId,
      date: now,
      pieceNumber,
      description: `Vente POS — Table ${tableId ?? 'Emporté'} — ${pieceNumber}`,
      referenceId: tableId ?? undefined,
      referenceType: 'order' as const,
      isSystemGenerated: true,
      isValidated: status === 'validated',
      type: 'revenue' as const,
      amountInCents: microToCents(totalTTCInMicrounits),
      status,
      lines: buildLines(pieceNumber),
    });

    // ── 2. Écriture atomique (en ligne) ou brouillon mis en file (hors-ligne) ─
    let hash: string, signature: string, sealId: string, previousHash: string;
    let finalJournalEntry: JournalEntry;
    let finalReceiptNumber: string;
    let finalSnapshot: string;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isOnline) {
      // Numéro séquentiel + scellement + écriture du JournalEntry : tout atomique.
      const receiptNumber = await FiscalSealer.generateSequentialReceiptNumber(tenantId);
      const journalEntryBase = buildEntryBase(receiptNumber, 'validated');
      const dataSnapshot = buildSnapshot(receiptNumber);

      const sealResult = await FiscalSealer.sealDataAtomically(
        dataSnapshot,
        tenantId,
        isTrainingMode,
        journalEntryBase,
      );
      hash = sealResult.hash;
      signature = sealResult.signature;
      sealId = sealResult.sealId;
      previousHash = sealResult.previousHash;

      finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now } as unknown as JournalEntry;
      finalReceiptNumber = receiptNumber;
      finalSnapshot = dataSnapshot;
    } else {
      // Hors-ligne : PAS de numéro séquentiel (runTransaction Firestore indisponible).
      // Brouillon provisoire → SyncManager → /api/finance/sync scelle côté serveur.
      const provisional = `OFFLINE-${entryId}`;
      const journalEntryBase = buildEntryBase(provisional, 'draft');

      hash = 'PENDING_OFFLINE_SEAL';
      signature = 'PENDING_OFFLINE_SEAL';
      sealId = SharedKernel.generateId('seal_pending');
      previousHash = 'PENDING_OFFLINE';

      finalJournalEntry = { ...journalEntryBase, updatedAt: now } as unknown as JournalEntry;
      finalReceiptNumber = provisional;
      finalSnapshot = buildSnapshot(provisional);

      const { SyncManager } = await import('@/lib/offline/sync-manager');
      await SyncManager.enqueue({
        type: 'NF525_PAYMENT',
        priority: 1,
        collection: `tenants/${tenantId}/journalEntries`,
        targetId: entryId,
        action: 'COMMIT_BATCH',
        payload: {
          instructions: [
            { method: 'SET', path: `tenants/${tenantId}/journalEntries/${entryId}`, data: finalJournalEntry },
          ],
        },
      });
    }

    const seal: FiscalSeal = {
      id: sealId,
      transactionId: entryId,
      timestamp: now,
      dataSnapshot: finalSnapshot,
      hash,
      previousHash,
      signature,
      updatedAt: now,
    };

    // Émission de l'événement — déclenche stock, Ticket Z, IA en parallèle
    NexusEventBus.emit('order.paid', {
      orderId: entryId,
      tableId,
      tenantId,
      operatorId,
      items: cartItems,
      totalInMicrounits: totalTTCInMicrounits,
      paymentMode,
    }).catch(() => {}); // fire-and-forget — ne bloque pas le retour bridge

    empireAudit.log({
      module: 'accounting',
      action: 'POS_PAYMENT_SEALED',
      details: {
        entryId,
        sealId,
        hash: hash.substring(0, 8),
        totalTTC: totalTTCInMicrounits,
        receiptNumber: finalReceiptNumber,
        isTrainingMode,
        offline: !isOnline,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    return { journalEntry: finalJournalEntry, seal };
  },
};
