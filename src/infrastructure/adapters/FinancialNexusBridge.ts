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

    // ── 2. Chaîne de scellement ───────────────────────────────────────────────
    // previousHash is managed atomically inside sealDataAtomically via chainHead —
    // never read it here to avoid hash-chain forks under concurrent orders.
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

    const { hash, signature, sealId, previousHash } = await FiscalSealer.sealDataAtomically(dataSnapshot, tenantId, isTrainingMode);

    // ── 3. JournalEntry NF525 ─────────────────────────────────────────────────
    const journalEntry: JournalEntry = {
      id: entryId,
      date: now,
      pieceNumber: receiptNumber,
      description: `Vente POS — Table ${tableId ?? 'Emporté'} — ${receiptNumber}`,
      referenceId: tableId ?? undefined,
      referenceType: 'order',
      isSystemGenerated: true,
      isValidated: true,
      fiscalSealHash: hash,
      sealedAt: now,
      type: 'revenue' as 'revenue' | 'expense' | 'tax' | 'other',
      amountInCents: Math.round(totalTTCInMicrounits / 10000),
      status: 'validated',
      updatedAt: now,
      lines: resolvedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPriceInMicrounits: item.unitPriceInMicrounits,
        taxRate: item.taxRate,
        totalInMicrounits:
          item.unitPriceInMicrounits * item.quantity -
          (item.discountInMicrounits ?? 0),
      })),
    } as unknown as JournalEntry;

    // ── 4. FiscalSeal ─────────────────────────────────────────────────────────
    // sealId comes from sealDataAtomically; the seal document is already written
    // to Nexus atomically (with correct previousHash) — do NOT re-write it here.
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

    // ── 5. Écriture atomique Nexus ────────────────────────────────────────────
    // Only journalEntry is written here — fiscalSeal was already committed by sealDataAtomically.
    const batch = Nexus.adapter.batch();
    batch.set(`tenants/${tenantId}/journalEntries/${entryId}`, journalEntry);
    await batch.commit();

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

    return { journalEntry, seal };
  },
};
