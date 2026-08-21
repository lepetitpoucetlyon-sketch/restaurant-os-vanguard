import { describe, it, expect } from 'vitest';
import {
  PLATFORM_VARIANTS,
  PlatformVariantSchema,
  VERTICAL_META,
  TenantThemeSchema,
  OrchestratorSignalSchema,
} from '@/modules/system/domain/schemas/tenant';
import { ModuleSchema } from '@/modules/system/domain/schemas/modules';
import { SupportTicketSchema } from '@/modules/system/domain/schemas/supportTicket';
import { LicenseSchema } from '@/modules/system/domain/schemas/license';

describe('⚙️ Système, Configuration & Infrastructure — Couverture 100%', () => {
  describe('1. Platform Variants & Vertical Meta Matrix', () => {
    it('doit valider toutes les variantes de plateforme de l’écosystème', () => {
      expect(PLATFORM_VARIANTS).toHaveLength(12);

      for (const variant of PLATFORM_VARIANTS) {
        expect(PlatformVariantSchema.safeParse(variant).success).toBe(true);
        expect(VERTICAL_META[variant]).toBeDefined();
        expect(VERTICAL_META[variant].emoji).toBeDefined();
        expect(VERTICAL_META[variant].label).toBeDefined();
      }
    });

    it('doit rejeter une variante invalide', () => {
      expect(PlatformVariantSchema.safeParse('spaceship_station').success).toBe(false);
    });
  });

  describe('2. TenantThemeSchema & White-Label Validation', () => {
    it('doit valider un thème de marque complet', () => {
      const validTheme = {
        primaryColor: '#6366F1',
        secondaryColor: '#4F46E5',
        logoUrl: 'https://cdn.restaurant-os.com/logo.svg',
        borderRadius: '8px',
        appearance: 'dark' as const,
      };

      const parsed = TenantThemeSchema.parse(validTheme);
      expect(parsed.primaryColor).toBe('#6366F1');
      expect(parsed.appearance).toBe('dark');
    });

    it('doit rejeter une apparence non reconnue', () => {
      const invalid = {
        primaryColor: '#000',
        secondaryColor: '#111',
        logoUrl: 'https://cdn.example.com/logo.png',
        borderRadius: '4px',
        appearance: 'sepia',
      };

      expect(TenantThemeSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('3. Orchestrator Signal Schema & Kill-Switch', () => {
    it('doit valider un signal dorchestrateur valide', () => {
      const signal = {
        maintenanceMode: false,
        killSwitch: false,
        licenceStatus: 'ACTIVE' as const,
        layoutType: 'default' as const,
        updatedAt: new Date().toISOString(),
        economy: {
          basePrice: 9900,
          currency: 'EUR',
          billingStatus: 'PAID',
        },
        businessLaws: {
          node_capacity: 50,
          fiscal_coefficient: 1.0,
          currency: 'EUR',
          pmsEnabled: false,
        },
      };

      const parsed = OrchestratorSignalSchema.parse(signal);
      expect(parsed.licenceStatus).toBe('ACTIVE');
      expect(parsed.killSwitch).toBe(false);
    });
  });

  describe('4. Module Schema & Feature Flags', () => {
    it('doit valider la structure d’activation modulaire', () => {
      const moduleItem = {
        id: 'mod_pos_advanced',
        name: 'POS Avancé & NF525',
        isActive: true,
        config: {
          enableCashDrawer: true,
          offlineSyncIntervalSeconds: 30,
        },
      };

      const parsed = ModuleSchema.parse(moduleItem);
      expect(parsed.id).toBe('mod_pos_advanced');
      expect(parsed.isActive).toBe(true);
      expect(parsed.schemaVersion).toBe(2);
    });
  });

  describe('5. License & Support Tickets', () => {
    it('doit valider un ticket de support système', () => {
      const ticket = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        tenantId: 'tenant-lyon',
        source: 'tenant_submission' as const,
        description: 'Impossible dimprimer sur le poste chaud',
        status: 'new' as const,
        createdBy: 'user-manager-1',
        createdAt: new Date().toISOString(),
        diagnostic: {
          severity: 'high' as const,
          category: 'HARDWARE',
          probableCause: 'Imprimante hors-ligne',
          recommendedFix: 'Redémarrer le boîtier réseau',
          escalate: false,
        },
      };

      const parsed = SupportTicketSchema.parse(ticket);
      expect(parsed.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(parsed.diagnostic?.severity).toBe('high');
      expect(parsed.status).toBe('new');
    });

    it('doit valider une licence système', () => {
      const license = {
        id: 'lic-001',
        tenantId: 'tenant-paris',
        type: 'licence_restaurant' as const,
        name: 'Grande Licence Restaurant',
        licenseNumber: 'LIC-75-99201',
        status: 'active' as const,
        deliveredAt: '2024-01-01',
        expiresAt: '2029-01-01',
      };

      const parsed = LicenseSchema.parse(license);
      expect(parsed.type).toBe('licence_restaurant');
      expect(parsed.name).toBe('Grande Licence Restaurant');
      expect(parsed.status).toBe('active');
    });
  });
});
