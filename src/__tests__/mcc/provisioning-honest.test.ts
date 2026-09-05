import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantProvisioningService } from '@/lib/mcc/provisioning/TenantProvisioningService';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { AvailabilityCertificateService } from '@/verticals/_shared/certification/AvailabilityCertificate';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import * as provisioningSteps from '@/lib/mcc/provisioning/steps/provisioningSteps';

describe('🏛️ Honest Provisioning & Availability Certification (Phase 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valide et émet un certificat pour la verticale restaurant de référence', async () => {
    const cert = await AvailabilityCertificateService.validateAvailability('restaurant', 'L3');
    expect(cert.variant).toBe('restaurant');
    expect(cert.tier).toBe('L3');
    expect(cert.certified).toBe(true);
    expect(cert.errors).toEqual([]);
    expect(cert.capabilities.length).toBeGreaterThan(0);
    expect(cert.routesCount).toBeGreaterThan(0);
  });

  it('refuse le provisioning pour une verticale inconnue ou non certifiée', async () => {
    await expect(
      AvailabilityCertificateService.assertProvisioningAllowed('unknown_vertical_fake'),
    ).rejects.toThrow(/Provisioning interdit pour la verticale/);
  });

  it('ne seede AUCUNE table ni plan de salle de restaurant pour un tenant gym ou coworking', async () => {
    const tenantGymId = 'tenant_gym_test_123';
    const seedResult = await TenantSeeder.seed({
      tenantId: tenantGymId,
      name: 'Iron Gym Club',
      adminEmail: 'contact@irongym.fr',
      variant: 'gym',
    });

    expect(seedResult.success).toBe(true);

    // Vérifie qu'aucun étage, zone ou table de restaurant n'a été créé
    const floor = await Nexus.adapter.get(`tenants/${tenantGymId}/floors/floor-rdc`);
    expect(floor).toBeNull();

    const table1 = await Nexus.adapter.get(`tenants/${tenantGymId}/ops_nodes/table-1`);
    expect(table1).toBeNull();

    // Mais la configuration de base et la genèse fiscale existent
    const tenantConfig = await Nexus.adapter.get(`tenants/${tenantGymId}/tenantConfig`);
    expect(tenantConfig).toBeDefined();

    const genesisSeal = await Nexus.adapter.get(`tenants/${tenantGymId}/fiscalSeals/GENESIS`);
    expect(genesisSeal).toBeDefined();
  });

  it('seede le plan de salle complet pour un tenant restaurant', async () => {
    const tenantRestoId = 'tenant_resto_test_456';
    const seedResult = await TenantSeeder.seed({
      tenantId: tenantRestoId,
      name: 'Le Grand Bistro',
      adminEmail: 'chef@legrandbistro.fr',
      variant: 'restaurant',
    });

    expect(seedResult.success).toBe(true);

    const floor = await Nexus.adapter.get(`tenants/${tenantRestoId}/floors/floor-rdc`);
    expect(floor).toBeDefined();

    const table1 = await Nexus.adapter.get(`tenants/${tenantRestoId}/ops_nodes/table-1`);
    expect(table1).toBeDefined();
  });

  it('enregistre fidèlement la machine à états de provisioning dans Nexus', async () => {
    vi.spyOn(provisioningSteps, 'setupStripeCustomer').mockResolvedValue('cus_mock_123');
    vi.spyOn(provisioningSteps, 'setupFleetTelemetry').mockResolvedValue(undefined);
    vi.spyOn(provisioningSteps, 'setupRAGWorkspace').mockResolvedValue(undefined);
    vi.spyOn(provisioningSteps, 'setupOwnerAccount').mockResolvedValue(undefined);

    const request = {
      companyName: 'Bistro Certifié',
      ownerName: 'Jean Dupont',
      ownerEmail: 'owner@bistro-certifie.fr',
      siret: '80090010000012',
      planId: 'STANDARD' as const,
      variant: 'restaurant' as const,
      branding: {
        mode: 'default' as const,
        primaryColor: '#C5A059',
      },
    };

    const result = await TenantProvisioningService.provisionNewClient(request);
    expect(result.status).toBe('SUCCESS');

    const statusRecord = await Nexus.adapter.get<any>(`tenants/${result.tenantId}/provisioning_status`);
    expect(statusRecord).toBeDefined();
    expect(statusRecord.status).toBe('ready');
    expect(statusRecord.variant).toBe('restaurant');
  });
});
