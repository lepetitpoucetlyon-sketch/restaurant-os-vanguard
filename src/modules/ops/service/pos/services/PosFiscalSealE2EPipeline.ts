import { logger } from '@/lib/logger';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { TaxRateGuard } from './TaxRateGuard';

export interface PosOrderLineInput {
  productId: string;
  name: string;
  quantity: number;
  unitPriceInMicrounits: number;
  taxRate: string; // '0.055' | '0.10' | '0.20' etc.
}

export interface PosPaymentInput {
  method: 'cb' | 'cash' | 'tr' | 'giftcard';
  amountInMicrounits: number;
  transactionRef?: string;
}

export interface PosFiscalSealE2EResult {
  orderId: string;
  ticketNumber: string;
  totalInMicrounits: number;
  taxSummary: Record<string, { baseInMicrounits: number; taxInMicrounits: number }>;
  isFullyPaid: boolean;
  seal: {
    sealId: string;
    hash: string;
    signature: string;
    previousHash: string;
  };
  journalEntryId: string;
  sealedAt: number;
}

/**
 * PosFiscalSealE2EPipeline — Angle mort A2.
 * Valide le cycle complet d'encaissement :
 * Commande -> Validation fiscale TVA -> Paiement -> Scellement cryptographique NF525 -> Écriture comptable.
 */
export class PosFiscalSealE2EPipeline {
  /**
   * Exécute le pipeline complet avec scellement NF525 inaltérable.
   */
  static async processOrderAndSeal(
    tenantId: string,
    orderId: string,
    ticketNumber: string,
    lines: PosOrderLineInput[],
    payments: PosPaymentInput[]
  ): Promise<PosFiscalSealE2EResult> {
    if (lines.length === 0) {
      throw new Error('[POS-SEAL-E2E] Cannot seal empty order');
    }

    // 1. Guard against unconfigured or illegal tax rates
    TaxRateGuard.assertOrThrow(
      lines.map(l => ({ cartId: l.productId, productId: l.productId, name: l.name, taxRate: l.taxRate }))
    );

    // 2. Compute totals & taxes using integer microunits (Zero float rule)
    let totalInMicrounits = 0;
    const taxSummary: Record<string, { baseInMicrounits: number; taxInMicrounits: number }> = {};

    for (const line of lines) {
      const lineTotal = line.quantity * line.unitPriceInMicrounits;
      totalInMicrounits += lineTotal;

      const rateNum = parseFloat(line.taxRate);
      // HT = TTC / (1 + rate) -> Tax = TTC - HT
      const baseInMicrounits = Math.round(lineTotal / (1 + rateNum));
      const taxInMicrounits = lineTotal - baseInMicrounits;

      if (!taxSummary[line.taxRate]) {
        taxSummary[line.taxRate] = { baseInMicrounits: 0, taxInMicrounits: 0 };
      }
      taxSummary[line.taxRate].baseInMicrounits += baseInMicrounits;
      taxSummary[line.taxRate].taxInMicrounits += taxInMicrounits;
    }

    // 3. Verify payments match total
    const totalPaidInMicrounits = payments.reduce((sum, p) => sum + p.amountInMicrounits, 0);
    const isFullyPaid = totalPaidInMicrounits >= totalInMicrounits;

    if (!isFullyPaid) {
      throw new Error(`[POS-SEAL-E2E] Incomplete payment: received ${totalPaidInMicrounits}, expected ${totalInMicrounits}`);
    }

    // 4. Seal entry in FiscalSealer (chained SHA-256 NF525)
    const journalEntryId = `JE-POS-${orderId}-${Date.now()}`;
    const sealData = {
      tenantId,
      orderId,
      ticketNumber,
      totalInMicrounits,
      taxSummary,
      paymentMethods: payments.map(p => p.method),
      timestamp: Date.now(),
    };

    const seal = await FiscalSealer.sealDataAtomically(
      JSON.stringify(sealData),
      tenantId,
      false,
      { id: journalEntryId, totalInMicrounits, orderId }
    );

    logger.info(`[POS-SEAL-E2E] Order ${orderId} sealed with hash ${seal.hash} and JE ${journalEntryId}`);

    return {
      orderId,
      ticketNumber,
      totalInMicrounits,
      taxSummary,
      isFullyPaid,
      seal,
      journalEntryId,
      sealedAt: Date.now(),
    };
  }
}

