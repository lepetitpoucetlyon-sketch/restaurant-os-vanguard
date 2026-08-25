import { logger } from '@/lib/logger';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface ProcurementPredictionInput {
  productId: string;
  currentStockQty: number;
  safetyStockQty: number;
  expectedCoversJ7: number;
  ingredientGrammagePerCover: number;
  weatherForecastTempCelsius?: number; // e.g. 28°C
}

export interface RecommendedOrder {
  productId: string;
  recommendedQty: number;
  reason: string;
}

/**
 * 📦 PredictiveProcurementEngine (Item 3.1 — DF-J5)
 * Moteur IA de recommandation d'achats prédictifs.
 * Calcule la quantité exacte à commander à J+7 en croisant les réservations prévisionnelles,
 * le grammage fiche technique et un ajustement météo (+15% si > 25°C par défaut).
 */
export class PredictiveProcurementEngine {
  static calculateRecommendation(input: ProcurementPredictionInput): RecommendedOrder {
    const baseUsage = input.expectedCoversJ7 * input.ingredientGrammagePerCover;
    let weatherMultiplier = 1.0;

    const thresholdTemp = getSetting<number>('inventory', 'weather_procurement_temp_c', 25);
    const boostPct = getSetting<number>('inventory', 'weather_procurement_boost_pct', 15) / 100;

    if (input.weatherForecastTempCelsius && input.weatherForecastTempCelsius > thresholdTemp) {
      weatherMultiplier = 1.0 + boostPct; // Augmentation de consommation estimée par forte chaleur
    }

    const projectedConsumption = baseUsage * weatherMultiplier;
    const requiredTotal = projectedConsumption + input.safetyStockQty;
    const rawToOrder = requiredTotal - input.currentStockQty;
    const recommendedQty = Math.max(0, Math.ceil(rawToOrder));

    logger.info(`[PredictiveProcurementEngine] Produit ${input.productId} -> Rec: ${recommendedQty} (Stock: ${input.currentStockQty}, Résas: ${input.expectedCoversJ7})`);

    return {
      productId: input.productId,
      recommendedQty,
      reason: `Besoin J+7: ${baseUsage}u (Météo coef: ${weatherMultiplier}x, Stock sécu: ${input.safetyStockQty}u)`,
    };
  }
}
