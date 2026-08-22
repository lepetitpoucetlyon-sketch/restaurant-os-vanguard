import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface VariableWeightReception {
  sku: string;
  lotId: string;
  productName: string;
  grossWeightGrams: number;
  tareGrams: number;
  netWeightGrams: number;
  usableWeightGrams: number; // Après parage / écaillage
  billedUnitPricePerKgInMicrounits: number;
}

export interface VariableWeightYieldAnalysis {
  sku: string;
  lotId: string;
  totalCostInMicrounits: number;
  parageLossGrams: number;
  yieldPct: number;
  effectiveCostPerUsableKgInMicrounits: number;
}

/**
 * VariableWeightStockService — Angle mort L28.
 * Gestion fine des denrées à poids variable (poissons entiers, carcasses, pièces nobles) avec calcul automatique du rendement matière après parage.
 */
export class VariableWeightStockService {
  static evaluateYield(tenantId: string, item: VariableWeightReception): VariableWeightYieldAnalysis {
    const netWeightKg = item.netWeightGrams / 1000;
    const totalCostInMicrounits = Math.round(netWeightKg * item.billedUnitPricePerKgInMicrounits);

    const parageLossGrams = Math.max(0, item.netWeightGrams - item.usableWeightGrams);
    const yieldPct = item.netWeightGrams > 0
      ? Math.round((item.usableWeightGrams / item.netWeightGrams) * 1000) / 10
      : 0;

    const usableKg = item.usableWeightGrams / 1000;
    const effectiveCostPerUsableKgInMicrounits = usableKg > 0
      ? Math.round(totalCostInMicrounits / usableKg)
      : item.billedUnitPricePerKgInMicrounits;

    NexusEventBus.emit('stock.variable_weight_recorded', {
      v: 1,
      tenantId,
      sku: item.sku,
      lotId: item.lotId,
      grossWeightGrams: item.grossWeightGrams,
      netWeightGrams: item.netWeightGrams,
      yieldPct,
      recordedAt: Date.now(),
    });

    return {
      sku: item.sku,
      lotId: item.lotId,
      totalCostInMicrounits,
      parageLossGrams,
      yieldPct,
      effectiveCostPerUsableKgInMicrounits,
    };
  }
}
