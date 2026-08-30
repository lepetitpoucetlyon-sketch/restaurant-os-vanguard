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
      expect(SovereignGuard.canDelete('tenants/123/wormArchives/doc')).toBe(false);
    });

    it('prevents deletion in sacred zones via deep path', () => {
      expect(SovereignGuard.canDelete('tenants/123/ledger/anything')).toBe(false);
      expect(SovereignGuard.canDelete('config/master/settings')).toBe(false);
      expect(SovereignGuard.canDelete('tenants/123/wormArchives/file.pdf')).toBe(false);
    });

    it('allows deletion of normal collections', () => {
      expect(SovereignGuard.canDelete('tenants/123/ops_flows/doc')).toBe(true);
      expect(SovereignGuard.canDelete('tenants/123/products/doc')).toBe(true);
    });
  });

  describe('canUpdate', () => {
    it('prevents update/mutation of immutable collections (NF525)', () => {
      expect(SovereignGuard.canUpdate('tenants/123/fiscalLedger/doc')).toBe(false);
      expect(SovereignGuard.canUpdate('tenants/123/fiscalSeals/doc')).toBe(false);
      expect(SovereignGuard.canUpdate('tenants/123/journalEntries/doc')).toBe(false);
      expect(SovereignGuard.canUpdate('tenants/123/wormArchives/doc')).toBe(false);
    });

    it('allows update of mutable business collections', () => {
      expect(SovereignGuard.canUpdate('tenants/123/ops_flows/doc')).toBe(true);
      expect(SovereignGuard.canUpdate('tenants/123/products/doc')).toBe(true);
      expect(SovereignGuard.canUpdate('tenants/123/stockItems/doc')).toBe(true);
    });
  });

  describe('validateAccessGradeX', () => {
    it('blocks DELETE on immutable collections with NF525 reason', async () => {
      const res = await SovereignGuard.validateAccessGradeX('DELETE', 'tenants/123/fiscalSeals/seal_1', { vassalId: '123', actorId: 'usr_1' });
      expect(res.granted).toBe(false);
      expect(res.reason).toBe('NF525_DELETE_IMMUTABLE_FORBIDDEN');
    });

    it('blocks UPDATE on immutable collections with NF525 reason', async () => {
      const res = await SovereignGuard.validateAccessGradeX('UPDATE', 'tenants/123/wormArchives/arc_1', { vassalId: '123', actorId: 'usr_1' });
      expect(res.granted).toBe(false);
      expect(res.reason).toBe('NF525_UPDATE_IMMUTABLE_FORBIDDEN');
    });

    it('grants UPDATE on normal collections', async () => {
      const res = await SovereignGuard.validateAccessGradeX('UPDATE', 'tenants/123/products/prod_1', { vassalId: '123', actorId: 'usr_1' });
      expect(res.granted).toBe(true);
    });
  });

  describe('extractCollectionName', () => {
    it('extracts from document path (even length)', () => {
      expect(SovereignGuard.extractCollectionName('tenants/123/ops_flows/456')).toBe('ops_flows');
    });

    it('extracts from collection path (odd length)', () => {
      expect(SovereignGuard.extractCollectionName('tenants/123/ops_flows')).toBe('ops_flows');
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
      expect(await SovereignGuard.isFiscallySealed('tenants/1/ops_flows/2', { vassalId: '1' })).toBe(false);
    });
  });

  describe('resolveTenantForPath', () => {
    it('extracts tenant from scoped path', () => {
      expect(SovereignGuard.resolveTenantForPath('tenants/tenant_a/ops_flows', 'tenant_b')).toBe('tenant_a');
    });

    it('uses anchored tenant for root paths', () => {
      expect(SovereignGuard.resolveTenantForPath('global_config', 'tenant_b')).toBe('tenant_b');
    });
  });

  describe('requiresSignedWrite', () => {
    it('requires signature for NF525 and audit collections', () => {
      expect(SovereignGuard.requiresSignedWrite('tenants/123/fiscalSeals/doc')).toBe(true);
      expect(SovereignGuard.requiresSignedWrite('tenants/123/journalEntries/doc')).toBe(true);
      expect(SovereignGuard.requiresSignedWrite('tenants/123/fiscalLedger/doc')).toBe(true);
      expect(SovereignGuard.requiresSignedWrite('tenants/123/ops_flows/doc')).toBe(true);
      expect(SovereignGuard.requiresSignedWrite('tenants/123/wasteLogs/doc')).toBe(true);
    });

    it('does not require signature for non-critical collections', () => {
      expect(SovereignGuard.requiresSignedWrite('tenants/123/products/doc')).toBe(false);
      expect(SovereignGuard.requiresSignedWrite('tenants/123/reservations/doc')).toBe(false);
      expect(SovereignGuard.requiresSignedWrite('tenants/123/categories/doc')).toBe(false);
    });
  });
});
