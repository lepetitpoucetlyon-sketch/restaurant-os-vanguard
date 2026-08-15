import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware, config } from '@/middleware';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/server/tenantFromHost', () => ({
  resolveTenantFromHost: vi.fn(() => null),
}));

function createMockRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
  return {
    nextUrl: {
      pathname,
      clone: () => ({ pathname }),
    },
    headers: {
      // default host=localhost so custom-domain lookup is skipped
      get: (name: string) => (headers[name] ?? (name === 'host' ? 'localhost' : null)),
    },
  } as unknown as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('config.matcher', () => {
    it('includes admin API routes', () => {
      expect(config.matcher).toContain('/api/admin/:path*');
    });

    it('includes all operational routes', () => {
      expect(config.matcher).toContain('/pos');
      expect(config.matcher).toContain('/kds');
      expect(config.matcher).toContain('/finance');
    });

    it('includes public widget routes', () => {
      expect(config.matcher).toContain('/reservations');
      expect(config.matcher).toContain('/menu');
      expect(config.matcher).toContain('/booking');
    });
  });

  describe('admin API auth gate', () => {
    it('returns 404 when no authorization header', async () => {
      const req = createMockRequest('/api/admin/system/health');
      const res = await middleware(req);
      expect(res.status).toBe(404);
    });

    it('returns 404 when authorization is not Bearer', async () => {
      const req = createMockRequest('/api/admin/system/health', {
        authorization: 'Basic abc123',
      });
      const res = await middleware(req);
      expect(res.status).toBe(404);
    });

    it('passes through when Bearer token is present', async () => {
      vi.stubEnv('MCC_ADMIN_SECRET', 'valid_token_here');
      const req = createMockRequest('/api/admin/system/health', {
        authorization: 'Bearer valid_token_here',
      });
      const res = await middleware(req);
      // Should not be 404 — middleware passes through
      expect(res.status).not.toBe(404);
    });
  });

  describe('git API in production', () => {
    it('blocks git routes in production', async () => {
      vi.stubEnv('MCC_ADMIN_SECRET', 'token');
      vi.stubEnv('NODE_ENV', 'production');
      const req = createMockRequest('/api/admin/git/push', {
        authorization: 'Bearer token',
      });
      const res = await middleware(req);
      expect(res.status).toBe(404);
      vi.unstubAllEnvs();
    });
  });
});
