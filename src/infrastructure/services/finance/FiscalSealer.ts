import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FISCAL_CONSTANTS } from '../../adapters/FiscalAdapter';
import { CryptoService } from '@domain/services/CryptoService';
import { FiscalKeyService } from '@domain/services/FiscalKeyService';
import type { FiscalSeal } from '@nexus/contracts';

export class FiscalSealer {
  static generateReceiptNumber(): string {
    const year = new Date().getFullYear().toString();
    const seq = Date.now().toString().slice(-6);
    return `${year}-${seq}`;
  }

  static async getLastSeal(tenantId: string): Promise<FiscalSeal | undefined> {
    try {
      const seals = await Nexus.adapter.query<FiscalSeal>(
        `tenants/${tenantId}/fiscalSeals`
      );
      if (!seals || seals.length === 0) return undefined;
      return [...seals].sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      })[0];
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

    return { hash, signature };
  }
}
