import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface BottleWeighingEntry {
  productId: string;
  productName: string;
  tareWeightGrams: number; // Poids de la bouteille vide
  fullNetVolumeCl: number; // Volume total neuf (ex: 70 cl)
  densityGramsPerCl: number; // Masse volumique (alcool ~0.95 g/cl, liqueur ~1.15 g/cl)
  currentGrossWeightGrams: number; // Poids pesé brut sur balance
  billedDosesCl: number; // Total doses vendues enregistrées en caisse
  costPerClInMicrounits: number;
}

export interface BottleInventoryEvaluation {
  productId: string;
  productName: string;
  calculatedRemainingCl: number;
  expectedRemainingCl: number;
  varianceCl: number; // >0 excédent, <0 perte/coulage
  varianceInMicrounits: number;
  variancePct: number;
}

export interface FlashInventorySummary {
  tenantId: string;
  bottleCount: number;
  totalVarianceCl: number;
  totalLossInMicrounits: number;
  evaluations: BottleInventoryEvaluation[];
  recordedAt: number;
}

/**
 * FlashAlcoholInventoryService — Angle mort L15.
 * Inventaire flash quotidien bar : pesée de précision des alcools au gramme, déduction de la tare et calcul du coulage.
 */
export class FlashAlcoholInventoryService {
  static evaluateInventory(
    tenantId: string,
    adminId: string,
    entries: BottleWeighingEntry[]
  ): FlashInventorySummary {
    const evaluations: BottleInventoryEvaluation[] = [];
    let totalVarianceCl = 0;
    let totalLossInMicrounits = 0;

    for (const entry of entries) {
      const netLiquidWeightGrams = Math.max(0, entry.currentGrossWeightGrams - entry.tareWeightGrams);
      const calculatedRemainingCl = Math.round((netLiquidWeightGrams / entry.densityGramsPerCl) * 10) / 10;
      const expectedRemainingCl = Math.max(0, entry.fullNetVolumeCl - entry.billedDosesCl);

      const varianceCl = Math.round((calculatedRemainingCl - expectedRemainingCl) * 10) / 10;
      const varianceInMicrounits = Math.round(varianceCl * entry.costPerClInMicrounits);
      const variancePct = expectedRemainingCl > 0 ? Math.round((varianceCl / expectedRemainingCl) * 1000) / 10 : 0;

      if (varianceCl < 0) {
        totalLossInMicrounits += Math.abs(varianceInMicrounits);
      }
      totalVarianceCl += varianceCl;

      evaluations.push({
        productId: entry.productId,
        productName: entry.productName,
        calculatedRemainingCl,
        expectedRemainingCl,
        varianceCl,
        varianceInMicrounits,
        variancePct,
      });
    }

    NexusEventBus.emit('bar.flash_inventory_completed', {
      v: 1,
      tenantId,
      bottleCount: entries.length,
      totalVarianceCl,
      varianceInMicrounits: totalLossInMicrounits,
      recordedAt: Date.now(),
    });

    const alertThresholdEur = getSetting<number>('bar', 'alcohol_loss_alert_eur', 10);
    const alertThresholdMicrounits = alertThresholdEur * 1_000_000;

    if (totalLossInMicrounits > alertThresholdMicrounits) {
      AuditLogger.logAction({
        adminId,
        action: 'FLASH_INVENTORY_VARIANCE',
        targetId: `BAR-FLASH-${Date.now()}`,
        ipAddress: '127.0.0.1',
        metadata: {
          totalLossInMicrounits,
          bottleCount: entries.length,
        },
      });
    }

    return {
      tenantId,
      bottleCount: entries.length,
      totalVarianceCl,
      totalLossInMicrounits,
      evaluations,
      recordedAt: Date.now(),
    };
  }
}
