import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  bindServerTenantContext,
  getServerTenantContext,
  runWithServerTenant,
} from '@/lib/server/ServerTenantStorage';

type TenantGlobal = typeof globalThis & {
  __nexusServerTenant?: { tenantId: string; role?: string; userId?: string };
};

const currentGlobalTenant = (): string | undefined =>
  (globalThis as TenantGlobal).__nexusServerTenant?.tenantId;

describe('ServerTenantStorage', () => {
  it('expose le tenant de la requête aux lecteurs synchrones pendant le callback', () => {
    const result = runWithServerTenant(
      { tenantId: 'tenant_alpha', role: 'admin', userId: 'user_alpha' },
      () => ({
        fromStorage: getServerTenantContext()?.tenantId,
        fromClientSafeReader: currentGlobalTenant(),
      }),
    );

    expect(result).toEqual({
      fromStorage: 'tenant_alpha',
      fromClientSafeReader: 'tenant_alpha',
    });
    expect(getServerTenantContext()).toBeUndefined();
    expect(currentGlobalTenant()).toBeUndefined();
  });

  it('isole les lectures après await entre deux requêtes concurrentes', async () => {
    const [alpha, beta] = await Promise.all([
      runWithServerTenant({ tenantId: 'tenant_alpha' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          fromStorage: getServerTenantContext()?.tenantId,
          fromClientSafeReader: currentGlobalTenant(),
        };
      }),
      runWithServerTenant({ tenantId: 'tenant_beta' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return {
          fromStorage: getServerTenantContext()?.tenantId,
          fromClientSafeReader: currentGlobalTenant(),
        };
      }),
    ]);

    expect(alpha).toEqual({
      fromStorage: 'tenant_alpha',
      fromClientSafeReader: 'tenant_alpha',
    });
    expect(beta).toEqual({
      fromStorage: 'tenant_beta',
      fromClientSafeReader: 'tenant_beta',
    });
  });

  it('préserve le tenant après le await de la garde de route', async () => {
    const authenticateThenHandle = async (tenantId: string, delay: number) => {
      // Même forme qu'une route : `const caller = await requireTenantUser(req)`.
      await Promise.resolve();
      bindServerTenantContext({ tenantId, role: 'manager', userId: `user_${tenantId}` });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return {
        fromStorage: getServerTenantContext()?.tenantId,
        fromClientSafeReader: currentGlobalTenant(),
      };
    };

    const [alpha, beta] = await Promise.all([
      authenticateThenHandle('tenant_alpha', 20),
      authenticateThenHandle('tenant_beta', 5),
    ]);

    expect(alpha).toEqual({
      fromStorage: 'tenant_alpha',
      fromClientSafeReader: 'tenant_alpha',
    });
    expect(beta).toEqual({
      fromStorage: 'tenant_beta',
      fromClientSafeReader: 'tenant_beta',
    });
  });
});
