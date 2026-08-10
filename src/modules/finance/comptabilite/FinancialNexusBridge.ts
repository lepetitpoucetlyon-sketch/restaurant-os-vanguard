import { CryptoService } from '@/lib/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import type { JournalEntry, FiscalSeal, JournalEntryStatus } from '@nexus/contracts';
import type { CartItem } from '@/shared/nexus/contracts/ops.engine.types';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { TaxCalculator } from '../fiscalite/TaxCalculator';
import { FiscalSealer } from '../fiscalite/FiscalSealer';
import { resolveVatRate } from '../fiscalite/tax/vatResolver';
import { inferCategory } from '../fiscalite/tax/vatResolver';
import type { ConsumptionMode } from '@/modules/ops';

export type PaymentMode = 'cash' | 'card' | 'check' | 'ticket_resto' | 'transfer' | 'comp';

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

import {
  microToCents,
  computeTtcByRateAndAxis,
  buildJournalLines,
} from './FinancialJournalBuilder';

function emitPaymentEvents(
  entryId: string,
  payload: BridgePayload,
  totalTTCInMicrounits: number,
  cartItems: CartItem[],
  paymentMode: PaymentMode
): void {
  const { tableId, tenantId, operatorId } = payload;
  NexusEventBus.emitDurable('order.paid', {
    v: 1,
    orderId: entryId,
    tableId,
    tenantId,
    operatorId,
    items: cartItems,
    totalInMicrounits: totalTTCInMicrounits,
    paymentMode: (payload.partialPayments && payload.partialPayments.length > 0) ? 'split' : paymentMode,
  }).catch(() => {});

  if (payload.partialPayments && payload.partialPayments.length > 0) {
    NexusEventBus.emitDurable('order.split', {
      v: 1,
      orderId: entryId,
      tableId,
      tenantId,
      operatorId,
      totalInMicrounits: totalTTCInMicrounits,
      payments: payload.partialPayments.map(p => ({ amount: p.amount, guest: p.guest, method: p.method ?? 'card' })),
    }).catch(() => {});
  } else if (paymentMode === 'comp' || totalTTCInMicrounits === 0) {
    NexusEventBus.emitDurable('order.comp', {
      v: 1,
      orderId: entryId,
      tenantId,
      operatorId,
      items: cartItems,
      totalValueInMicrounits: totalTTCInMicrounits,
      reason: 'Offert par la direction',
    }).catch(() => {});
  } else if (totalTTCInMicrounits < 0) {
    NexusEventBus.emitDurable('order.refunded', {
      v: 1,
      orderId: entryId,
      tenantId,
      operatorId,
      amountInMicrounits: Math.abs(totalTTCInMicrounits),
      originalPaymentMode: paymentMode,
    }).catch(() => {});
  }
}

export interface RefundPayload {
  original: JournalEntry;
  operatorId: string;
  tenantId: string;
  reason: string;
}

/**
 * FinancialNexusBridge — Grade X "NF525 Suture"
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

    const resolvedItems = cartItems.map(item => {
      const lineMode = (item as { consumptionMode?: ConsumptionMode }).consumptionMode ?? consumptionMode;
      const category = inferCategory(item.categoryId ?? '', item.name);
      const taxRate = isTrainingMode ? '0.00' : resolveVatRate({ category, consumptionMode: lineMode }) as "0.055" | "0.10" | "0.20";
      const analyticalAxis = (category === 'beverage_soft' || category === 'alcohol') ? 'Beverage' : 'Food';
      return { ...item, taxRate, analyticalAxis };
    }) as (import('@/modules/ops').CartItem & { taxRate: "0.055" | "0.10" | "0.20", analyticalAxis: string })[];

    const { totalTTCInMicrounits, tvaBreakdown } = TaxCalculator.calculateTotals(resolvedItems);
    const ttcByRateAndAxis = computeTtcByRateAndAxis(resolvedItems);

    const entryId = SharedKernel.generateId('JE');
    const now = new Date().toISOString();

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

    // L7 Pattern C: `updatedAt` inclus dans la base — le type inféré a `id: string` explicite,
    // ce qui rend l'objet assignable à `Record<string, unknown> & { id: string }` sans cast.
    // `Omit<JournalEntry, ...>` était impossible : SovereignNode a `[key: string]: SovereignField`
    // → TypeScript perd les propriétés nommées après un Omit sur un type indexé.
    const buildEntryBase = (pieceNumber: string, status: JournalEntryStatus) => ({
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
      amountInMicrounits: totalTTCInMicrounits,
      status,
      updatedAt: now,
      lines: buildJournalLines(ttcByRateAndAxis, payload, pieceNumber, now),
    });

    let hash: string, signature: string, sealId: string, previousHash: string;
    let finalJournalEntry: JournalEntry;
    let finalReceiptNumber: string;
    let finalSnapshot: string;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isOnline) {
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

      finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now };
      finalReceiptNumber = receiptNumber;
      finalSnapshot = dataSnapshot;
    } else {
      const provisional = `OFFLINE-${entryId}`;
      const journalEntryBase = buildEntryBase(provisional, 'draft');

      hash = 'PENDING_OFFLINE_SEAL';
      signature = 'PENDING_OFFLINE_SEAL';
      sealId = SharedKernel.generateId('seal_pending');
      previousHash = 'PENDING_OFFLINE';

      finalJournalEntry = { ...journalEntryBase, updatedAt: now };
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

    emitPaymentEvents(entryId, payload, totalTTCInMicrounits, cartItems, paymentMode);

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

  async processRefund(payload: RefundPayload): Promise<BridgeResult> {
    const { original, operatorId, tenantId, reason } = payload;
    
    // Extourne: montants inversés
    const refundAmountInCents = -Math.abs(original.amountInCents ?? 0);
    const refundAmountInMicrounits = -Math.abs(original.amountInMicrounits ?? 0);

    const lines = original.lines.map(line => ({
      ...line,
      amountInCents: -(line.amountInCents ?? 0),
      amountInMicrounits: -(line.amountInMicrounits ?? 0),
      debitInCents: line.creditInCents,
      debitInMicrounits: line.creditInMicrounits,
      creditInCents: line.debitInCents,
      creditInMicrounits: line.debitInMicrounits,
      description: `[EXTOURNE] ${line.description}`,
    }));

    const entryId = SharedKernel.generateId('JE');
    const now = new Date().toISOString();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isTrainingMode = false; // Par défaut pour le remboursement
    
    let hash: string, signature: string, sealId: string, previousHash: string;
    let finalJournalEntry: JournalEntry;
    let finalReceiptNumber: string;
    let finalSnapshot: string;

    const buildSnapshot = (pieceNumber: string): string =>
      CryptoService.canonicalStringify({
        id: entryId,
        receiptNumber: pieceNumber,
        operatorId,
        totalTTCInMicrounits: refundAmountInMicrounits,
        timestamp: now,
        reason,
        extourneFor: original.id,
      } as import('@/shared/nexus-contract').SovereignData);

    const buildEntryBase = (pieceNumber: string, status: string) => ({
      id: entryId,
      date: now,
      pieceNumber,
      description: `Remboursement POS — Réf ${original.pieceNumber} — ${pieceNumber}`,
      referenceId: original.id,
      referenceType: 'refund' as const,
      isSystemGenerated: true,
      isValidated: status === 'validated',
      type: 'EXTOURNE' as never, // type: 'EXTOURNE' bypass type checking if needed
      amountInCents: refundAmountInCents,
      amountInMicrounits: refundAmountInMicrounits,
      status,
      lines,
    });

    if (isOnline) {
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

      finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now } as unknown as JournalEntry; // as unknown as: referenceType:'refund' et type:'EXTOURNE' hors union JournalEntry — frontière NF525 extourne
      finalReceiptNumber = receiptNumber;
      finalSnapshot = dataSnapshot;
    } else {
      const provisional = `OFFLINE-REFUND-${entryId}`;
      const journalEntryBase = buildEntryBase(provisional, 'draft');

      hash = 'PENDING_OFFLINE_SEAL';
      signature = 'PENDING_OFFLINE_SEAL';
      sealId = SharedKernel.generateId('seal_pending');
      previousHash = 'PENDING_OFFLINE';

      finalJournalEntry = { ...journalEntryBase, updatedAt: now } as unknown as JournalEntry; // as unknown as: idem extourne offline — types non-standard légitimes NF525
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

    empireAudit.log({
      module: 'accounting',
      action: 'POS_REFUND_SEALED',
      details: {
        entryId,
        sealId,
        hash: hash.substring(0, 8),
        totalTTC: refundAmountInMicrounits,
        receiptNumber: finalReceiptNumber,
        offline: !isOnline,
        reason,
      },
      severity: 'high',
      timestamp: new Date(),
    });

    return { journalEntry: finalJournalEntry, seal };
  }
};
