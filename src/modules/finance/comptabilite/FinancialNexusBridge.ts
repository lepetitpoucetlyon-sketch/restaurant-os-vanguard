import { CryptoService } from '@/lib/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import type { JournalEntry, FiscalSeal, JournalEntryStatus } from '@nexus/contracts';
import type { ConsumptionMode } from '@/modules/ops/domain/schemas/orders';
import { TaxCalculator } from '../fiscalite/TaxCalculator';
import { FiscalSealer } from '../fiscalite/FiscalSealer';
import { resolveVatRate, inferCategory } from '../fiscalite/tax/vatResolver';
import type { BridgePayload, PaymentMode, BridgeResult, RefundPayload } from './FinancialNexusTypes';
import {
  microToCents,
  computeTtcByRateAndAxis,
  buildJournalLines,
} from './FinancialJournalBuilder';
import { emitPaymentEvents } from './FinancialNexusEvents';
import { processRefundOperation } from './FinancialNexusRefund';

export type { BridgePayload, PaymentMode, BridgeResult, RefundPayload };

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
    }) as (import('@/modules/ops/domain/schemas/pos').CartItem & { taxRate: "0.055" | "0.10" | "0.20", analyticalAxis: string })[];

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
    return processRefundOperation(payload);
  }
};
