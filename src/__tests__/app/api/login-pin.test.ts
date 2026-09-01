import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as argon2 from 'argon2';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PinHashService } from '@/lib/server/PinHashService';
import { hashPin } from '@/lib/shared-kernel';
import { POST } from '@/app/api/auth/login-pin/route';
import { NextRequest } from 'next/server';

/**
 * login-pin.test.ts — Lot B2.b (firestore.md §12)
 *
 * Couvre la cascade des 3 schémas de hash de PIN qui coexistent en base
 * (Argon2id, PBKDF2 PinHashService, SHA-256 legacy shared-kernel + plaintext),
 * la migration silencieuse vers Argon2id après un succès sur un schéma faible,
 * et l'anti-brute-force (5 tentatives, verrouillage 15 min).
 */

vi.mock('@/lib/auth/ServerAuthProvider', () => ({
  getServerAuthProvider: () => ({
    createSessionToken: vi.fn().mockResolvedValue('fake-session-token'),
  }),
}));

function createReq(userId: string, pin: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/login-pin', {
    method: 'POST',
    body: JSON.stringify({ userId, pin }),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/login-pin', () => {
  beforeEach(async () => {
    await Nexus.adapter.delete('users/u_argon2').catch(() => {});
    await Nexus.adapter.delete('users/u_pbkdf2').catch(() => {});
    await Nexus.adapter.delete('users/u_legacy_hash').catch(() => {});
    await Nexus.adapter.delete('users/u_plaintext').catch(() => {});
    await Nexus.adapter.delete('users/u_lockout').catch(() => {});
  });

  it('accepte un PIN vérifié via Argon2id (schéma déjà migré) et ne re-hash pas', async () => {
    const pinHashArgon2 = await argon2.hash('1234', { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
    await Nexus.adapter.set('users/u_argon2', { name: 'Argon User', role: 'admin', pinHashArgon2 });

    const res = await POST(createReq('u_argon2', '1234'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe('fake-session-token');
    expect(body.user.id).toBe('u_argon2');
    expect(body.user.accessLevel).toBe(100); // admin

    // Le hash Argon2id existant n'a pas changé (pas de migration nécessaire).
    const stored = await Nexus.adapter.get<{ pinHashArgon2: string }>('users/u_argon2');
    expect(stored!.pinHashArgon2).toBe(pinHashArgon2);
  });

  it('accepte un PIN vérifié via PBKDF2 (PinHashService) et migre vers Argon2id', async () => {
    const { pinHash, pinSalt } = PinHashService.hash('5678');
    await Nexus.adapter.set('users/u_pbkdf2', { name: 'PBKDF2 User', role: 'server', pinHash, pinSalt });

    const res = await POST(createReq('u_pbkdf2', '5678'));
    expect(res.status).toBe(200);

    const stored = await Nexus.adapter.get<{ pinHashArgon2?: string; pinHash?: string; pinSalt?: string }>('users/u_pbkdf2');
    expect(stored!.pinHashArgon2).toBeTruthy();
    expect(await argon2.verify(stored!.pinHashArgon2!, '5678')).toBe(true);
    expect(stored!.pinHash).toBeNull();
    expect(stored!.pinSalt).toBeNull();
  });

  it('accepte un PIN vérifié via le schéma legacy SHA-256 (shared-kernel) et migre vers Argon2id', async () => {
    const pinHash = await hashPin('9012', 'u_legacy_hash');
    await Nexus.adapter.set('users/u_legacy_hash', { name: 'Legacy User', role: 'cashier', pinHash });

    const res = await POST(createReq('u_legacy_hash', '9012'));
    expect(res.status).toBe(200);

    const stored = await Nexus.adapter.get<{ pinHashArgon2?: string; pinHash?: string }>('users/u_legacy_hash');
    expect(stored!.pinHashArgon2).toBeTruthy();
    expect(stored!.pinHash).toBeNull();
  });

  it('accepte un PIN en clair (legacy le plus ancien) et migre vers Argon2id', async () => {
    await Nexus.adapter.set('users/u_plaintext', { name: 'Plaintext User', role: 'host', pin: '3456' });

    const res = await POST(createReq('u_plaintext', '3456'));
    expect(res.status).toBe(200);

    const stored = await Nexus.adapter.get<{ pinHashArgon2?: string; pin?: string }>('users/u_plaintext');
    expect(stored!.pinHashArgon2).toBeTruthy();
    expect(stored!.pin).toBeNull();
  });

  it('refuse un PIN incorrect (401) sans divulguer le schéma de hash', async () => {
    const pinHashArgon2 = await argon2.hash('1234', { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
    await Nexus.adapter.set('users/u_argon2', { name: 'Argon User', role: 'admin', pinHashArgon2 });

    const res = await POST(createReq('u_argon2', '9999'));
    expect(res.status).toBe(401);
  });

  it('renvoie 404 pour un utilisateur inconnu', async () => {
    const res = await POST(createReq('u_does_not_exist', '1234'));
    expect(res.status).toBe(404);
  });

  it('renvoie 400 pour un PIN mal formé', async () => {
    const res = await POST(createReq('u_argon2', 'abcd'));
    expect(res.status).toBe(400);
  });

  it('verrouille le compte après 5 échecs (429), et bloque même le bon PIN pendant le verrouillage', async () => {
    const pinHashArgon2 = await argon2.hash('1234', { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
    await Nexus.adapter.set('users/u_lockout', { name: 'Lockout User', role: 'admin', pinHashArgon2 });

    for (let i = 0; i < 4; i++) {
      const res = await POST(createReq('u_lockout', '0000'));
      expect(res.status).toBe(401);
    }
    // 5e échec → déclenche le verrouillage
    const res5 = await POST(createReq('u_lockout', '0000'));
    expect(res5.status).toBe(401);

    const stored = await Nexus.adapter.get<{ pinLockedUntil: number }>('users/u_lockout');
    expect(stored!.pinLockedUntil).toBeGreaterThan(Date.now());

    // Même le VRAI PIN est refusé pendant le verrouillage.
    const res6 = await POST(createReq('u_lockout', '1234'));
    expect(res6.status).toBe(429);
  });
});
