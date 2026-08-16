import { describe, it, expect } from 'vitest';
import { TraceabilityLotManager, LotItem } from './TraceabilityLotManager';

describe('🏷️ TraceabilityLotManager — Traçabilité HACCP & DLC Secondaires', () => {
  it('devrait calculer la DLC secondaire selon la règle Ouverture + 48h (par défaut GBPH)', () => {
    const unsealDate = new Date('2026-08-10T10:00:00.000Z');
    const primaryDate = '2026-08-25T00:00:00.000Z'; // DLC primaire éloignée

    const lot: LotItem = {
      lotId: 'LOT-SAUMON-001',
      productId: 'ing_saumon_fume',
      primaryExpiryDateIso: primaryDate,
      unsealDateIso: unsealDate.toISOString(),
      maxSecondaryHours: 48,
    };

    const result = TraceabilityLotManager.calculateSecondaryDLC(lot);

    // Ouverture 10 août 10h + 48h = 12 août 10h
    expect(result.secondaryExpiryDateIso).toBe('2026-08-12T10:00:00.000Z');
    expect(result.ruleApplied).toContain('48h');
  });

  it('ne doit jamais dépasser la DLC primaire d\'origine si l\'ouverture + délai excède la date initiale', () => {
    const unsealDate = new Date('2026-08-10T10:00:00.000Z');
    const primaryDate = '2026-08-11T12:00:00.000Z'; // DLC primaire dans 26h (< 48h)

    const lot: LotItem = {
      lotId: 'LOT-CREME-002',
      productId: 'ing_creme_liquide',
      primaryExpiryDateIso: primaryDate,
      unsealDateIso: unsealDate.toISOString(),
      maxSecondaryHours: 48,
    };

    const result = TraceabilityLotManager.calculateSecondaryDLC(lot);

    // La DLC secondaire doit être bornée par la DLC primaire d'origine (11 août 12h)
    expect(result.secondaryExpiryDateIso).toBe(primaryDate);
  });

  it('devrait marquer isExpired: true si la DLC calculée est dans le passé', () => {
    const pastUnsealDate = new Date();
    pastUnsealDate.setDate(pastUnsealDate.getDate() - 10);

    const lot: LotItem = {
      lotId: 'LOT-VIANDE-003',
      productId: 'ing_steak_hache',
      primaryExpiryDateIso: new Date(Date.now() + 86400000).toISOString(),
      unsealDateIso: pastUnsealDate.toISOString(),
      maxSecondaryHours: 24, // 24h pour viande hachée
    };

    const result = TraceabilityLotManager.calculateSecondaryDLC(lot);
    expect(result.isExpired).toBe(true);
  });
});
