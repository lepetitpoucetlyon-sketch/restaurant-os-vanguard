import { describe, it, expect, vi } from 'vitest';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';

// Mock Jotai store
vi.mock('jotai', () => ({
  getDefaultStore: vi.fn(() => ({
    get: vi.fn(() => 'tenant_default'),
  })),
  atom: vi.fn(),
}));

describe('SovereignGuard', () => {
  describe('canDelete', () => {
    it('prevents deletion of immutable collections (NF525)', () => {
      expect(SovereignGuard.canDelete('tenants/123/fiscalLedger/doc')).toBe(false);
      expect(SovereignGuard.canDelete('tenants/123/fiscalSeals/doc')).toBe(false);
      expect(SovereignGuard.canDelete('tenants/123/journalEntries/doc')).toBe(false);
    });

    it('prevents deletion in sacred zones via deep path', () => {
      expect(SovereignGuard.canDelete('tenants/123/ledger/anything')).toBe(false);
      expect(SovereignGuard.canDelete('config/master/settings')).toBe(false);
    });

    it('allows deletion of normal collections', () => {
      expect(SovereignGuard.canDelete('tenants/123/orders/doc')).toBe(true);
      expect(SovereignGuard.canDelete('tenants/123/products/doc')).toBe(true);
    });
  });

  describe('extractCollectionName', () => {
    it('extracts from document path (even length)', () => {
      expect(SovereignGuard.extractCollectionName('tenants/123/orders/456')).toBe('orders');
    });

    it('extracts from collection path (odd length)', () => {
      expect(SovereignGuard.extractCollectionName('tenants/123/orders')).toBe('orders');
    });

    it('returns empty string for empty path', () => {
      expect(SovereignGuard.extractCollectionName('')).toBe('');
    });
  });

  describe('isFiscallySealed', () => {
    it('identifies sealed paths', async () => {
      expect(await SovereignGuard.isFiscallySealed('tenants/1/fiscalSeals/2', { vassalId: '1' })).toBe(true);
      expect(await SovereignGuard.isFiscallySealed('tenants/1/fiscalLedger/2', { vassalId: '1' })).toBe(true);
    });

    it('identifies unsealed paths', async () => {
      expect(await SovereignGuard.isFiscallySealed('tenants/1/orders/2', { vassalId: '1' })).toBe(false);
    });
  });

  describe('resolveTenantForPath', () => {
    it('extracts tenant from scoped path', () => {
      expect(SovereignGuard.resolveTenantForPath('tenants/tenant_a/orders', 'tenant_b')).toBe('tenant_a');
    });

    it('uses anchored tenant for root paths', () => {
      expect(SovereignGuard.resolveTenantForPath('global_config', 'tenant_b')).toBe('tenant_b');
    });
  });
});
