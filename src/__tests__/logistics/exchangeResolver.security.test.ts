/**
 * §7.2 Nexus Exchange — Security tests (run BEFORE feature implementation)
 * Validates: cross-tenant read isolation, grant expiry, grant revocation,
 * publisher-write restriction, wildcard grantee.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ExchangeGrant } from '@/modules/logistics/approvisionnement/edi-b2b/domain/ExchangeGrantSchema';

// ── Mock Nexus adapter ────────────────────────────────────────────────────────

const GRANTS_STORE: Record<string, ExchangeGrant[]> = {};
const PUBLISHED_STORE: Record<string, unknown> = {};

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: vi.fn(async (path: string) => {
        return PUBLISHED_STORE[path] ?? null;
      }),
      query: vi.fn(async (path: string) => {
        const tenantId = path.split('/')[1];
        return GRANTS_STORE[tenantId] ?? [];
      }),
      set: vi.fn(async (path: string, data: unknown) => {
        PUBLISHED_STORE[path] = data;
      }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// ── Import after mocks ────────────────────────────────────────────────────────

const { ExchangeResolver } = await import('@/modules/logistics/approvisionnement/edi-b2b/application/ExchangeResolver');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGrant(overrides: Partial<ExchangeGrant> = {}): ExchangeGrant {
  return {
    id: 'g1',
    publisherId: 'supplier-001',
    granteeId: 'buyer-001',
    scopes: ['catalog'],
    active: true,
    createdAt: new Date('2026-01-01').toISOString(),
    createdBy: 'admin',
    ...overrides,
  };
}

beforeEach(() => {
  Object.keys(GRANTS_STORE).forEach(k => delete GRANTS_STORE[k]);
  Object.keys(PUBLISHED_STORE).forEach(k => delete PUBLISHED_STORE[k]);
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ExchangeResolver — security', () => {
  describe('read isolation', () => {
    it('S1 — rejects read with no grant at all', async () => {
      await expect(
        ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001'),
      ).rejects.toThrow(/Grant introuvable|no valid grant/i);
    });

    it('S2 — rejects read when grant is for a different grantee', async () => {
      GRANTS_STORE['supplier-001'] = [makeGrant({ granteeId: 'other-buyer' })];
      await expect(
        ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001'),
      ).rejects.toThrow(/Grant introuvable|no valid grant/i);
    });

    it('S3 — rejects read when grant scope does not match', async () => {
      GRANTS_STORE['supplier-001'] = [makeGrant({ scopes: ['pricing'] })];
      await expect(
        ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001'),
      ).rejects.toThrow(/Grant introuvable|no valid grant/i);
    });

    it('S4 — rejects read when grant is inactive', async () => {
      GRANTS_STORE['supplier-001'] = [makeGrant({ active: false })];
      await expect(
        ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001'),
      ).rejects.toThrow(/Grant introuvable|no valid grant/i);
    });

    it('S5 — rejects read when grant is expired', async () => {
      GRANTS_STORE['supplier-001'] = [
        makeGrant({ expiresAt: new Date('2020-01-01').toISOString() }),
      ];
      await expect(
        ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001'),
      ).rejects.toThrow(/expiré|expired|Grant introuvable/i);
    });

    it('S6 — rejects read when grant is revoked', async () => {
      GRANTS_STORE['supplier-001'] = [
        makeGrant({ revokedAt: new Date('2026-05-01').toISOString(), revokedBy: 'admin' }),
      ];
      await expect(
        ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001'),
      ).rejects.toThrow(/révoqué|revoked|Grant introuvable/i);
    });
  });

  describe('valid grant', () => {
    it('S7 — allows read with a valid direct grant', async () => {
      GRANTS_STORE['supplier-001'] = [makeGrant()];
      PUBLISHED_STORE['tenants/supplier-001/published/catalog'] = { items: [{ id: 'p1', name: 'Pain' }] };

      const result = await ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001');
      expect(result).toBeTruthy();
    });

    it('S8 — allows read with wildcard grantee (*)', async () => {
      GRANTS_STORE['supplier-001'] = [makeGrant({ granteeId: '*' })];
      PUBLISHED_STORE['tenants/supplier-001/published/catalog'] = { items: [] };

      const result = await ExchangeResolver.read('supplier-001', 'catalog', 'any-buyer');
      expect(result).toBeTruthy();
    });

    it('S9 — returns null when published data does not exist (grant OK but no data)', async () => {
      GRANTS_STORE['supplier-001'] = [makeGrant()];

      const result = await ExchangeResolver.read('supplier-001', 'catalog', 'buyer-001');
      expect(result).toBeNull();
    });
  });

  describe('write isolation', () => {
    it('S10 — publisher can publish to own published/ path', async () => {
      await expect(
        ExchangeResolver.publish('supplier-001', 'catalog', { items: [] }, 'supplier-001'),
      ).resolves.not.toThrow();
    });

    it('S11 — non-publisher cannot write to another tenant published/ path', async () => {
      await expect(
        ExchangeResolver.publish('supplier-001', 'catalog', { items: [] }, 'attacker-tenant'),
      ).rejects.toThrow(/non autorisé|unauthorized|cross-tenant/i);
    });
  });
});
