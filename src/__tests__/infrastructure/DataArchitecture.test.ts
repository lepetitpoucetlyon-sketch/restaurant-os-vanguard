import { describe, it, expect } from 'vitest';
import { TenantPathResolver } from '@/lib/nexus/resolvers/TenantPathResolver';
import { SqliteMemoryAdapter } from '@/lib/adapters/SqliteMemoryAdapter';

describe('Data Architecture & Multi-Tenant Infrastructure', () => {
  it('should correctly scope paths to the active tenant context', () => {
    const ctx = { vassalId: 'tenant_lyon_01', actorId: 'user_123' };
    const resolved = TenantPathResolver.resolve('orders', ctx);
    expect(resolved).toBe('tenants/tenant_lyon_01/orders');
  });

  it('should prevent cross-tenant access when path explicitly targets another tenant', () => {
    const ctx = { vassalId: 'tenant_lyon_01', actorId: 'user_123' };
    const isValid = TenantPathResolver.validate('tenants/tenant_paris_02/orders', ctx);
    expect(isValid).toBe(false);
  });

  it('should perform CRUD operations using SqliteMemoryAdapter in an agnostic manner', async () => {
    const adapter = new SqliteMemoryAdapter();
    const ctx = { vassalId: 'tenant_test', actorId: 'admin' };

    await adapter.set('tenants/tenant_test/orders/ord_1', { id: 'ord_1', total: 4500, status: 'pending' }, undefined, ctx);
    const item = await adapter.get<{ id: string; total: number; status: string }>('tenants/tenant_test/orders/ord_1', ctx);

    expect(item).not.toBeNull();
    expect(item?.total).toBe(4500);

    const queried = await adapter.query<{ id: string; total: number }>('tenants/tenant_test/orders', {
      where: [{ field: 'total', operator: '>', value: 4000 }],
    }, ctx);

    expect(queried.length).toBe(1);
  });
});
