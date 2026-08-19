import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BAKERY_BLUEPRINT } from '@/verticals/bakery/bakery.blueprint';
import { RETAIL_BLUEPRINT } from '@/verticals/retail/retail.blueprint';
import { SALON_BLUEPRINT } from '@/verticals/salon/salon.blueprint';
import { BakeryVertical } from '@/verticals/bakery/BakeryVertical';
import { RetailVertical } from '@/verticals/retail/RetailVertical';
import { SalonVertical } from '@/verticals/salon/SalonVertical';

describe('🥖 🛍️ 💇 H3 Expansion Verticals — Bakery, Retail & Salon', () => {
  const mockNexusContext = {
    tenantId: 'tenant_test_h3',
    registerRoute: vi.fn(),
    registerEventHandler: vi.fn(),
    getRegisteredRoutes: vi.fn(() => []),
    getRegisteredEventHandlers: vi.fn(() => []),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Bakery Vertical (Profil A — Food & Périssable)', () => {
    it('devrait respecter le blueprint et les capabilities boulangerie', () => {
      expect(BAKERY_BLUEPRINT.slug).toBe('bakery');
      expect(BAKERY_BLUEPRINT.profile).toBe('A');
      expect(BAKERY_BLUEPRINT.capabilities.mod_haccp).toBe(true);
      expect(BAKERY_BLUEPRINT.capabilities.mod_kitchen_management).toBe(true);
      expect(BAKERY_BLUEPRINT.tokens.verticalTokens['--batch-in-oven']).toBeDefined();
    });

    it('devrait initialiser et détruire BakeryVertical proprement', async () => {
      const vertical = new BakeryVertical();
      expect(vertical.id).toBe('bakery');
      expect(vertical.version).toBe('1.0.0');
      await vertical.initialize(mockNexusContext as never);
      expect(mockNexusContext.registerRoute).toHaveBeenCalled();
      expect(mockNexusContext.registerEventHandler).toHaveBeenCalled();
      await expect(vertical.destroy()).resolves.toBeUndefined();
    });
  });

  describe('2. Retail Vertical (Profil D — Retail & Variantes)', () => {
    it('devrait respecter le blueprint et les capabilities commerce de détail', () => {
      expect(RETAIL_BLUEPRINT.slug).toBe('retail');
      expect(RETAIL_BLUEPRINT.profile).toBe('D');
      expect(RETAIL_BLUEPRINT.tokens.verticalTokens).toBeDefined();
    });

    it('devrait initialiser et détruire RetailVertical proprement', async () => {
      const vertical = new RetailVertical();
      expect(vertical.id).toBe('retail');
      expect(vertical.version).toBe('1.0.0');
      await vertical.initialize(mockNexusContext as never);
      expect(mockNexusContext.registerRoute).toHaveBeenCalled();
      await expect(vertical.destroy()).resolves.toBeUndefined();
    });
  });

  describe('3. Salon Vertical (Profil B — Rendez-vous & Espace)', () => {
    it('devrait respecter le blueprint et les capabilities coiffure / esthétique', () => {
      expect(SALON_BLUEPRINT.slug).toBe('salon');
      expect(SALON_BLUEPRINT.profile).toBe('B');
      expect(SALON_BLUEPRINT.tokens.verticalTokens['--chair-available']).toBeDefined();
    });

    it('devrait initialiser et détruire SalonVertical proprement', async () => {
      const vertical = new SalonVertical();
      expect(vertical.id).toBe('salon');
      expect(vertical.version).toBe('1.0.0');
      await vertical.initialize(mockNexusContext as never);
      expect(mockNexusContext.registerRoute).toHaveBeenCalled();
      await expect(vertical.destroy()).resolves.toBeUndefined();
    });
  });
});
