import { createHash, createHmac } from 'crypto';

export interface FiscalSealRecord {
  id: string;
  tenantId: string;
  sequenceNumber: number;
  timestamp: string;
  totalTTCInMicrounits: bigint | number;
  totalHTInMicrounits: bigint | number;
  totalVATInMicrounits: bigint | number;
  previousHash: string;
}

export interface SealedFiscalRecord extends FiscalSealRecord {
  seal: string;
  signature?: string;
  cumulativeGrandTotalInMicrounits: bigint;
}

export interface VerificationResult {
  valid: boolean;
  tamperedIndex?: number;
  error?: string;
  verifiedCount: number;
}

/**
 * ⚡ FiscalSealWasmEngine — Moteur Cryptographique & Fiscal NF525 Ultra-Haute Performance.
 *
 * Implémente la Loi 10 (Souveraineté & Performance Native) et l'Invariant #1 (Idempotence & Inaltérabilité).
 * Conçu pour fonctionner à vitesse native avec calculs d'empreinte SHA-256,
 * tri canonique déterministe et chaînage de Grand Total sans aucun flottant.
 */
export class FiscalSealWasmEngine {
  private static HEX_CHARS = '0123456789abcdef';

  /**
   * Sérialisation canonique normalisée DGFiP / NF525 (tri strict des clés sans espaces).
   */
  static canonicalize(data: Record<string, unknown>): string {
    const sortedKeys = Object.keys(data).sort();
    const parts: string[] = [];
    for (const key of sortedKeys) {
      const val = data[key];
      if (val === undefined) continue;
      if (typeof val === 'bigint') {
        parts.push(`"${key}":"${val.toString()}"`);
      } else if (typeof val === 'object' && val !== null) {
        parts.push(`"${key}":${this.canonicalize(val as Record<string, unknown>)}`);
      } else {
        parts.push(`"${key}":${JSON.stringify(val)}`);
      }
    }
    return `{${parts.join(',')}}`;
  }

  /**
   * Calcul d'empreinte SHA-256 ultra-rapide (Node crypto natif / Buffer zéro-copie).
   */
  static sha256(message: string): string {
    return createHash('sha256').update(message, 'utf8').digest('hex');
  }

  /**
   * Calcul HMAC-SHA256 pour signature privée avec clé matérielle / HSM.
   */
  static hmacSha256(message: string, secret: string): string {
    return createHmac('sha256', secret).update(message, 'utf8').digest('hex');
  }

  /**
   * Scelle un enregistrement de caisse ou de facture dans la chaîne inaltérable.
   */
  static sealRecord(
    record: FiscalSealRecord,
    previousCumulativeGrandTotal: bigint = 0n,
    privateKeySecret?: string,
  ): SealedFiscalRecord {
    const totalTTC = BigInt(record.totalTTCInMicrounits);
    const cumulativeGrandTotalInMicrounits = previousCumulativeGrandTotal + totalTTC;

    const payloadToHash = this.canonicalize({
      id: record.id,
      tenantId: record.tenantId,
      sequenceNumber: record.sequenceNumber,
      timestamp: record.timestamp,
      totalHTInMicrounits: record.totalHTInMicrounits.toString(),
      totalTTCInMicrounits: record.totalTTCInMicrounits.toString(),
      totalVATInMicrounits: record.totalVATInMicrounits.toString(),
      cumulativeGrandTotalInMicrounits: cumulativeGrandTotalInMicrounits.toString(),
    });

    const seal = this.sha256(payloadToHash + record.previousHash);
    const signature = privateKeySecret ? this.hmacSha256(seal, privateKeySecret) : undefined;

    return {
      ...record,
      totalTTCInMicrounits: totalTTC,
      totalHTInMicrounits: BigInt(record.totalHTInMicrounits),
      totalVATInMicrounits: BigInt(record.totalVATInMicrounits),
      seal,
      signature,
      cumulativeGrandTotalInMicrounits,
    };
  }

  /**
   * Vérifie l'inaltérabilité et la continuité parfaite d'une chaîne fiscale (ex: 10 000 tickets).
   */
  static verifyChain(records: SealedFiscalRecord[], expectedInitialHash: string = ''): VerificationResult {
    let prevHash = expectedInitialHash;
    let runningGrandTotal = 0n;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      // 1. Vérification de la continuité du hash précédent
      if (rec.previousHash !== prevHash) {
        return {
          valid: false,
          tamperedIndex: i,
          error: `Rupture de chaînage à l'index ${i}: previousHash '${rec.previousHash}' != '${prevHash}'`,
          verifiedCount: i,
        };
      }

      // 2. Vérification du Grand Total perpétuel
      runningGrandTotal += BigInt(rec.totalTTCInMicrounits);
      if (BigInt(rec.cumulativeGrandTotalInMicrounits) !== runningGrandTotal) {
        return {
          valid: false,
          tamperedIndex: i,
          error: `Divergence Grand Total à l'index ${i}: calculé ${runningGrandTotal} != stocké ${rec.cumulativeGrandTotalInMicrounits}`,
          verifiedCount: i,
        };
      }

      // 3. Recalcul de l'empreinte cryptographique
      const payloadToHash = this.canonicalize({
        id: rec.id,
        tenantId: rec.tenantId,
        sequenceNumber: rec.sequenceNumber,
        timestamp: rec.timestamp,
        totalHTInMicrounits: rec.totalHTInMicrounits.toString(),
        totalTTCInMicrounits: rec.totalTTCInMicrounits.toString(),
        totalVATInMicrounits: rec.totalVATInMicrounits.toString(),
        cumulativeGrandTotalInMicrounits: runningGrandTotal.toString(),
      });

      const recomputedSeal = this.sha256(payloadToHash + prevHash);
      if (recomputedSeal !== rec.seal) {
        return {
          valid: false,
          tamperedIndex: i,
          error: `Altération de données détectée à l'index ${i}: hash invalide`,
          verifiedCount: i,
        };
      }

      prevHash = rec.seal;
    }

    return {
      valid: true,
      verifiedCount: records.length,
    };
  }
}
