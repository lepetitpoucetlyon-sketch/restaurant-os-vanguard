import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RestaurantOnboardingMasterService,
  RESTAURANT_ONBOARDING_PILLARS_DEFINITION,
} from '@/modules/commerce/acquisition/onboarding/services/RestaurantOnboardingMasterService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('Audit & Checklist de Mise en Service Restaurant OS (10 Piliers)', () => {
  const tenantId = 'bistrot-etoile-paris';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait contenir exactement les 10 piliers opérationnels indispensables', () => {
    expect(RESTAURANT_ONBOARDING_PILLARS_DEFINITION).toHaveLength(10);

    const categories = RESTAURANT_ONBOARDING_PILLARS_DEFINITION.map((s) => s.category);
    expect(categories).toContain('LEGAL_IDENTITY');
    expect(categories).toContain('SPACES');
    expect(categories).toContain('COMMERCE');
    expect(categories).toContain('HR');
    expect(categories).toContain('FINANCE');
    expect(categories).toContain('FACILITY');
    expect(categories).toContain('HARDWARE');
    expect(categories).toContain('COMPLIANCE');
    expect(categories).toContain('LOGISTICS');
    expect(categories).toContain('CRM');
  });

  it('devrait calculer un audit complet à 0% lorsque le restaurant est vierge', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(null);
    vi.spyOn(Nexus.adapter, 'query').mockResolvedValue([]);

    const summary = await RestaurantOnboardingMasterService.auditOnboarding(tenantId);

    expect(summary.tenantId).toBe(tenantId);
    expect(summary.totalStepsCount).toBe(10);
    expect(summary.completedStepsCount).toBe(0);
    expect(summary.overallProgressPercent).toBe(0);
    expect(summary.isLaunchReady).toBe(false);
  });

  it('devrait valider les étapes renseignées et passer isLaunchReady à true quand les obligatoires sont faites', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      if (path.includes('settings/identity')) return { siret: '12345678900012', name: 'Bistrot Étoile' };
      return null;
    });

    vi.spyOn(Nexus.adapter, 'query').mockImplementation(async (path: string) => {
      if (path.includes('tables')) return [{ id: 't1' }, { id: 't2' }];
      if (path.includes('products')) return [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
      if (path.includes('users')) return [{ id: 'u1' }, { id: 'u2' }];
      if (path.includes('bank_connections')) return [{ id: 'bank_1' }];
      if (path.includes('hardware_commissions')) return [{ id: 'hw_1' }];
      if (path.includes('erp_safety_items')) return [{ id: 'erp_1' }];
      if (path.includes('equipmentAssets')) return [{ id: 'eq_1' }];
      return [];
    });

    const summary = await RestaurantOnboardingMasterService.auditOnboarding(tenantId);

    // Les 7 étapes obligatoires sont remplies (Identity, Tables, Menu, Team, Banking, Hardware, Legal ERP)
    expect(summary.mandatoryCompletedCount).toBe(summary.mandatoryTotalCount);
    expect(summary.isLaunchReady).toBe(true);
    expect(summary.overallProgressPercent).toBeGreaterThanOrEqual(70);
  });

  it('devrait appliquer le filtrage RBAC pour chaque étape', () => {
    // Étape Directeur (Banque, Identité, Registres)
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('serveur', 'directeur')).toBe(false);
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('manager', 'directeur')).toBe(false);
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('directeur', 'directeur')).toBe(true);
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('admin', 'directeur')).toBe(true);
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('super_admin', 'directeur')).toBe(true);

    // Étape Manager (Menu, Plan de salle, Équipe, Matériel)
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('serveur', 'manager')).toBe(false);
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('manager', 'manager')).toBe(true);
    expect(RestaurantOnboardingMasterService.isAuthorizedForStep('directeur', 'manager')).toBe(true);
  });
});
