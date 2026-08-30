import { FiscalSealer } from "@/modules/finance";
import { FiscalSeal } from '@nexus/contracts';
import { empireAudit } from '@/lib/audit';
import { CryptoService } from '@/lib/CryptoService';
import { FiscalKeyService } from './FiscalKeyService';
import { SharedKernel } from '@/lib/shared-kernel';

/**
 * ⚖️ Fiscal Domain Constants (LNE / NF525 Standards)
 */
export const FISCAL_CONSTANTS = {
  GENESIS_ROOT: 'GENESIS_ROOT_0000000000000000',
  TRAINING_MODE_HASH: 'TRAINING_MODE_UNSIGNED_HASH',
  SIGNATURE_PREFIX: 'EMP_NF525_',
} as const;

/**
 * 🏛️ FiscalEngine - Grade X "Industrial Titan"
 * Logic for Transaction Inalterability and Securization.
 * Compliant with NF525 Requirements.
 */
export const FiscalEngine = {
  /**
   * Seals a journal entry by creating a fiscal chain link
   */
    async sealEntry(
    transactionId: string, 
    data: Record<string, import("@/shared/nexus/contracts").SovereignValue>, 
    options: { lastSeal?: FiscalSeal, isTrainingMode?: boolean, instanceId?: string } = {}
  ): Promise<FiscalSeal> {
    const tenantId = options.instanceId || "main";
    const isTraining = Boolean(options.isTrainingMode);
    const dataSnapshot = CryptoService.canonicalStringify(data as import("@/shared/nexus/contracts").SovereignData);

    if (options.lastSeal) {
      const id = SharedKernel.generateId("SEAL");
      const timestamp = new Date().toISOString();
      const previousHash = options.lastSeal.hash;
      let hash: string;
      let signature: string;
      if (isTraining) {
        hash = FISCAL_CONSTANTS.TRAINING_MODE_HASH;
        signature = "VTC_SCHOOL_TRAINING_SIGNATURE";
      } else {
        hash = await CryptoService.generateHash(dataSnapshot, previousHash);
        signature = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey(tenantId));
      }
      const seal: FiscalSeal = { id, transactionId, previousHash, hash, dataSnapshot, timestamp, signature, updatedAt: new Date().toISOString() };
      empireAudit.log({
        module: "accounting",
        action: "TRANSACTION_SEALED",
        details: { sealId: id, hash: hash.substring(0, 8), transactionId },
        severity: "low",
        timestamp: new Date()
      });
      return seal;
    }

    const res = await FiscalSealer.sealDataAtomically(
      dataSnapshot,
      tenantId,
      isTraining,
      { id: transactionId, ...data }
    );

    const seal: FiscalSeal = {
      id: res.sealId,
      transactionId,
      previousHash: res.previousHash,
      hash: res.hash,
      dataSnapshot,
      timestamp: new Date().toISOString(),
      signature: res.signature,
      updatedAt: new Date().toISOString(),
    };

    empireAudit.log({
      module: "accounting",
      action: "TRANSACTION_SEALED",
      details: { sealId: res.sealId, hash: res.hash.substring(0, 8), transactionId },
      severity: "low",
      timestamp: new Date()
    });

    return seal;
  },

  /**
   * 🛡️ NF525: Chain Integrity Verification (Grade X Suture)
   */
  async verifyChain(seals: FiscalSeal[]): Promise<boolean> {
      for (let i = 0; i < seals.length; i++) {
          const current = seals[i];
          // Chain Continuity
          if (i > 0 && current.previousHash !== seals[i - 1].hash) return false;
          // Content Integrity
          const computedHash = await CryptoService.generateHash(current.dataSnapshot ?? "", current.previousHash ?? "");
          if (computedHash !== current.hash) return false;
      }
      return true;
  },

  /**
   * 🛡️ Comprehensive Audit (Grade X)
   */
  async runAudit(seals: FiscalSeal[], _instanceId: string = 'default'): Promise<{ 
      success: boolean; 
      integrity: boolean;
      sealedCount: number;
      timestamp: string;
  }> {
      const integrity = await this.verifyChain(seals);
      return {
          success: integrity,
          integrity,
          sealedCount: seals.length,
          timestamp: new Date().toISOString()
      };
  }
};
