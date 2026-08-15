import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export interface RecipeIngredientPortion {
  ingredientId: string;
  name: string;
  unit: string;
  quantityPerPortion: number; // e.g. 0.180 kg pour 1 burger
}

export interface DishRecipe {
  productId: string;
  productName: string;
  ingredients: RecipeIngredientPortion[];
}

export interface SoldDishCount {
  productId: string;
  quantitySold: number;
}

export interface ActualIngredientUsage {
  ingredientId: string;
  actualQuantityUsed: number; // Constaté lors de l'inventaire
  unitCostInMicrounits: number; // Coût unitaire par kg/litre/pièce
}

export interface IngredientVarianceAnomaly {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  theoreticalQuantity: number;
  actualQuantity: number;
  varianceQuantity: number; // Positif si sur-consommation / perte
  variancePercent: number;
  financialLossInMicrounits: number;
  severity: 'NOMINAL' | 'MODERATE_SHRINKAGE' | 'CRITICAL_LEAK';
  anomalyHypothesis?: 'OVER_PORTIONING' | 'THEFT_OR_UNRECORDED_WASTE' | 'RECIPE_YIELD_DRIFT' | 'INVENTORY_COUNT_ERROR';
}

export interface RecipeWasteAnalysisResult {
  tenantId: string;
  period: string;
  totalFinancialLossInMicrounits: number;
  anomaliesDetectedCount: number;
  criticalLeakCount: number;
  ingredientReports: IngredientVarianceAnomaly[];
  recommendations: string[];
}

/**
 * 🥩 RecipeWasteAnomalyDetector — Intelligence & Anti-Gaspillage
 * Détection des écarts de Food Cost, coulage et sur-portionnage en cuisine (Théorique vs Réel).
 */
export class RecipeWasteAnomalyDetector {
  /**
   * Compare la consommation théorique d'après les ventes aux consommations réelles d'inventaire.
   */
  static async analyzeTheoreticalVsActualWaste(
    tenantId: string,
    period: string,
    recipes: DishRecipe[],
    sales: SoldDishCount[],
    actualUsage: ActualIngredientUsage[]
  ): Promise<RecipeWasteAnalysisResult> {
    const theoreticalMap = new Map<string, { name: string; unit: string; total: number }>();

    // 1. Calcul de la consommation théorique basée sur les recettes
    for (const sale of sales) {
      const recipe = recipes.find((r) => r.productId === sale.productId);
      if (!recipe) continue;

      for (const ing of recipe.ingredients) {
        const existing = theoreticalMap.get(ing.ingredientId) || {
          name: ing.name,
          unit: ing.unit,
          total: 0,
        };
        existing.total += ing.quantityPerPortion * sale.quantitySold;
        theoreticalMap.set(ing.ingredientId, existing);
      }
    }

    let totalFinancialLoss = 0;
    let anomaliesCount = 0;
    let criticalCount = 0;
    const ingredientReports: IngredientVarianceAnomaly[] = [];

    // 2. Confrontation avec le stock réel consommé
    for (const actual of actualUsage) {
      const theo = theoreticalMap.get(actual.ingredientId);
      const theoreticalQty = theo ? Number(theo.total.toFixed(3)) : 0;
      const actualQty = Number(actual.actualQuantityUsed.toFixed(3));
      const varianceQty = Number((actualQty - theoreticalQty).toFixed(3));

      const variancePercent =
        theoreticalQty > 0
          ? Number(((varianceQty / theoreticalQty) * 100).toFixed(1))
          : actualQty > 0
          ? 100
          : 0;

      const lossInMicrounits =
        varianceQty > 0 ? Math.round(varianceQty * actual.unitCostInMicrounits) : 0;

      let severity: IngredientVarianceAnomaly['severity'] = 'NOMINAL';
      let hypothesis: IngredientVarianceAnomaly['anomalyHypothesis'] = undefined;

      if (variancePercent >= 20 || lossInMicrounits >= 40000000) {
        // Dérive critique : > 20% ou > 40 € de perte
        severity = 'CRITICAL_LEAK';
        criticalCount++;
        anomaliesCount++;
        hypothesis = variancePercent > 40 ? 'THEFT_OR_UNRECORDED_WASTE' : 'OVER_PORTIONING';
      } else if (variancePercent >= 8 || lossInMicrounits >= 15000000) {
        severity = 'MODERATE_SHRINKAGE';
        anomaliesCount++;
        hypothesis = 'RECIPE_YIELD_DRIFT';
      }

      if (lossInMicrounits > 0) {
        totalFinancialLoss += lossInMicrounits;
      }

      const report: IngredientVarianceAnomaly = {
        ingredientId: actual.ingredientId,
        ingredientName: theo?.name || actual.ingredientId,
        unit: theo?.unit || 'kg',
        theoreticalQuantity: theoreticalQty,
        actualQuantity: actualQty,
        varianceQuantity: varianceQty,
        variancePercent,
        financialLossInMicrounits: lossInMicrounits,
        severity,
        anomalyHypothesis: hypothesis,
      };

      ingredientReports.push(report);

      // Émission d'alerte si coulage critique détecté
      if (severity === 'CRITICAL_LEAK') {
        await NexusEventBus.emit('facility.hardware_fault', {
          v: 1,
          tenantId,
          deviceId: `stock-detector-${actual.ingredientId}`,
          faultCode: 'SENSOR_OFFLINE',
          severity: 'critical',
          message: `Coulage critique détecté sur ingrédient ${actual.ingredientId}`,
          timestamp: new Date().toISOString(),
        } as never);
      }
    }

    const recommendations: string[] = [];
    if (criticalCount > 0) {
      recommendations.push(
        `${criticalCount} ingrédient(s) en perte critique détecté(s). Recalibrer les balances de pesée et vérifier les fiches techniques en cuisine.`
      );
    }

    empireAudit.log({
      module: 'intelligence',
      action: 'RECIPE_WASTE_ANALYSIS_PERFORMED',
      details: {
        period,
        anomaliesCount,
        criticalCount,
        totalLossInMicrounits: totalFinancialLoss,
      },
      severity: criticalCount > 0 ? 'high' : 'low',
      timestamp: new Date(),
    });

    logger.info(`[WasteDetector] Analyse ${period} terminée : ${anomaliesCount} anomalies, perte totale: ${(totalFinancialLoss / 1000000).toFixed(2)}€`);

    return {
      tenantId,
      period,
      totalFinancialLossInMicrounits: totalFinancialLoss,
      anomaliesDetectedCount: anomaliesCount,
      criticalLeakCount: criticalCount,
      ingredientReports,
      recommendations,
    };
  }
}
