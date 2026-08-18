import { describe, it, expect } from 'vitest';
import { resolveDNA, DNA_REGISTRY, CUSTOM_FULL_DNA, RESTAURANT_FULL_DNA } from '@/shared/seeds';

describe('V1-VERT DNA Registry', () => {
  it('registers custom DNA in DNA_REGISTRY', () => {
    expect(DNA_REGISTRY.custom).toBeDefined();
    expect(DNA_REGISTRY.custom).toBe(CUSTOM_FULL_DNA);
  });

  it('resolveDNA("custom") does NOT fallback to restaurant', () => {
    const dna = resolveDNA('custom');
    expect(dna).toBe(CUSTOM_FULL_DNA);
    expect(dna.variant).toBe('custom');
    expect(dna).not.toBe(RESTAURANT_FULL_DNA);
  });
});
