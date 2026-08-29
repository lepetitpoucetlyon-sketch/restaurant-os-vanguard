import { describe, it, expect } from 'vitest';
import {
  DENSITY_SCALES,
  generateDensityCSSVariables,
  resolveDensityFromContext,
  resolveMotionProfile,
  resolveMotionIntensityFromProfile,
} from '@/shared/nexus/tokens';
import { VERTICAL_STYLE_PRESETS } from '@/shared/nexus/tokens/verticals/presets';
import { UXProfileTypeSchema } from '@/shared/nexus/tokens/uxProfile';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BentoGrid, BentoCell } from '@/shared/components/ui/BentoGrid';

describe('Taste-Skill Lot 1 — Infrastructure Design & Tokens', () => {
  describe('Density Tokens & Calibration', () => {
    it('provides valid scales for all 3 density modes', () => {
      expect(DENSITY_SCALES.dense.minTarget).toBe(44);
      expect(DENSITY_SCALES.comfortable.minTarget).toBe(48);
      expect(DENSITY_SCALES.spacious.minTarget).toBe(48);
    });

    it('generates proper CSS variables matching the scale', () => {
      const vars = generateDensityCSSVariables('dense');
      expect(vars['--density-min-target']).toBe('44px');
      expect(vars['--density-gap-sm']).toBe('0.25rem');
      expect(vars['--density-pad-button']).toBe('0.375rem 0.75rem');
    });

    it('resolves density mode accurately by context', () => {
      expect(resolveDensityFromContext('fast_food')).toBe('dense');
      expect(resolveDensityFromContext('dark_kitchen')).toBe('dense');
      expect(resolveDensityFromContext('gastronomic')).toBe('spacious');
      expect(resolveDensityFromContext('custom', 'operations')).toBe('dense');
      expect(resolveDensityFromContext('custom', 'marketing')).toBe('spacious');
      expect(resolveDensityFromContext('bar_nightclub')).toBe('comfortable');
    });
  });

  describe('Motion Tokens & Reduced Motion', () => {
    it('calibrates motion durations and easings by intensity', () => {
      const normalProfile = resolveMotionProfile(5, false);
      expect(normalProfile.prefersReduced).toBe(false);
      expect(normalProfile.duration.normal).toBe(200);
      expect(normalProfile.tapScale).toBe(0.97);

      const highMotion = resolveMotionProfile(8, false);
      expect(highMotion.duration.normal).toBe(260);
      expect(highMotion.pageTransition).toBe('slide');
    });

    it('forces zero-motion when prefersReduced is true (WCAG 2.3.3)', () => {
      const reduced = resolveMotionProfile(8, true);
      expect(reduced.prefersReduced).toBe(true);
      expect(reduced.duration.normal).toBe(0);
      expect(reduced.tapScale).toBe(1);
      expect(reduced.pageTransition).toBe('none');
      expect(reduced.hoverLift).toBe('0px');
    });

    it('maps UX profiles to appropriate motion intensity cadrans', () => {
      expect(resolveMotionIntensityFromProfile('dark_kitchen')).toBe(3);
      expect(resolveMotionIntensityFromProfile('fast_food')).toBe(4);
      expect(resolveMotionIntensityFromProfile('bar_nightclub')).toBe(7);
      expect(resolveMotionIntensityFromProfile('cocktail_bar')).toBe(7);
      expect(resolveMotionIntensityFromProfile('gastronomic')).toBe(5);
    });
  });

  describe('Enriched Restaurant Presets & UXProfile Schema', () => {
    it('contains all 8 restaurant style presets without duplicate IDs', () => {
      const presets = VERTICAL_STYLE_PRESETS.restaurant;
      expect(presets).toHaveLength(8);
      const ids = presets.map((p) => p.id);
      expect(new Set(ids).size).toBe(8);
      expect(ids).toContain('luxe');
      expect(ids).toContain('bistro');
      expect(ids).toContain('moderne');
      expect(ids).toContain('brasserie');
      expect(ids).toContain('cocktail_bar');
      expect(ids).toContain('gastronomique');
      expect(ids).toContain('street_food');
      expect(ids).toContain('dark_kitchen');
    });

    it('validates new UX profile types in schema', () => {
      expect(UXProfileTypeSchema.parse('cocktail_bar')).toBe('cocktail_bar');
      expect(UXProfileTypeSchema.parse('street_food')).toBe('street_food');
      expect(UXProfileTypeSchema.parse('fast_food')).toBe('fast_food');
      expect(() => UXProfileTypeSchema.parse('invalid_preset')).toThrow();
    });
  });

  describe('BentoGrid Component', () => {
    it('renders asymmetric bento grid with cells', () => {
      render(
        <BentoGrid layout="hero-2col">
          <BentoCell span={2}>Hero Content</BentoCell>
          <BentoCell>Regular Content</BentoCell>
        </BentoGrid>
      );

      expect(screen.getByText('Hero Content')).toBeDefined();
      expect(screen.getByText('Regular Content')).toBeDefined();
    });
  });
});
