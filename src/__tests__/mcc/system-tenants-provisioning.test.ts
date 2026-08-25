import { describe, it, expect } from 'vitest';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { getSystemTenantId, isSystemTenant, getSystemTenantTier, isWritable } from '@/lib/mcc/SystemTenantRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('🏛️ System Tenants Provisioning — _test_restaurant, _demo_restaurant & _ref_restaurant (Priorité 1.6)', () => {
  it('correctly maps system tenant identifiers for restaurant', () => {
    expect(getSystemTenantId('restaurant', 'DEMO')).toBe('_demo_restaurant');
    expect(getSystemTenantId('restaurant', 'TEST')).toBe('_test_restaurant');
    expect(getSystemTenantId('restaurant', 'REFERENCE')).toBe('_ref_restaurant');

    expect(isSystemTenant('_demo_restaurant')).toBe(true);
    expect(isSystemTenant('_ref_restaurant')).toBe(true);
    expect(isSystemTenant('_test_restaurant')).toBe(true);
    expect(isSystemTenant('tenant_123456789')).toBe(false);

    expect(getSystemTenantTier('_demo_restaurant')).toBe('DEMO');
    expect(getSystemTenantTier('_test_restaurant')).toBe('TEST');
    expect(getSystemTenantTier('_ref_restaurant')).toBe('REFERENCE');

    expect(isWritable('_test_restaurant')).toBe(true);
    expect(isWritable('_demo_restaurant')).toBe(false);
    expect(isWritable('_ref_restaurant')).toBe(false);
  });

  it('seeds _test_restaurant with complete configuration, PCG and genesis seal', async () => {
    const testTenantId = getSystemTenantId('restaurant', 'TEST');

    const result = await TenantSeeder.seed({
      tenantId: testTenantId,
      name: 'Restaurant Test Lab',
      adminEmail: 'test@restaurant-os.internal',
      variant: 'restaurant',
    });

    expect(result.success).toBe(true);
    expect(result.seededPaths.length).toBeGreaterThan(0);

    const config = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${testTenantId}/tenantConfig`);
    expect(config).toBeDefined();
    expect(config?.variant).toBe('restaurant');

    const genesisSeal = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${testTenantId}/fiscalSeals/genesis`);
    expect(genesisSeal).toBeDefined();
  });

  it('protects _ref_restaurant from direct writes via SovereignGuard', async () => {
    const refTenantId = getSystemTenantId('restaurant', 'REFERENCE');

    const result = await TenantSeeder.seed({
      tenantId: refTenantId,
      name: 'Restaurant OS Reference Master',
      adminEmail: 'master@restaurant-os.internal',
      variant: 'restaurant',
    });

    // Écriture directe rejetée par SovereignGuard
    expect(result.success).toBe(false);
    expect(result.error).toContain('SovereignGuard');
  });
});
