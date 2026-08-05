import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FISCAL_CONSTANTS } from './FiscalAdapter';
import { CryptoService } from '@domain/services/CryptoService';
import { FiscalKeyService } from '@modules/finance/services/FiscalKeyService';
import type { FiscalSeal } from '@nexus/contracts';
import { IdGenerator } from '@/lib/utils/IdGenerator';

export class FiscalSealer {
  /**
   * 🏛️ NF525 Sequential Receipt Numbering (Grade X)
   *
   * Uses an atomic Firestore transaction to guarantee strictly sequential
   * receipt numbers per tenant per year. The counter document lives at
   * `tenants/{tenantId}/fiscalMeta/receiptCounter`.
   *
   * Format: {YEAR}-{COUNTER} (e.g. 2026-000042)
   *
   * Replaces the previous timestamp+random approach which did not guarantee
   * sequential ordering as required by the NF525 certification standard.
   */
  static async generateSequentialReceiptNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear().toString();
    const counterPath = `tenants/${tenantId}/fiscalMeta/receiptCounter`;

    let nextNumber: number = 1;
    await Nexus.adapter.runTransaction(async (tx) => {
      const doc = await tx.get<{ year: string; counter: number }>(counterPath);
      if (doc && doc.year === year) {
        nextNumber = (doc.counter ?? 0) + 1;
      } else {
        // New year or first receipt ever — reset counter
        nextNumber = 1;
      }
      tx.set(counterPath, { year, counter: nextNumber, updatedAt: new Date().toISOString() });
    });

    return `${year}-${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * @deprecated Use generateSequentialReceiptNumber(tenantId) for NF525 compliance.
   * Kept for offline/training fallback only.
   */
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
      // Le tenantId sert d'index de lookup — la clé vient de FiscalKeyService.
      signature = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey(tenantId));
    }

    return { hash, signature, isTrainingMode, ...(isTrainingMode ? { taxExempt: true } : {}) };
  }

  /**
   * Atomic NF525 seal — reads previousHash and writes the new seal inside a
   * single adapter transaction (auto-retries on conflict in Firestore, sequential
   * in Simulacra/Mock). Works across all adapters (agnostic).
   *
   * Pattern: a fixed-path `chainHead` document carries the current chain tip.
   * The transaction reads chainHead → computes hash → writes new seal + updates
   * chainHead, all atomically. Prevents hash-chain forks under concurrent sealing.
   *
   * chainHead path: tenants/{tenantId}/fiscalMeta/chainHead
   */
  static async sealDataAtomically(
    dataSnapshot: string,
    tenantId: string,
    isTrainingMode: boolean,
    journalEntry?: Record<string, unknown> & { id: string }
  ): Promise<{ hash: string; signature: string; sealId: string; previousHash: string }> {
    const sealId = IdGenerator.generateWithPrefix('seal');
    const sealPath = `tenants/${tenantId}/fiscalSeals/${sealId}`;
    const chainHeadPath = `tenants/${tenantId}/fiscalMeta/chainHead`;

    let hash: string;
    let signature: string;
    let prevHash: string;

    // Horodatage déclaré (entre dans le hash/snapshot — compatibilité chaîne).
    const timestamp = new Date().toISOString();
    // Horodatage AUTORITAIRE serveur : Firestore résout serverTimestamp() côté
    // serveur au moment de l'écriture — même émis depuis le client, il est donc
    // immunisé contre une horloge locale falsifiée. C'est la référence probante
    // NF525 pour dater la pièce (l'horloge client n'est plus la seule source).
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
        } as unknown);
        tx.set(chainHeadPath, { hash, sealId, updatedAt: timestamp });
        if (journalEntry) {
           tx.set(`tenants/${tenantId}/journalEntries/${journalEntry.id}`, {
             ...journalEntry,
             fiscalSealHash: hash,
             sealedAt: timestamp,
             serverRecordedAt,
             updatedAt: timestamp
           });
        }
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
          timestamp,
          serverRecordedAt,
          isTrainingMode: false,
        } as unknown);
        tx.set(chainHeadPath, { hash, sealId, updatedAt: timestamp });
        if (journalEntry) {
           tx.set(`tenants/${tenantId}/journalEntries/${journalEntry.id}`, {
             ...journalEntry,
             fiscalSealHash: hash,
             sealedAt: timestamp,
             serverRecordedAt,
             updatedAt: timestamp
           });
        }
      });
    }

    return { hash: hash!, signature: signature!, sealId, previousHash: prevHash! };
  }
}
