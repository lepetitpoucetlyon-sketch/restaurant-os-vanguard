import { FiscalSeal } from '@nexus/contracts';
export type { FiscalSeal };
import { empireAudit } from '@/lib/audit';
import { CryptoService } from '@/lib/CryptoService';
import { FiscalKeyService } from '@modules/finance/services/FiscalKeyService';
import { SharedKernel } from '@/lib/shared-kernel';

/**
 * ⚖️ Fiscal Domain Constants (LNE / NF525 Standards)
 */
export const FISCAL_CONSTANTS = {
  GENESIS_ROOT: 'GENESIS_ROOT_0000000000000000',
  TRAINING_MODE_HASH: 'TRAINING_MODE_UNSIGNED_HASH',
  SIGNATURE_PREFIX: 'EMP_NF525_',
} as const;


export type FiscalizableRecord = Record<string, string | number | boolean | null | undefined | object>;

/** Première rupture détectée dans une chaîne de sceaux NF525. */
export interface ChainBreach {
  /** Écriture de journal concernée (transactionId, sinon id du sceau). */
  journalId: string;
  expectedHash: string;
  actualHash: string;
  /** `continuity` : maillon détaché. `content` : snapshot altéré. */
  kind: 'continuity' | 'content';
}

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
    data: FiscalizableRecord, 
    options: { lastSeal?: FiscalSeal, isTrainingMode?: boolean, instanceId?: string } = {}
  ): Promise<FiscalSeal> {
    const timestamp = new Date().toISOString();
    const dataSnapshot = CryptoService.canonicalStringify(data as import('@/shared/nexus-contract').SovereignData); 
    const id = SharedKernel.generateId('SEAL');

    const previousHash = options.lastSeal ? options.lastSeal.hash : FISCAL_CONSTANTS.GENESIS_ROOT;

    if (options.isTrainingMode) {
        return {
            id, transactionId, timestamp, dataSnapshot,
            hash: FISCAL_CONSTANTS.TRAINING_MODE_HASH,
            previousHash,
            signature: 'VTC_SCHOOL_TRAINING_SIGNATURE',
            updatedAt: new Date().toISOString()
        };
    }

    const hash = await CryptoService.generateHash(dataSnapshot, previousHash);
    // instanceId = index de lookup de la clé provisionnée — jamais le secret lui-même.
    const signature = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey(options.instanceId));

    const seal: FiscalSeal = { id, transactionId, previousHash, hash, dataSnapshot, timestamp, signature, updatedAt: new Date().toISOString() };

    empireAudit.log({
        module: 'accounting',
        action: 'TRANSACTION_SEALED',
        details: { sealId: id, hash: hash.substring(0, 8), transactionId },
        severity: 'low',
        timestamp: new Date()
    });

    return seal;
  },

  /**
   * 🛡️ NF525: Chain Integrity Verification (Grade X Suture)
   *
   * Localise la PREMIÈRE rupture et la décrit. `verifyChain` conserve l'API
   * booléenne ; `runAudit` s'appuie sur le détail pour produire la preuve légale.
   */
  async inspectChain(seals: FiscalSeal[]): Promise<ChainBreach | null> {
      for (let i = 0; i < seals.length; i++) {
          const current = seals[i];

          // Continuité de chaîne : le maillon ne référence pas son prédécesseur.
          if (i > 0 && current.previousHash !== seals[i - 1].hash) {
              return {
                  journalId: current.transactionId ?? current.id ?? "unknown",
                  expectedHash: seals[i - 1].hash,
                  actualHash: current.previousHash ?? '',
                  kind: 'continuity',
              };
          }

          // Intégrité de contenu : le snapshot ne produit plus le hash scellé.
          const computedHash = await CryptoService.generateHash(
              current.dataSnapshot ?? "",
              current.previousHash ?? FISCAL_CONSTANTS.GENESIS_ROOT
          );
          if (computedHash !== current.hash) {
              return {
                  journalId: current.transactionId ?? current.id ?? "unknown",
                  expectedHash: current.hash,
                  actualHash: computedHash,
                  kind: 'content',
              };
          }
      }
      return null;
  },

  async verifyChain(seals: FiscalSeal[]): Promise<boolean> {
      return (await this.inspectChain(seals)) === null;
  },

  /**
   * 🛡️ Comprehensive Audit (Grade X)
   *
   * Une rupture détectée émet `crypto.integrity_failed` : CryptoIntegrityHandler
   * persiste alors la preuve dans `fiscalIntegrityBreaches` (tenant) et
   * `mccFiscalBreaches` (super admin) pour l'administration fiscale. Sans cette
   * émission, le handler était abonné à un événement que personne ne produisait —
   * une rupture NF525 restait donc totalement silencieuse.
   */
  async runAudit(seals: FiscalSeal[], instanceId: string = 'default'): Promise<{
      success: boolean;
      integrity: boolean;
      sealedCount: number;
      timestamp: string;
  }> {
      const breach = await this.inspectChain(seals);

      if (breach) {
          const detectedAt = Date.now();
          empireAudit.log({
              module: 'accounting',
              action: 'FISCAL_CHAIN_BREACH',
              details: { ...breach, tenantId: instanceId },
              severity: 'critical',
              timestamp: new Date(),
          });
          // Import dynamique : le bus ne doit pas entrer dans le graphe
          // d'initialisation du domaine fiscal.
          try {
              const { NexusEventBus } = await import('@orchestration/NexusEventBus');
              await NexusEventBus.emitDurable('crypto.integrity_failed', {
                  v: 1,
                  tenantId: instanceId,
                  journalId: breach.journalId,
                  expectedHash: breach.expectedHash,
                  actualHash: breach.actualHash,
                  detectedAt,
              });
          } catch (emitError) {
              // L'échec d'alerte ne doit pas masquer le verdict d'intégrité.
              empireAudit.log({
                  module: 'accounting',
                  action: 'FISCAL_CHAIN_BREACH_ALERT_FAILED',
                  details: { reason: String(emitError) },
                  severity: 'critical',
                  timestamp: new Date(),
              });
          }
      }

      return {
          success: !breach,
          integrity: !breach,
          sealedCount: seals.length,
          timestamp: new Date().toISOString()
      };
  }
};
