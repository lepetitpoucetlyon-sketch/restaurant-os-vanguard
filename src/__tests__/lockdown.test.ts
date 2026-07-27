import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyDevice } from '../infrastructure/services/sovereign/lockdown';

vi.mock('@/lib/nexus/NexusAdapter', () => {
  const mockAdapter = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    query: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    batch: vi.fn(),
    onSnapshot: vi.fn(),
    generateId: vi.fn(),
    increment: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
  };
  return {
    Nexus: {
      adapter: mockAdapter,
      getTenantPath: vi.fn((col: string, tid?: string) => `tenants/${tid || 'default'}/${col}`),
    },
  };
});

import { Nexus } from '@/lib/nexus/NexusAdapter';
const mockAdapter = Nexus.adapter as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Lockdown Protocol - Auto-Certification SUPER_ADMIN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!global.navigator) {
      (global as unknown as { navigator: any }).navigator = { userAgent: 'test-agent', hardwareConcurrency: 4 };
    }
  });

  it('Scénario 1: Appareil certifié - Accès autorisé', async () => {
    mockAdapter.get.mockImplementation((path: string) => {
      if (path.includes('certifiedDevices')) {
        return Promise.resolve({ fingerprint: 'fingerprint_123' });
      }
      return Promise.resolve({ role: 'USER' });
    });

    const result = await verifyDevice('uid_123', 'fingerprint_123');
    expect(result).toEqual({ status: 'CERTIFIED' });
  });

  it('Scénario 2: Appareil inconnu et sans 2FA - Validation Manager', async () => {
    mockAdapter.get.mockImplementation((path: string) => {
      if (path.includes('certifiedDevices')) {
        return Promise.resolve(null);
      }
      return Promise.resolve({ role: 'USER' });
    });

    const result = await verifyDevice('uid_123', 'fingerprint_unknown');
    expect(result).toEqual({ status: 'REQUIRES_MANAGER_VALIDATION' });
  });

  it('Scénario 2b: Appareil inconnu avec 2FA - Propose 2FA', async () => {
    mockAdapter.get.mockImplementation((path: string) => {
      if (path.includes('certifiedDevices')) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        role: 'USER',
        preferences2FA: { email_enabled: true, sms_enabled: false }
      });
    });

    const result = await verifyDevice('uid_123', 'fingerprint_unknown');
    expect(result).toEqual({ status: 'REQUIRES_2FA', methods: ['email'] });
  });

  it('Scénario 3: Révocation - Accès refusé', async () => {
    mockAdapter.get.mockImplementation((path: string) => {
      if (path.includes('certifiedDevices')) {
        return Promise.resolve({ fingerprint: 'fingerprint_revoked', revoked: true });
      }
      return Promise.resolve({ role: 'USER' });
    });

    const result = await verifyDevice('uid_123', 'fingerprint_revoked');
    expect(result).toEqual({ status: 'REVOKED' });
  });

  it('Scénario 4: SUPER_ADMIN - Auto-certification', async () => {
    mockAdapter.get.mockImplementation((path: string) => {
      if (path.includes('certifiedDevices')) {
        return Promise.resolve(null);
      }
      return Promise.resolve({ role: 'SUPER_ADMIN' });
    });

    const result = await verifyDevice('uid_super_admin', 'new_fingerprint_super');
    expect(result).toEqual({ status: 'CERTIFIED' });
    expect(mockAdapter.set).toHaveBeenCalled();
  });

  it('Scénario 5: Tablette fixe - Validation manuelle', async () => {
    mockAdapter.get.mockImplementation((path: string) => {
      if (path.includes('certifiedDevices')) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        role: 'USER',
        preferences2FA: { email_enabled: true, sms_enabled: true }
      });
    });

    const result = await verifyDevice('uid_fixed', 'fingerprint_fixed', true);
    expect(result).toEqual({ status: 'REQUIRES_MANAGER_VALIDATION' });
  });
});
