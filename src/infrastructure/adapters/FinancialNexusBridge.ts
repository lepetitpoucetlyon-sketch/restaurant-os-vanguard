import { CryptoService } from '@domain/services/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/infrastructure/services/audit';
import type { JournalEntry, JournalLine, FiscalSeal } from '@nexus/contracts';
import type { CartItem } from '@/modules/ops/workflow/engine/types';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { TaxCalculator } from '../services/finance/TaxCalculator';
import { FiscalSealer } from '../services/finance/FiscalSealer';
import { resolveVatRate, inferCategory } from '@/modules/finance/fiscalite/tax/vatResolver';
import type { ConsumptionMode } from '@/domain/schemas/orders';

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

const PCG_PAYMENT_ACCOUNTS: Record<PaymentMode, { code: string; name: string }> = {
  cash:         { code: '531000', name: 'Caisse' },
  card:         { code: '512000', name: 'Banque (CB)' },
  check:        { code: '511200', name: 'Chèques à encaisser' },
  ticket_resto: { code: '511500', name: 'Titres-restaurant à encaisser' },
  transfer:     { code: '512000', name: 'Banque (virement)' },
  comp:         { code: '658000', name: 'Charges diverses (Offerts)' },
};

const microToCents = (mu: number): number => Math.round(mu / 10_000);

function computeTtcByRateAndAxis(
  items: (CartItem & { taxRate: string; analyticalAxis: string })[]
): Record<string, { ttcMu: number; tvaMu: number }> {
  const result: Record<string, { ttcMu: number; tvaMu: number }> = {};
  for (const item of items) {
    const key = `${item.taxRate}_${item.analyticalAxis}`;
    const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
    const rateNum = parseFloat(String(item.taxRate ?? '0.10'));
    const lineTVA = lineTTC - Math.round(lineTTC / (1 + rateNum));

    if (!result[key]) {
      result[key] = { ttcMu: 0, tvaMu: 0 };
    }
    result[key].ttcMu += lineTTC;
    result[key].tvaMu += lineTVA;
  }
  return result;
}

function makeLine(
  accountCode: string,
  accountName: string,
  side: 'debit' | 'credit',
  cents: number,
  description: string,
  pieceNumber: string,
  now: string,
  analyticalAxis?: string,
): JournalLine {
  return {
    accountId: accountCode,
    accountCode,
    accountName,
    description,
    side,
    amountInCents: cents,
    amountInMicrounits: cents * 10_000,
    date: now,
    pieceNumber,
    debitInCents: side === 'debit' ? cents : 0,
    debitInMicrounits: side === 'debit' ? cents * 10_000 : 0,
    creditInCents: side === 'credit' ? cents : 0,
    creditInMicrounits: side === 'credit' ? cents * 10_000 : 0,
    runningBalanceInCents: 0,
    runningBalanceInMicrounits: 0,
    ...(analyticalAxis ? { analyticalAxis } : {}),
  };
}

function buildJournalLines(
  ttcByRateAndAxis: Record<string, { ttcMu: number; tvaMu: number }>,
  payload: BridgePayload,
  pieceNumber: string,
  now: string
): JournalLine[] {
  const credits: JournalLine[] = [];
  let totalCreditCents = 0;

  for (const [key, totals] of Object.entries(ttcByRateAndAxis)) {
    const [rate, axis] = key.split('_');
    const htCents = microToCents(totals.ttcMu - totals.tvaMu);
    const tvaCents = microToCents(totals.tvaMu);
    const ratePct = (parseFloat(rate) * 100).toFixed(1);

    if (htCents > 0) {
      credits.push(makeLine('701000', 'Ventes de marchandises', 'credit', htCents, `Ventes HT (TVA ${ratePct}%)`, pieceNumber, now, axis));
      totalCreditCents += htCents;
    }
    if (tvaCents > 0) {
      credits.push(makeLine('445710', 'TVA collectée', 'credit', tvaCents, `TVA collectée ${ratePct}%`, pieceNumber, now));
      totalCreditCents += tvaCents;
    }
  }

  const debits: JournalLine[] = [];
  const paymentMode = payload.paymentMode ?? 'card';
  const payAcct = PCG_PAYMENT_ACCOUNTS[paymentMode] ?? PCG_PAYMENT_ACCOUNTS.card;

  if (payload.partialPayments && payload.partialPayments.length > 0) {
    for (const p of payload.partialPayments) {
      const pm = (p.method as PaymentMode) || 'card';
      const acct = PCG_PAYMENT_ACCOUNTS[pm] ?? PCG_PAYMENT_ACCOUNTS.card;
      const amtCents = microToCents(p.amount);
      debits.push(makeLine(acct.code, acct.name, 'debit', amtCents, `Encaissement split ${acct.name} (Guest ${p.guest})`, pieceNumber, now));
    }
  } else {
    debits.push(makeLine(payAcct.code, payAcct.name, 'debit', totalCreditCents, paymentMode === 'comp' ? 'Repas offert (Comp)' : `Encaissement ${payAcct.name}`, pieceNumber, now));
  }
  return [...debits, ...credits];
}

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
      const taxRate = isTrainingMode ? ('0.00' as any) : resolveVatRate({ category, consumptionMode: lineMode });
      const analyticalAxis = (category === 'beverage_soft' || category === 'alcohol') ? 'Beverage' : 'Food';
      return { ...item, taxRate, analyticalAxis };
    });

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
      amountInMicrounits: totalTTCInMicrounits,
      status,
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

      finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now } as unknown as JournalEntry;
      finalReceiptNumber = receiptNumber;
      finalSnapshot = dataSnapshot;
    } else {
      const provisional = `OFFLINE-${entryId}`;
      const journalEntryBase = buildEntryBase(provisional, 'draft');

      hash = 'PENDING_OFFLINE_SEAL';
      signature = 'PENDING_OFFLINE_SEAL';
      sealId = SharedKernel.generateId('seal_pending');
      previousHash = 'PENDING_OFFLINE';

      finalJournalEntry = { ...journalEntryBase, updatedAt: now } as unknown as JournalEntry;
      finalReceiptNumber = provisional;
      finalSnapshot = buildSnapshot(provisional);

      const { SyncManager } = await import('@/infrastructure/services/offline/sync-manager');
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
};
