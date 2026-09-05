import { describe, it, expect, beforeEach } from 'vitest';
import { runWithServerTenant, getServerTenantContext } from '@/lib/server/ServerTenantStorage';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { NextRequest, NextResponse } from 'next/server';

describe('🔒 Tenant Concurrency & Server Isolation (P0 Audit Remediation)', () => {
  beforeEach(() => {
    // Nettoyage avant chaque test
  });

  it('maintient un contexte tenant étanche sur 50 requêtes concurrentes entrelacées', async () => {
    const tenants = Array.from({ length: 50 }, (_, i) => `tenant_concurrent_${i}`);

    const runSimulatedRequest = async (tenantId: string) => {
      return runWithServerTenant({ tenantId, role: 'manager', userId: `user_${tenantId}` }, async () => {
        // Premier await : simulation I/O 1
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
        const ctx1 = getServerTenantContext();
        expect(ctx1?.tenantId).toBe(tenantId);
        expect(Nexus.activeTenant).toBe(tenantId);

        // Deuxième await : simulation I/O 2
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
        const ctx2 = getServerTenantContext();
        expect(ctx2?.tenantId).toBe(tenantId);
        expect(Nexus.activeTenant).toBe(tenantId);

        // Troisième await : validation SovereignGuard sur son propre chemin
        await SovereignGuard.validateAccess(`tenants/${tenantId}/orders/ord_123`);

        return Nexus.activeTenant;
      });
    };

    const results = await Promise.all(tenants.map((t) => runSimulatedRequest(t)));
    expect(results).toEqual(tenants);
  });

  it('déclenche le fail-safe ou le refus strict lors d\'un accès cross-tenant non autorisé', async () => {
    await runWithServerTenant({ tenantId: 'tenant_victim', role: 'manager' }, async () => {
      // Accès légitime à son propre tenant
      await expect(
        SovereignGuard.validateAccess('tenants/tenant_victim/config/profile'),
      ).resolves.not.toThrow();
    });

    // En mode STRICT_ISOLATION_TEST, un accès serveur sans contexte tenant ancré est refusé
    const prevEnv = process.env.STRICT_ISOLATION_TEST;
    try {
      process.env.STRICT_ISOLATION_TEST = 'true';
      await expect(
        SovereignGuard.validateAccess('tenants/tenant_target/secrets/key'),
      ).rejects.toThrow();
    } finally {
      process.env.STRICT_ISOLATION_TEST = prevEnv;
    }
  });

  it('withTenantRoute ancre le tenant et injecte le correlationId de bout en bout', async () => {
    const handler = withTenantRoute(async (_req, ctx) => {
      expect(ctx.tenantId).toBe('bistro_paris');
      expect(ctx.correlationId).toBe('corr_test_123');
      expect(Nexus.activeTenant).toBe('bistro_paris');

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(Nexus.activeTenant).toBe('bistro_paris');

      return NextResponse.json({ ok: true, tenant: ctx.tenantId });
    });

    const fakeReq = new NextRequest('http://localhost/api/test', {
      headers: {
        authorization: 'Bearer dev-tenant-bypass',
        'x-nexus-tenant-id': 'bistro_paris',
        'x-correlation-id': 'corr_test_123',
      },
    });

    const res = await handler(fakeReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.tenant).toBe('bistro_paris');
  });
});
