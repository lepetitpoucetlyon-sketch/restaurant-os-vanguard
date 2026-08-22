import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface RfaVolumeTier {
  minAnnualSpendInMicrounits: number; // ex: 50 000 € (50_000_000_000)
  maxAnnualSpendInMicrounits: number; // ex: 100 000 €
  rebatePct: number; // ex: 3.0 %
}

export interface SupplierRfaContract {
  supplierId: string;
  supplierName: string;
  periodYear: number;
  tiers: RfaVolumeTier[];
}

export interface RfaCalculationResult {
  supplierId: string;
  periodYear: number;
  totalAnnualSpendInMicrounits: number;
  effectiveRebatePct: number;
  rfaDueInMicrounits: number;
  accountingAccountCode: string; // Compte 609 "Rabais, remises et ristournes obtenus sur achats"
}

/**
 * RfaContractCalculationService — Angle mort H2.
 * Calcul des Remises Fin d'Année (RFA) fournisseurs sur barèmes volumétriques contractuels et imputation sur le compte 609.
 */
export class RfaContractCalculationService {
  static computeRfa(
    tenantId: string,
    contract: SupplierRfaContract,
    totalAnnualSpendInMicrounits: number
  ): RfaCalculationResult {
    let effectiveRebatePct = 0;

    for (const tier of contract.tiers) {
      if (totalAnnualSpendInMicrounits >= tier.minAnnualSpendInMicrounits) {
        effectiveRebatePct = Math.max(effectiveRebatePct, tier.rebatePct);
      }
    }

    const rfaDueInMicrounits = Math.round((totalAnnualSpendInMicrounits * effectiveRebatePct) / 100);

    NexusEventBus.emit('stock.rfa_computed', {
      v: 1,
      tenantId,
      supplierId: contract.supplierId,
      periodYear: contract.periodYear,
      totalAnnualSpendInMicrounits,
      rfaDueInMicrounits,
      computedAt: Date.now(),
    });

    return {
      supplierId: contract.supplierId,
      periodYear: contract.periodYear,
      totalAnnualSpendInMicrounits,
      effectiveRebatePct,
      rfaDueInMicrounits,
      accountingAccountCode: '609000',
    };
  }
}
