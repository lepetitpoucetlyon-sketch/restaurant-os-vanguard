import { describe, it, expect, beforeEach } from 'vitest';
import { migrateTenantsVariant } from '../../../scripts/migrate-tenants-variant';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

describe('V2-VERT-02: Tenant Variant Migration Script', () => {
  beforeEach(async () => {
    Nexus.adapter = new MockAdapter();
    // Seed test tenants in MockAdapter
    await Nexus.adapter.set('tenants/t1', { id: 't1', name: 'Legacy Resto' }); // missing variant
    await Nexus.adapter.set('tenants/t2', { id: 't2', name: 'Valid Bakery', variant: 'bakery' });
    await Nexus.adapter.set('tenants/t3', { id: 't3', name: 'Unknown Variant', variant: 'spaceship_rental' });
    await Nexus.adapter.set('tenants/t4', { id: 't4', name: 'New Gym', variant: 'gym' });
  });

  it('correctly migrates missing and unknown variants idempotently', async () => {
    const result = await migrateTenantsVariant(false);
    expect(result.total).toBe(4);
    expect(result.migrated).toBe(2); // t1 and t3
    expect(result.untouched).toBe(2); // t2 and t4
    expect(result.errors).toBe(0);

    const t1 = await Nexus.adapter.get<{ variant: string }>('tenants/t1');
    expect(t1?.variant).toBe('restaurant');

    const t2 = await Nexus.adapter.get<{ variant: string }>('tenants/t2');
    expect(t2?.variant).toBe('bakery');

    const t3 = await Nexus.adapter.get<{ variant: string }>('tenants/t3');
    expect(t3?.variant).toBe('custom');

    const t4 = await Nexus.adapter.get<{ variant: string }>('tenants/t4');
    expect(t4?.variant).toBe('gym');

    // Run again to verify idempotency
    const secondRun = await migrateTenantsVariant(false);
    expect(secondRun.migrated).toBe(0);
    expect(secondRun.untouched).toBe(4);
  });
});
