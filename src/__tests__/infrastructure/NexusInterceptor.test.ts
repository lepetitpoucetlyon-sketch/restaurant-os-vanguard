import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusInterceptor } from '@/lib/nexus/NexusInterceptor';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
import type { INexusAdapter, NexusContext } from '@/lib/nexus/types';
import { NexusError } from '@/shared/nexus/errors';

const mockAdapter: INexusAdapter = {
  get: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(),
  batch: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  runTransaction: vi.fn(),
  increment: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  generateId: vi.fn(() => 'id_123'),
  serverTimestamp: vi.fn(() => 'ts'),
};

const mockGuard = {
  ...SovereignGuard,
  validateAccessGradeX: vi.fn(),
  protectWrite: vi.fn((_path, data) => Promise.resolve(data)),
  isFiscallySealed: vi.fn(),
};

describe('NexusInterceptor', () => {
  let interceptor: NexusInterceptor;
  const ctx: NexusContext = { vassalId: 'tenant_1', actorId: 'user_1' };

  beforeEach(() => {
    vi.clearAllMocks();
    interceptor = new NexusInterceptor(mockAdapter, mockGuard as unknown as typeof SovereignGuard, () => 'tenant_1');
  });

  describe('READ operations', () => {
    it('allows read if guard grants access', async () => {
      mockGuard.validateAccessGradeX.mockResolvedValue({ granted: true });
      (mockAdapter.get as any).mockResolvedValue({ id: 'doc_1' });

      const result = await interceptor.get('users/1', ctx);
      
      expect(mockGuard.validateAccessGradeX).toHaveBeenCalledWith('READ', 'users/1', ctx);
      expect(mockAdapter.get).toHaveBeenCalledWith('tenants/tenant_1/users/1');
      expect(result).toEqual({ id: 'doc_1' });
    });

    it('blocks read and throws if guard denies access', async () => {
      mockGuard.validateAccessGradeX.mockResolvedValue({ granted: false, reason: 'CROSS_TENANT' });

      await expect(interceptor.get('users/1', ctx)).rejects.toThrow(NexusError);
      expect(mockAdapter.get).not.toHaveBeenCalled();
    });
  });

  describe('WRITE operations', () => {
    it('scopes path and protects write', async () => {
      mockGuard.validateAccessGradeX.mockResolvedValue({ granted: true });

      await interceptor.set('orders/1', { total: 100 }, undefined, ctx);

      expect(mockGuard.protectWrite).toHaveBeenCalledWith('tenants/tenant_1/orders/1', { total: 100 }, 'tenant_1');
      expect(mockAdapter.set).toHaveBeenCalledWith('tenants/tenant_1/orders/1', { total: 100 }, undefined);
    });
  });

  describe('DELETE operations', () => {
    it('blocks deletion of fiscally sealed documents', async () => {
      mockGuard.validateAccessGradeX.mockResolvedValue({ granted: true });
      mockGuard.isFiscallySealed.mockResolvedValue(true); // Sealed!

      await expect(interceptor.delete('fiscalSeals/1', ctx)).rejects.toThrow(/NF525/);
      expect(mockAdapter.delete).not.toHaveBeenCalled();
    });

    it('allows deletion of normal documents', async () => {
      mockGuard.validateAccessGradeX.mockResolvedValue({ granted: true });
      mockGuard.isFiscallySealed.mockResolvedValue(false); // Not sealed

      await interceptor.delete('orders/1', ctx);
      
      expect(mockAdapter.delete).toHaveBeenCalledWith('tenants/tenant_1/orders/1');
    });
  });
});
