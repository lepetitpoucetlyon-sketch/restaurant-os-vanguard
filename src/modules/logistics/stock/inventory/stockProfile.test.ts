import { describe, it, expect } from 'vitest';
import type { PlatformVariant } from '@nexus/contracts';
import { usesCulinaryStock } from './stockProfile';

describe('usesCulinaryStock (§8.6 — profil de stock par verticale)', () => {
  it('active les overlays culinaires pour restaurant/hotel/bakery', () => {
    expect(usesCulinaryStock('restaurant')).toBe(true);
    expect(usesCulinaryStock('hotel')).toBe(true);
    expect(usesCulinaryStock('bakery')).toBe(true);
  });

  it('les désactive pour les verticales à stock générique', () => {
    const generic: PlatformVariant[] = ['garage', 'salon', 'clinic', 'retail', 'custom'];
    for (const variant of generic) {
      expect(usesCulinaryStock(variant)).toBe(false);
    }
  });

  it('défaut = restaurant (comportement historique préservé)', () => {
    // Un appelant qui ne passe pas de variant garde l'ancien comportement.
    expect(usesCulinaryStock()).toBe(true);
  });
});
