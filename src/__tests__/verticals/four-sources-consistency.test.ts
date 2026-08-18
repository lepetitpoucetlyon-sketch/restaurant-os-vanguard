import { describe, it, expect } from 'vitest';
import { getAllBlueprintSlugs } from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';
import { PlatformVariantSchema, PLATFORM_VARIANTS, VERTICAL_META } from '@/modules/system/domain/schemas/tenant';
import { DNA_REGISTRY, resolveDNA } from '@/shared/seeds';

describe('V2-VERT-01: Four Sources Consistency (ADR-004)', () => {
  it('PlatformVariant enum matches VerticalBlueprintRegistry slugs', () => {
    const registrySlugs = getAllBlueprintSlugs().sort();
    const schemaOptions = [...PlatformVariantSchema.options].sort();
    expect(schemaOptions).toEqual(registrySlugs);
    expect(schemaOptions).toHaveLength(12);
  });

  it('every PlatformVariant has a distinct DNA in DNA_REGISTRY', () => {
    for (const variant of PLATFORM_VARIANTS) {
      const dna = DNA_REGISTRY[variant];
      expect(dna).toBeDefined();
      expect(dna.variant).toBe(variant);
      expect(dna.capabilities).toBeDefined();
    }
  });

  it('resolveDNA returns dedicated DNA for every variant', () => {
    for (const variant of PLATFORM_VARIANTS) {
      const resolved = resolveDNA(variant);
      expect(resolved).toBeDefined();
      expect(resolved.variant).toBe(variant);
    }
  });

  it('VERTICAL_META covers every platform variant with emoji and label', () => {
    for (const variant of PLATFORM_VARIANTS) {
      expect(VERTICAL_META[variant]).toBeDefined();
      expect(VERTICAL_META[variant].emoji).toBeTruthy();
      expect(VERTICAL_META[variant].label).toBeTruthy();
    }
  });
});
