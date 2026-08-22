import { describe, test, expect } from 'vitest';
import { TaxCalculator } from '@/modules/finance/utils/TaxCalculator';

describe('Chantier 2 : Matrice de Règles Croisées Multi-Verticales (Table-Driven)', () => {
  const verticalMatrix = [
    { vertical: 'restaurant', scenario: 'Vente à emporter', basePriceMicros: 15_000_000, rateString: '0.10', expectedTaxMicros: 1_500_000 },
    { vertical: 'coworking',  scenario: 'Location de bureau privé', basePriceMicros: 25_000_000, rateString: '0.20', expectedTaxMicros: 5_000_000 },
    { vertical: 'gym',        scenario: 'Abonnement mensuel CrossFit', basePriceMicros: 30_000_000, rateString: '0.20', expectedTaxMicros: 6_000_000 },
    { vertical: 'florist',    scenario: 'Bouquet de fleurs coupées', basePriceMicros: 45_000_000, rateString: '0.055', expectedTaxMicros: 2_475_000 },
  ];

  test.each(verticalMatrix)(
    '[$vertical] $scenario: applique un taux de $rateString sur $basePriceMicrosµ',
    ({ basePriceMicros, rateString, expectedTaxMicros }) => {
      const computedTax = TaxCalculator.applyRate(basePriceMicros, rateString);
      expect(computedTax).toBe(expectedTaxMicros);
    }
  );
});