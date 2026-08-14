import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Nexus adapter
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockGet = vi.fn().mockResolvedValue(null);
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: (...args: unknown[]) => mockGet(...args),
      set: (...args: unknown[]) => mockSet(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { TenantSeeder } from '@/lib/TenantSeeder';
import { PCG_ACCOUNTS } from '@/lib/seeds/pcg-accounts';

describe('TenantSeeder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(null);
  });

  it('seeds a new tenant with all collections', async () => {
    const result = await TenantSeeder.seed({
      tenantId: 'test-resto',
      name: 'Test Resto',
      adminEmail: 'admin@test.fr',
      adminPin: '2580', // PIN valide (hors blacklist) — sinon resolveAdminPin en génère un aléatoire
    });

    expect(result.success).toBe(true);
    expect(result.seededPaths.length).toBeGreaterThan(0);

    // tenantConfig
    expect(mockSet).toHaveBeenCalledWith(
      'tenants/test-resto/tenantConfig',
      expect.objectContaining({ id: 'test-resto', name: 'Test Resto' })
    );

    // PCG accounts
    const pcgCalls = mockSet.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).startsWith('tenants/test-resto/accounts/')
    );
    expect(pcgCalls.length).toBe(PCG_ACCOUNTS.length);

    // Admin user — pinHash (SHA-256), jamais le PIN en clair
    expect(mockSet).toHaveBeenCalledWith(
      'tenants/test-resto/users/admin_test-resto',
      expect.objectContaining({ email: 'admin@test.fr', pinHash: expect.any(String), role: 'proprietaire' })
    );

    // Genesis fiscal seal
    expect(mockSet).toHaveBeenCalledWith(
      'tenants/test-resto/fiscalSeals/GENESIS',
      expect.objectContaining({ hash: 'GENESIS_ROOT_0000000000000000', sequence: 0 })
    );

    // Floors, zones, tables
    expect(mockSet).toHaveBeenCalledWith(
      'tenants/test-resto/floors/floor-rdc',
      expect.objectContaining({ name: 'Salle principale', level: 0 })
    );
    const tableCalls = mockSet.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).startsWith('tenants/test-resto/tables/')
    );
    expect(tableCalls.length).toBe(10);
  });

  it('is idempotent — skips if tenantConfig already exists', async () => {
    mockGet.mockResolvedValueOnce({ id: 'existing' });

    const result = await TenantSeeder.seed({
      tenantId: 'existing-resto',
      name: 'Existing',
      adminEmail: 'a@b.fr',
      adminPin: '0000',
    });

    expect(result.success).toBe(true);
    expect(result.seededPaths.length).toBe(0);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('returns failure and attempts rollback on error', async () => {
    mockSet.mockRejectedValueOnce(new Error('Firestore down'));

    const result = await TenantSeeder.seed({
      tenantId: 'fail-resto',
      name: 'Fail',
      adminEmail: 'a@b.fr',
      adminPin: '0000',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Firestore down');
    expect(mockDelete).toHaveBeenCalledWith('tenants/fail-resto/tenantConfig');
  });

  it('applies custom primaryColor when provided', async () => {
    await TenantSeeder.seed({
      tenantId: 'themed-resto',
      name: 'Themed',
      adminEmail: 'a@b.fr',
      adminPin: '0000',
      primaryColor: '#FF0000',
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/themed-resto/tenantConfig',
      expect.objectContaining({
        theme: expect.objectContaining({ primaryColor: '#FF0000' }),
      })
    );
  });
});
