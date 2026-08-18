/**
 * RfaContractService.ts
 * 
 * Moteur de calcul et de suivi en temps réel des RFA (Remises de Fin d'Année) et contrats brasseurs.
 * Invariants :
 * - Calculs stricts en centimes entiers (zéro flottant).
 * - Paliers cumulatifs et barèmes de restitution annuelle.
 */

import type {
  RfaContractEntity,
  RfaProjectionResult,
} from './RfaContractTypes';

export class RfaContractService {
  /**
   * Calcule l'état actuel des remises acquises et la projection vers le palier supérieur.
   */
  public static calculateRfaProjection(contract: RfaContractEntity): RfaProjectionResult {
    // Trier les paliers par seuil de volume croissant
    const sortedTiers = [...contract.tiers].sort(
      (a, b) => a.thresholdVolumeCts - b.thresholdVolumeCts
    );

    let currentTierIndex = -1;
    let currentRebateRatePct = 0;

    for (let i = 0; i < sortedTiers.length; i++) {
      if (contract.cumulativePurchasesHtCts >= sortedTiers[i].thresholdVolumeCts) {
        currentTierIndex = i;
        currentRebateRatePct = sortedTiers[i].rebateRatePct;
      }
    }

    // Remise acquise sur le CA global = CA * Taux
    const currentEarnedRebateCts = Math.round(
      (contract.cumulativePurchasesHtCts * currentRebateRatePct) / 100
    );

    // Palier suivant
    let nextTier: RfaProjectionResult['nextTier'] | undefined;
    const nextIndex = currentTierIndex + 1;
    if (nextIndex < sortedTiers.length) {
      const next = sortedTiers[nextIndex];
      const remainingVolumeToReachCts = Math.max(
        0,
        next.thresholdVolumeCts - contract.cumulativePurchasesHtCts
      );
      const projectedTotalAtNextTierCts = Math.round(
        (next.thresholdVolumeCts * next.rebateRatePct) / 100
      );
      const additionalGainCts = projectedTotalAtNextTierCts - currentEarnedRebateCts;

      nextTier = {
        thresholdVolumeCts: next.thresholdVolumeCts,
        rebateRatePct: next.rebateRatePct,
        remainingVolumeToReachCts,
        additionalGainCts,
      };
    }

    // Calcul remises brasseurs (fûts de bière)
    let brewerRebateTotalCts = 0;
    if (contract.brewerKegCommitments && contract.brewerKegCommitments.length > 0) {
      for (const kegCommitment of contract.brewerKegCommitments) {
        brewerRebateTotalCts +=
          kegCommitment.achievedKegsCount * kegCommitment.rebatePerKegCts;
      }
    }

    const totalProjectedRebateCts = currentEarnedRebateCts + brewerRebateTotalCts;

    return {
      currentTierIndex,
      currentRebateRatePct,
      currentEarnedRebateCts,
      nextTier,
      brewerRebateTotalCts,
      totalProjectedRebateCts,
    };
  }

  /**
   * Enregistre une nouvelle facture d'achat et met à jour le volume cumulé.
   */
  public static recordPurchaseInvoice(
    contract: RfaContractEntity,
    invoiceAmountHtCts: number,
    kegDeliveries?: Array<{ brandName: string; kegsCount: number }>
  ): {
    updatedContract: RfaContractEntity;
    previousProjection: RfaProjectionResult;
    newProjection: RfaProjectionResult;
    hasCrossedNewTier: boolean;
  } {
    const previousProjection = this.calculateRfaProjection(contract);

    const updatedKegs = contract.brewerKegCommitments
      ? [...contract.brewerKegCommitments]
      : [];

    if (kegDeliveries && kegDeliveries.length > 0) {
      for (const del of kegDeliveries) {
        const idx = updatedKegs.findIndex((k) => k.brandName === del.brandName);
        if (idx >= 0) {
          updatedKegs[idx] = {
            ...updatedKegs[idx],
            achievedKegsCount: updatedKegs[idx].achievedKegsCount + del.kegsCount,
          };
        }
      }
    }

    const updatedContract: RfaContractEntity = {
      ...contract,
      cumulativePurchasesHtCts: contract.cumulativePurchasesHtCts + invoiceAmountHtCts,
      brewerKegCommitments: updatedKegs,
      updatedAt: Date.now(),
    };

    const newProjection = this.calculateRfaProjection(updatedContract);
    const hasCrossedNewTier =
      newProjection.currentTierIndex > previousProjection.currentTierIndex;

    return {
      updatedContract,
      previousProjection,
      newProjection,
      hasCrossedNewTier,
    };
  }
}
