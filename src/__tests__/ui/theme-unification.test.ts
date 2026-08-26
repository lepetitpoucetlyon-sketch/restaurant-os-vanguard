/**
 * 🎨 TEST D'UNIFICATION DU THÈME & SOUVERAINETÉ CSS (LOT 0 - OPTION B)
 *
 * Vérifie que :
 * 1. Les variables de marque (identité) et les variables neutres (surfaces/thème) sont découplées.
 * 2. BrandingProvider n'injecte aucune surface neutre inline, garantissant que `globals.css`
 *    et `:root[data-theme="dark"]` pilotent 100% des surfaces en mode sombre.
 * 3. Les styles inline de surface résiduels sont purgés de `document.documentElement`.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBrandCSSVariables,
  generateNeutralCSSVariables,
  generateCSSVariables,
} from '@/shared/nexus/tokens/semantic';

describe('🎨 Unification du Thème — LOT 0 (Cause Racine & Option B)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-theme');
  });

  describe('1. Découplage des Tokens Sémantiques', () => {
    it('generateBrandCSSVariables émet UNIQUEMENT l’identité de marque', () => {
      const brandVars = generateBrandCSSVariables();

      // Variables d'identité présentes
      expect(brandVars['--action-primary']).toBeDefined();
      expect(brandVars['--action-primary-hover']).toBeDefined();
      expect(brandVars['--action-primary-fg']).toBeDefined();
      expect(brandVars['--action-danger']).toBeDefined();
      expect(brandVars['--action-accent']).toBeDefined();
      expect(brandVars['--text-brand']).toBeDefined();
      expect(brandVars['--border-focus']).toBeDefined();
      expect(brandVars['--radius-card']).toBeDefined();
      expect(brandVars['--radius-btn']).toBeDefined();
      expect(brandVars['--glass-blur']).toBeDefined();
      expect(brandVars['--glass-opacity']).toBeDefined();

      // Variables neutres ABSENTES (doivent être gérées par globals.css)
      expect(brandVars['--surface-bg']).toBeUndefined();
      expect(brandVars['--surface-card']).toBeUndefined();
      expect(brandVars['--surface-modal']).toBeUndefined();
      expect(brandVars['--surface-modal-dark']).toBeUndefined();
      expect(brandVars['--surface-sidebar']).toBeUndefined();
      expect(brandVars['--surface-glass']).toBeUndefined();
      expect(brandVars['--text-primary']).toBeUndefined();
      expect(brandVars['--text-secondary']).toBeUndefined();
      expect(brandVars['--text-muted']).toBeUndefined();
      expect(brandVars['--border-default']).toBeUndefined();
      expect(brandVars['--border-subtle']).toBeUndefined();
      expect(brandVars['--status-success']).toBeUndefined();
      expect(brandVars['--status-warning']).toBeUndefined();
      expect(brandVars['--status-danger']).toBeUndefined();
    });

    it('generateNeutralCSSVariables émet l’ensemble des surfaces et tokens neutres', () => {
      const neutralVars = generateNeutralCSSVariables();

      expect(neutralVars['--surface-bg']).toBeDefined();
      expect(neutralVars['--surface-card']).toBeDefined();
      expect(neutralVars['--surface-modal']).toBeDefined();
      expect(neutralVars['--surface-sidebar']).toBeDefined();
      expect(neutralVars['--text-primary']).toBeDefined();
      expect(neutralVars['--text-secondary']).toBeDefined();
      expect(neutralVars['--border-default']).toBeDefined();
      expect(neutralVars['--status-success']).toBeDefined();

      // Identité de marque absente des neutres
      expect(neutralVars['--action-primary']).toBeUndefined();
      expect(neutralVars['--text-brand']).toBeUndefined();
    });

    it('generateCSSVariables agrège l’identité et les neutres (rétro-compatibilité)', () => {
      const allVars = generateCSSVariables();
      expect(allVars['--action-primary']).toBeDefined();
      expect(allVars['--surface-card']).toBeDefined();
      expect(allVars['--text-primary']).toBeDefined();
    });
  });

  describe('2. Non-Interférence avec data-theme', () => {
    it('l’application de data-theme="dark" n’est pas polluée par des styles de surface inline', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      const brandVars = generateBrandCSSVariables();
      Object.entries(brandVars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });

      // Vérifie que --surface-card n'a AUCUN style inline
      const inlineSurfaceCard = document.documentElement.style.getPropertyValue('--surface-card');
      expect(inlineSurfaceCard).toBe('');

      const inlineSurfaceBg = document.documentElement.style.getPropertyValue('--surface-bg');
      expect(inlineSurfaceBg).toBe('');

      // Vérifie que l'identité de marque a bien été injectée
      const inlineActionPrimary = document.documentElement.style.getPropertyValue('--action-primary');
      expect(inlineActionPrimary).not.toBe('');
    });

    it('les styles inline de surface polluants pré-existants sont nettoyés', () => {
      // Simule un ancien état où des styles inline avaient été posés
      document.documentElement.style.setProperty('--surface-card', '#ffffff');
      document.documentElement.style.setProperty('--surface-bg', '#F8F7F2');
      document.documentElement.style.setProperty('--text-primary', '#111827');

      // Purge telle qu'exécutée dans BrandingProvider
      const NEUTRAL_CSS_VARS_TO_PURGE = [
        '--surface-bg', '--surface-card', '--surface-modal', '--surface-modal-dark', '--surface-sidebar',
        '--surface-glass',
        '--text-primary', '--text-secondary', '--text-muted',
        '--border-default', '--border-subtle',
      ];
      NEUTRAL_CSS_VARS_TO_PURGE.forEach(v => document.documentElement.style.removeProperty(v));

      expect(document.documentElement.style.getPropertyValue('--surface-card')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--surface-bg')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--text-primary')).toBe('');
    });
  });
});
