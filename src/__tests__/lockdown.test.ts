import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyDevice } from '../lib/sovereign/lockdown';
import { doc, getDoc, setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
  };
});

describe('Lockdown Protocol - Auto-Certification SUPER_ADMIN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!global.navigator) {
      (global as unknown as { navigator: any }).navigator = { userAgent: 'test-agent', hardwareConcurrency: 4 };
    }
  });

  it('Scénario 1: Appareil certifié - Accès autorisé', async () => {
    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => true,
          data: (): any => ({ fingerprint: 'fingerprint_123' })
        } as any);
      }
      return Promise.resolve({
        exists: () => true,
        data: (): any => ({ role: 'USER' })
      } as any);
    });

    vi.mocked(doc).mockImplementation((...args: any[]) => {
      const subCol = args[3];
      if (subCol === 'certifiedDevices') return 'deviceDocRef' as any;
      return 'userDocRef' as any;
    });

    const result = await verifyDevice('uid_123', 'fingerprint_123');
    expect(result).toEqual({ status: 'CERTIFIED' });
  });

  it('Scénario 2: Appareil inconnu et sans 2FA - Validation Manager', async () => {
    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: (): any => null
        } as any);
      }
      return Promise.resolve({
        exists: () => true,
        data: (): any => ({ role: 'USER' }) // no preferences2FA
      } as any);
    });

    vi.mocked(doc).mockImplementation((...args: any[]) => {
      const subCol = args[3];
      if (subCol === 'certifiedDevices') return 'deviceDocRef' as any;
      return 'userDocRef' as any;
    });

    const result = await verifyDevice('uid_123', 'fingerprint_unknown');
    expect(result).toEqual({ status: 'REQUIRES_MANAGER_VALIDATION' });
  });

  it('Scénario 2b: Appareil inconnu avec 2FA - Propose 2FA', async () => {
    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: (): any => null
        } as any);
      }
      return Promise.resolve({
        exists: () => true,
        data: (): any => ({ 
          role: 'USER',
          preferences2FA: { email_enabled: true, sms_enabled: false }
        })
      } as any);
    });

    vi.mocked(doc).mockImplementation((...args: any[]) => {
      const subCol = args[3];
      if (subCol === 'certifiedDevices') return 'deviceDocRef' as any;
      return 'userDocRef' as any;
    });

    const result = await verifyDevice('uid_123', 'fingerprint_unknown');
    expect(result).toEqual({ status: 'REQUIRES_2FA', methods: ['email'] });
  });

  it('Scénario 3: Révocation - Accès refusé', async () => {
    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => true,
          data: (): any => ({ fingerprint: 'fingerprint_revoked', revoked: true })
        } as any);
      }
      return Promise.resolve({
        exists: () => true,
        data: (): any => ({ role: 'USER' })
      } as any);
    });

    vi.mocked(doc).mockImplementation((...args: any[]) => {
      const subCol = args[3];
      if (subCol === 'certifiedDevices') return 'deviceDocRef' as any;
      return 'userDocRef' as any;
    });

    const result = await verifyDevice('uid_123', 'fingerprint_revoked');
    expect(result).toEqual({ status: 'REVOKED' });
  });

  it('Scénario 4: SUPER_ADMIN - Auto-certification', async () => {
    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: (): any => null
        } as any);
      }
      return Promise.resolve({
        exists: () => true,
        data: (): any => ({ role: 'SUPER_ADMIN' })
      } as any);
    });

    vi.mocked(doc).mockImplementation((...args: any[]) => {
      const subCol = args[3];
      if (subCol === 'certifiedDevices') return 'deviceDocRef' as any;
      return 'userDocRef' as any;
    });

    const result = await verifyDevice('uid_super_admin', 'new_fingerprint_super');
    expect(result).toEqual({ status: 'CERTIFIED' });
    expect(setDoc).toHaveBeenCalled();
  });

  it('Scénario 5: Tablette fixe - Validation manuelle', async () => {
    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: (): any => null
        } as any);
      }
      return Promise.resolve({
        exists: () => true,
        data: (): any => ({ 
          role: 'USER',
          preferences2FA: { email_enabled: true, sms_enabled: true }
        })
      } as any);
    });

    vi.mocked(doc).mockImplementation((...args: any[]) => {
      const subCol = args[3];
      if (subCol === 'certifiedDevices') return 'deviceDocRef' as any;
      return 'userDocRef' as any;
    });

    // isFixedAsset = true
    const result = await verifyDevice('uid_fixed', 'fingerprint_fixed', true);
    expect(result).toEqual({ status: 'REQUIRES_MANAGER_VALIDATION' });
  });
});
