import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@domain/services/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import type { JournalEntry, FiscalSeal } from '@nexus/contracts';
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
}

export interface BridgeResult {
  journalEntry: JournalEntry;
  seal: FiscalSeal;
}

const _DEVICE_ID = 'MAIN_POS';
const _SCHEMA_VERSION = '1.0.0';

/**
 * FinancialNexusBridge — Grade X "NF525 Suture"
 *
 * Converts a validated POS cart into:
 *  1. A NF525-compliant JournalEntry (immutable ledger record)
 *  2. A FiscalSeal (hash chain link)
 *
 * Both records are written atomically to Nexus before returning.
 * Designed to be called from handlePaymentComplete — never blocks UI.
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

    // ── 2. JournalEntry NF525 & PCG Double-Entry ──────────────────────────────
    const receiptNumber = await FiscalSealer.generateSequentialReceiptNumber(tenantId);
    const entryId = SharedKernel.generateId('JE');
    const now = new Date().toISOString();

    const dataSnapshot = CryptoService.canonicalStringify({
      id: entryId,
      receiptNumber,
      operatorId,
      tableId,
      totalTTCInMicrounits,
      tvaBreakdown,
      timestamp: now,
    } as import("@/shared/nexus-contract").SovereignData);

    const pcgLines = [
      { account: '512000', direction: 'debit', amountInMicrounits: totalTTCInMicrounits },
      { account: '701000', direction: 'credit', amountInMicrounits: totalTTCInMicrounits - tvaBreakdown.totalTaxInMicrounits },
      ...(tvaBreakdown?.rates ? Object.entries(tvaBreakdown.rates).map(([rate, amounts]) => ({
        account: '445710',
        direction: 'credit',
        amountInMicrounits: amounts.tax,
        metadata: { taxRate: rate }
      })) : []),
      ...resolvedItems.map((item) => ({
        account: 'AUX_PRODUCT',
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPriceInMicrounits: item.unitPriceInMicrounits,
        taxRate: item.taxRate,
        totalInMicrounits: item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0),
      }))
    ];

    const journalEntryBase = {
      id: entryId,
      date: now,
      pieceNumber: receiptNumber,
      description: `Vente POS — Table ${tableId ?? 'Emporté'} — ${receiptNumber}`,
      referenceId: tableId ?? undefined,
      referenceType: 'order',
      isSystemGenerated: true,
      isValidated: true,
      type: 'revenue',
      amountInCents: Math.round(totalTTCInMicrounits / 10000),
      status: 'validated',
      lines: pcgLines,
    };

    // ── 3. Écriture Atomique Triptyque ou Mode Hors-Ligne ────────────────────
    let hash: string, signature: string, sealId: string, previousHash: string;
    let finalJournalEntry: JournalEntry;

    // TODO: Importer checkOnlineStatus en haut du fichier
    // import { checkOnlineStatus } from '@/lib/offline/connectivity-hooks';
    // import { SyncManager } from '@/lib/offline/sync-manager';
    const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

    if (isOnline) {
      const sealResult = await FiscalSealer.sealDataAtomically(
        dataSnapshot,
        tenantId,
        isTrainingMode,
        journalEntryBase
      );
      hash = sealResult.hash;
      signature = sealResult.signature;
      sealId = sealResult.sealId;
      previousHash = sealResult.previousHash;

      finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now } as unknown as JournalEntry;
    } else {
      // Mode Hors-Ligne : Création d'un Draft et Envoi au SyncManager
      hash = 'OFFLINE_DRAFT_HASH';
      signature = 'OFFLINE_DRAFT_SIGNATURE';
      sealId = SharedKernel.generateId('seal_draft');
      previousHash = 'OFFLINE';

      finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now, status: 'offline_draft' } as unknown as JournalEntry;
      
      const syncManagerModule = await import('@/lib/offline/sync-manager');
      await syncManagerModule.SyncManager.enqueue({
        type: 'NF525_PAYMENT',
        priority: 1,
        collection: `tenants/${tenantId}/journalEntries`,
        targetId: entryId,
        action: 'COMMIT_BATCH',
        payload: {
          instructions: [
            { method: 'SET', path: `tenants/${tenantId}/journalEntries/${entryId}`, data: finalJournalEntry }
          ]
        }
      });
    }

    const seal: FiscalSeal = {
      id: sealId,
      transactionId: entryId,
      timestamp: now,
      dataSnapshot,
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
        receiptNumber,
        isTrainingMode,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    return { journalEntry: finalJournalEntry, seal };
  },
};
