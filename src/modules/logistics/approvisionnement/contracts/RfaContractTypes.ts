/**
 * RfaContractTypes.ts
 * 
 * Modèle pour le suivi des RFA (Remises de Fin d'Année), BFA (Boni de Fin d'Année) et contrats brasseurs.
 */

export interface RfaTier {
  thresholdVolumeCts: number; // Ex: 10 000,00 € (1 000 000 cts)
  rebateRatePct: number;      // Ex: 3.0%
}

export interface BrewerKegCommitment {
  brandName: string;
  targetKegsCount: number;    // Ex: 200 fûts de 30L / an
  rebatePerKegCts: number;    // Ex: 15,00 € par fût (1500 cts)
  achievedKegsCount: number;
}

export interface RfaContractEntity {
  id: string;
  tenantId: string;
  contractNumber: string;
  supplierId: string;
  supplierName: string;
  year: number; // 2026
  startDateUtc: number;
  endDateUtc: number;
  tiers: RfaTier[];
  brewerKegCommitments?: BrewerKegCommitment[];
  cumulativePurchasesHtCts: number;
  isSettled: boolean;
  settledCreditNoteNumber?: string;
  settledAmountCts?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RfaProjectionResult {
  currentTierIndex: number;
  currentRebateRatePct: number;
  currentEarnedRebateCts: number;
  nextTier?: {
    thresholdVolumeCts: number;
    rebateRatePct: number;
    remainingVolumeToReachCts: number;
    additionalGainCts: number;
  };
  brewerRebateTotalCts: number;
  totalProjectedRebateCts: number;
}
