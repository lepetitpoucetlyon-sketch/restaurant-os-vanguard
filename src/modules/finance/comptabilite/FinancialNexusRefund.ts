import { CryptoService } from '@/lib/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import type { JournalEntry, FiscalSeal } from '@nexus/contracts';
import { FiscalSealer } from '../fiscalite/FiscalSealer';
import type { BridgeResult, RefundPayload } from './FinancialNexusTypes';
export type { RefundPayload };


export async function processRefundOperation(payload: RefundPayload): Promise<BridgeResult> {
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
  const isTrainingMode = false;

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
    type: 'EXTOURNE' as never,
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

    finalJournalEntry = { ...journalEntryBase, fiscalSealHash: hash, sealedAt: now, updatedAt: now } as unknown as JournalEntry;
    finalReceiptNumber = receiptNumber;
    finalSnapshot = dataSnapshot;
  } else {
    const provisional = `OFFLINE-REFUND-${entryId}`;
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
