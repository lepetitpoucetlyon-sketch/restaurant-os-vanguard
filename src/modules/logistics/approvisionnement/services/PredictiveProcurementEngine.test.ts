import { describe, it, expect } from 'vitest';
import { PredictiveProcurementEngine } from './PredictiveProcurementEngine';

describe('📦 PredictiveProcurementEngine — Recommandation Achats Prédictifs IA', () => {
  it('devrait calculer la quantité exacte à commander à J+7 en conditions normales', () => {
    const recommendation = PredictiveProcurementEngine.calculateRecommendation({
      productId: 'ing_farine_bio',
      currentStockQty: 20,
      safetyStockQty: 10,
      expectedCoversJ7: 100,
      ingredientGrammagePerCover: 0.25, // 25kg requis
      weatherForecastTempCelsius: 20, // Température normale
    });

    // 100 * 0.25 = 25kg + 10kg sécurité = 35kg total requis - 20kg stock = 15kg à commander
    expect(recommendation.productId).toBe('ing_farine_bio');
    expect(recommendation.recommendedQty).toBe(15);
    expect(recommendation.reason).toContain('coef: 1x');
  });

  it('devrait appliquer une majoration météo de +15% si la température dépasse 25°C', () => {
    const recommendation = PredictiveProcurementEngine.calculateRecommendation({
      productId: 'ing_salade_mesclun',
      currentStockQty: 5,
      safetyStockQty: 5,
      expectedCoversJ7: 100,
      ingredientGrammagePerCover: 0.1, // 10kg de base
      weatherForecastTempCelsius: 29, // Canicule / forte chaleur
    });

    // 10kg * 1.15 = 11.5kg + 5kg sécurité = 16.5kg - 5kg stock = 11.5kg -> arrondi sup = 12
    expect(recommendation.recommendedQty).toBe(12);
    expect(recommendation.reason).toContain('coef: 1.15x');
  });

  it('devrait retourner 0 si le stock actuel couvre largement le besoin prévisionnel', () => {
    const recommendation = PredictiveProcurementEngine.calculateRecommendation({
      productId: 'ing_huile_olive',
      currentStockQty: 100,
      safetyStockQty: 10,
      expectedCoversJ7: 50,
      ingredientGrammagePerCover: 0.05, // 2.5L requis
      weatherForecastTempCelsius: 22,
    });

    expect(recommendation.recommendedQty).toBe(0);
  });
});
