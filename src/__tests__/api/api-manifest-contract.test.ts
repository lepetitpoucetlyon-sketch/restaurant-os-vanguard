import { describe, it, expect } from 'vitest';
import {
  API_MANIFEST,
  validateApiRouteManifest,
  listRoutesByAudience,
  getRouteContract,
} from '@/lib/api/apiManifest';

describe('📋 API Route Manifest & Contract Enforcement (Phase 4)', () => {
  it('valide l intégrité structurelle du manifeste API', () => {
    const result = validateApiRouteManifest();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('exige une source de tenant valide pour toutes les routes d audience tenant', () => {
    const tenantRoutes = listRoutesByAudience('tenant');
    expect(tenantRoutes.length).toBeGreaterThan(0);
    for (const route of tenantRoutes) {
      expect(['header', 'subdomain', 'token']).toContain(route.tenantSource);
    }
  });

  it('exige un rôle de sécurité explicite pour toutes les routes MCC', () => {
    const mccRoutes = listRoutesByAudience('mcc');
    expect(mccRoutes.length).toBeGreaterThan(0);
    for (const route of mccRoutes) {
      expect(route.minRole).toBeDefined();
      expect(route.minRole?.startsWith('mcc_')).toBe(true);
    }
  });

  it('couvre de manière exhaustive l ensemble des 222 routes du dépôt', () => {
    expect(API_MANIFEST.length).toBeGreaterThanOrEqual(290);
    const uniquePaths = new Set(API_MANIFEST.map((r) => r.path));
    expect(uniquePaths.size).toBe(222);
  });

  it('requiert l idempotence pour les routes de mutation financière ou opérationnelle', () => {
    const cashCountContract = getRouteContract('/api/finance/cash-count', 'POST');
    expect(cashCountContract).toBeDefined();
    expect(cashCountContract?.idempotencyRequired).toBe(true);

    const orderContract = getRouteContract('/api/v1/orders', 'POST');
    expect(orderContract).toBeDefined();
    expect(orderContract?.idempotencyRequired).toBe(true);
  });
});
