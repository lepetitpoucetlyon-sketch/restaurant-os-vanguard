import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyDevice } from '../lib/sovereign/lockdown';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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
      (global as any).navigator = { userAgent: 'test-agent', hardwareConcurrency: 4 };
    }
  });

  it('Scénario 1: Appareil certifié - Accès autorisé', async () => {
    (getDoc as any).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ fingerprint: 'fingerprint_123' })
        });
      }
      return Promise.resolve({
        exists: () => true,
        data: () => ({ role: 'USER' })
      });
    });

    (doc as any).mockImplementation((db: any, col: string, uid: string, subCol?: string, subId?: string) => {
      if (subCol === 'certifiedDevices') return 'deviceDocRef';
      return 'userDocRef';
    });

    const result = await verifyDevice('uid_123', 'fingerprint_123');
    expect(result).toEqual({ status: 'CERTIFIED' });
  });

  it('Scénario 2: Appareil inconnu et sans 2FA - Validation Manager', async () => {
    (getDoc as any).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: () => null as any
        });
      }
      return Promise.resolve({
        exists: () => true,
        data: () => ({ role: 'USER' }) // no preferences2FA
      });
    });

    (doc as any).mockImplementation((db: any, col: string, uid: string, subCol?: string, subId?: string) => {
      if (subCol === 'certifiedDevices') return 'deviceDocRef';
      return 'userDocRef';
    });

    const result = await verifyDevice('uid_123', 'fingerprint_unknown');
    expect(result).toEqual({ status: 'REQUIRES_MANAGER_VALIDATION' });
  });

  it('Scénario 2b: Appareil inconnu avec 2FA - Propose 2FA', async () => {
    (getDoc as any).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: () => null as any
        });
      }
      return Promise.resolve({
        exists: () => true,
        data: () => ({ 
          role: 'USER',
          preferences2FA: { email_enabled: true, sms_enabled: false }
        })
      });
    });

    (doc as any).mockImplementation((db: any, col: string, uid: string, subCol?: string, subId?: string) => {
      if (subCol === 'certifiedDevices') return 'deviceDocRef';
      return 'userDocRef';
    });

    const result = await verifyDevice('uid_123', 'fingerprint_unknown');
    expect(result).toEqual({ status: 'REQUIRES_2FA', methods: ['email'] });
  });

  it('Scénario 3: Révocation - Accès refusé', async () => {
    (getDoc as any).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ fingerprint: 'fingerprint_revoked', revoked: true })
        });
      }
      return Promise.resolve({
        exists: () => true,
        data: () => ({ role: 'USER' })
      });
    });

    (doc as any).mockImplementation((db: any, col: string, uid: string, subCol?: string, subId?: string) => {
      if (subCol === 'certifiedDevices') return 'deviceDocRef';
      return 'userDocRef';
    });

    const result = await verifyDevice('uid_123', 'fingerprint_revoked');
    expect(result).toEqual({ status: 'REVOKED' });
  });

  it('Scénario 4: SUPER_ADMIN - Auto-certification', async () => {
    (getDoc as any).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: () => null as any
        });
      }
      return Promise.resolve({
        exists: () => true,
        data: () => ({ role: 'SUPER_ADMIN' })
      });
    });

    (doc as any).mockImplementation((db: any, col: string, uid: string, subCol?: string, subId?: string) => {
      if (subCol === 'certifiedDevices') return 'deviceDocRef';
      return 'userDocRef';
    });

    const result = await verifyDevice('uid_super_admin', 'new_fingerprint_super');
    expect(result).toEqual({ status: 'CERTIFIED' });
    expect(setDoc).toHaveBeenCalled();
  });

  it('Scénario 5: Tablette fixe - Validation manuelle', async () => {
    (getDoc as any).mockImplementation((ref: any) => {
      if (ref === 'deviceDocRef') {
        return Promise.resolve({
          exists: () => false,
          data: () => null as any
        });
      }
      return Promise.resolve({
        exists: () => true,
        data: () => ({ 
          role: 'USER',
          preferences2FA: { email_enabled: true, sms_enabled: true }
        })
      });
    });

    (doc as any).mockImplementation((db: any, col: string, uid: string, subCol?: string, subId?: string) => {
      if (subCol === 'certifiedDevices') return 'deviceDocRef';
      return 'userDocRef';
    });

    // isFixedAsset = true
    const result = await verifyDevice('uid_fixed', 'fingerprint_fixed', true);
    expect(result).toEqual({ status: 'REQUIRES_MANAGER_VALIDATION' });
  });
});
