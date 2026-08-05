import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityManager, ROOT_ADMIN } from '@/lib/IdentityManager';

import * as sharedKernel from '@/lib/shared-kernel';

// Removed vi.mock for shared-kernel

describe('IdentityManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sharedKernel, 'hashPin').mockImplementation(
      async (pin: string, userId: string) => `hashed_${pin}_${userId}`
    );
  });

  describe('isPinFormatValid', () => {
    it('accepts 4-digit PINs', () => {
      expect(IdentityManager.isPinFormatValid('1234')).toBe(true);
      expect(IdentityManager.isPinFormatValid('0000')).toBe(true);
    });

    it('rejects non-4-digit PINs', () => {
      expect(IdentityManager.isPinFormatValid('123')).toBe(false);
      expect(IdentityManager.isPinFormatValid('12345')).toBe(false);
      expect(IdentityManager.isPinFormatValid('')).toBe(false);
    });

    it('trims whitespace and accepts valid format', () => {
      expect(IdentityManager.isPinFormatValid(' 1234 ')).toBe(true);
    });
  });

  describe('matchesPin', () => {
    it('matches a hashed PIN', async () => {
      const user = { ...ROOT_ADMIN, pinHash: 'hashed_9999_user_root' };
      expect(await IdentityManager.matchesPin(user, '9999')).toBe(true);
    });

    it('rejects wrong PIN with hash', async () => {
      const user = { ...ROOT_ADMIN, pinHash: 'hashed_9999_user_root' };
      expect(await IdentityManager.matchesPin(user, '1111')).toBe(false);
    });

    it('matches a plain PIN (legacy)', async () => {
      const user = { ...ROOT_ADMIN, pin: '4321' };
      expect(await IdentityManager.matchesPin(user, '4321')).toBe(true);
    });

    it('rejects invalid format', async () => {
      expect(await IdentityManager.matchesPin(ROOT_ADMIN, '12')).toBe(false);
    });
  });

  describe('stripSensitiveFields', () => {
    it('removes pin and pinHash', () => {
      const user = { ...ROOT_ADMIN, pin: '1234', pinHash: 'abc' };
      const safe = IdentityManager.stripSensitiveFields(user);
      expect(safe).not.toHaveProperty('pin');
      expect(safe).not.toHaveProperty('pinHash');
      expect(safe.id).toBe(ROOT_ADMIN.id);
    });
  });

  describe('buildSessionUser', () => {
    it('returns user without sensitive fields and with lastActive', () => {
      const session = IdentityManager.buildSessionUser(ROOT_ADMIN);
      expect(session).not.toHaveProperty('pin');
      expect(session).toHaveProperty('lastActive');
    });
  });

  describe('sameSessionUser', () => {
    it('returns true for identical users', () => {
      const user = IdentityManager.buildSessionUser(ROOT_ADMIN, 1000);
      expect(IdentityManager.sameSessionUser(user, user)).toBe(true);
    });

    it('returns false when previous is null', () => {
      expect(IdentityManager.sameSessionUser(null, ROOT_ADMIN)).toBe(false);
    });

    it('returns false when role differs', () => {
      const a = IdentityManager.buildSessionUser(ROOT_ADMIN, 1000);
      const b = IdentityManager.buildSessionUser({ ...ROOT_ADMIN, role: 'staff' }, 1000);
      expect(IdentityManager.sameSessionUser(a, b)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('identifies root admin', () => {
      expect(IdentityManager.isSuperAdmin(ROOT_ADMIN)).toBe(true);
    });

    it('rejects non-root admins', () => {
      expect(IdentityManager.isSuperAdmin({ ...ROOT_ADMIN, id: 'user_other' })).toBe(false);
    });

    it('rejects non-admin roles', () => {
      expect(IdentityManager.isSuperAdmin({ ...ROOT_ADMIN, role: 'staff' })).toBe(false);
    });
  });

  describe('canDo', () => {
    it('allows ADMIN_ACTION when accessLevel >= 50', () => {
      expect(IdentityManager.canDo('ADMIN_ACTION', { accessLevel: 50 })).toBe(true);
      expect(IdentityManager.canDo('ADMIN_ACTION', { accessLevel: 100 })).toBe(true);
    });

    it('blocks ADMIN_ACTION when accessLevel < 50', () => {
      expect(IdentityManager.canDo('ADMIN_ACTION', { accessLevel: 10 })).toBe(false);
    });

    it('allows non-admin actions at any level', () => {
      expect(IdentityManager.canDo('BASIC_ACTION', { accessLevel: 0 })).toBe(true);
    });
  });
});
