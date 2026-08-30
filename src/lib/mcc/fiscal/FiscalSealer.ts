/**
 * FiscalSealer — primitive de scellement NF525 hébergée dans lib/ pour éviter
 * le cycle `lib/mcc/fiscal/FiscalEngine → @/modules/finance (barrel) → …
 * → lib/mcc/fiscal/FiscalEngine`. L'ancien emplacement (module finance)
 * ré-exporte via un shim vers ce fichier.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FISCAL_CONSTANTS } from './constants';
import { CryptoService } from '@/lib/CryptoService';
import { FiscalKeyService } from './FiscalKeyService';
import type { FiscalSeal } from '@nexus/contracts';
import { IdGenerator } from '@/lib/utils/IdGenerator';
import type { INexusTransaction } from '@/lib/nexus/types';

export class FiscalSealer {
  static async generateSequentialReceiptNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear().toString();
    const counterPath = `tenants/${tenantId}/fiscalMeta/receiptCounter`;

    let nextNumber: number = 1;
    await Nexus.adapter.runTransaction(async (tx) => {
      const doc = await tx.get<{ year: string; counter: number }>(counterPath);
      if (doc && doc.year === year) {
        nextNumber = (doc.counter ?? 0) + 1;
      } else {
        nextNumber = 1;
      }
      tx.set(counterPath, { year, counter: nextNumber, updatedAt: new Date().toISOString() });
    });

    return `${year}-${String(nextNumber).padStart(6, '0')}`;
  }

  /** @deprecated Use generateSequentialReceiptNumber(tenantId) for NF525 compliance. */
  static generateReceiptNumberFallback(): string {
    const year = new Date().getFullYear().toString();
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${year}-${ts}-${rnd}`;
  }

  static async getLastSeal(tenantId: string): Promise<FiscalSeal | undefined> {
    try {
      const seals = await Nexus.adapter.query<FiscalSeal>(
        `tenants/${tenantId}/fiscalSeals`,
        { orderBy: { field: 'timestamp', direction: 'desc' }, limit: 1 }
      );
      return seals[0];
    } catch {
      return undefined;
    }
  }

  static async sealData(dataSnapshot: string, tenantId: string, isTrainingMode: boolean, previousHash: string) {
    let hash: string;
    let signature: string;

    if (isTrainingMode) {
      hash = FISCAL_CONSTANTS.TRAINING_MODE_HASH;
      signature = 'VTC_SCHOOL_TRAINING_SIGNATURE';
    } else {
      hash = await CryptoService.generateHash(dataSnapshot, previousHash);
      signature = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey(tenantId));
    }

    return { hash, signature, isTrainingMode, ...(isTrainingMode ? { taxExempt: true } : {}) };
  }

  static async sealDataAtomically(
    dataSnapshot: string,
    tenantId: string,
    isTrainingMode: boolean,
    journalEntry?: Record<string, unknown> & { id: string },
    additionalMutations?: (tx: INexusTransaction, sealId: string) => void,
    registerId?: string
  ): Promise<{ hash: string; signature: string; sealId: string; previousHash: string }> {
    const sealId = IdGenerator.generateWithPrefix('seal');
    const sealPath = `tenants/${tenantId}/fiscalSeals/${sealId}`;
    const chainHeadPath = registerId
      ? `tenants/${tenantId}/fiscalMeta/chainHead_${registerId}`
      : `tenants/${tenantId}/fiscalMeta/chainHead`;

    let hash: string;
    let signature: string;
    let prevHash: string;

    const timestamp = new Date().toISOString();
    const serverRecordedAt = Nexus.adapter.serverTimestamp();

    if (isTrainingMode) {
      hash = FISCAL_CONSTANTS.TRAINING_MODE_HASH;
      signature = 'VTC_SCHOOL_TRAINING_SIGNATURE';
      prevHash = FISCAL_CONSTANTS.GENESIS_ROOT;
      await Nexus.adapter.runTransaction(async (tx) => {
        tx.set(sealPath, {
          id: sealId, hash, signature,
          previousHash: FISCAL_CONSTANTS.GENESIS_ROOT,
          timestamp,
          serverRecordedAt,
          isTrainingMode: true,
          registerId: registerId ?? 'main',
        } as unknown);
        tx.set(chainHeadPath, { hash, sealId, registerId: registerId ?? 'main', updatedAt: timestamp });
        if (journalEntry) {
           tx.set(`tenants/${tenantId}/journalEntries/${journalEntry.id}`, {
             ...journalEntry,
             fiscalSealHash: hash,
             sealedAt: timestamp,
             serverRecordedAt,
             updatedAt: timestamp
           });
        }
        if (additionalMutations) additionalMutations(tx, sealId);
      });
    } else {
      await Nexus.adapter.runTransaction(async (tx) => {
        const head = await tx.get<{ hash?: string }>(chainHeadPath);
        const previousHash = head?.hash ?? FISCAL_CONSTANTS.GENESIS_ROOT;
        prevHash = previousHash;

        hash = await CryptoService.generateHash(dataSnapshot, previousHash);
        signature = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey(tenantId));

        tx.set(sealPath, {
          id: sealId, hash, signature, previousHash,
          dataSnapshot,
          transactionId: journalEntry?.id ?? sealId,
          timestamp,
          serverRecordedAt,
          isTrainingMode: false,
          registerId: registerId ?? 'main',
        } as unknown);
        tx.set(chainHeadPath, { hash, sealId, registerId: registerId ?? 'main', updatedAt: timestamp });
        if (journalEntry) {
           tx.set(`tenants/${tenantId}/journalEntries/${journalEntry.id}`, {
             ...journalEntry,
             fiscalSealHash: hash,
             sealedAt: timestamp,
             serverRecordedAt,
             updatedAt: timestamp
           });
        }
        if (additionalMutations) additionalMutations(tx, sealId);
      });
    }

    return { hash: hash!, signature: signature!, sealId, previousHash: prevHash! };
  }
}
