/**
 * KeycloakAuthProvider.test.ts — Correctif sécurité G.2.1 (firestore.md §12)
 *
 * `verifyIdToken()` doit VÉRIFIER la signature du jeton via la JWKS du realm,
 * pas seulement décoder son contenu. Avant ce correctif, `KeycloakAuthProvider`
 * utilisait `jwt.decode()` — qui ne fait AUCUNE vérification cryptographique :
 * un jeton forgé à la main avec `role: "mcc_super_admin"` était accepté tel quel.
 *
 * Ces tests prouvent la propriété inverse : un jeton dont la signature ne
 * correspond pas à la JWKS publiée par le realm est REFUSÉ, quel que soit son
 * contenu (y compris un contenu qui prétend à un rôle élevé).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateKeyPairSync, type KeyObject } from 'crypto';
import jwt from 'jsonwebtoken';
import { KeycloakAuthProvider } from '@/lib/auth/ServerAuthProvider';

// Le cache JWKS de ServerAuthProvider.ts est indexé par issuer, au niveau module,
// avec un TTL de 10 min — partagé entre tous les tests de ce fichier. Un ISSUER
// unique par test évite qu'une clé mise en cache par un test précédent pollue
// la résolution d'un test suivant qui réutilise le même `kid`.
let issuerCounter = 0;
function uniqueIssuer(): string {
  issuerCounter += 1;
  return `https://kc-test.example/realms/test-${issuerCounter}`;
}

function toJwk(publicKey: KeyObject, kid: string): Record<string, unknown> {
  const jwk = publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
  return { ...jwk, kid, use: 'sig', alg: 'RS256' };
}

function mockJwksEndpoint(issuer: string, keys: Array<Record<string, unknown>>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url === `${issuer}/protocol/openid-connect/certs`) {
      return {
        ok: true,
        json: async () => ({ keys }),
      } as Response;
    }
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  }));
}

describe('KeycloakAuthProvider.verifyIdToken — G.2.1 vérification de signature', () => {
  let ISSUER: string;
  let realKeyPair: { publicKey: KeyObject; privateKey: KeyObject };
  let attackerKeyPair: { publicKey: KeyObject; privateKey: KeyObject };

  beforeEach(() => {
    ISSUER = uniqueIssuer();
    process.env.KEYCLOAK_ISSUER = ISSUER;
    delete process.env.KEYCLOAK_AUDIENCE;
    realKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    attackerKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.KEYCLOAK_ISSUER;
  });

  it('accepte un jeton correctement signé par une clé publiée dans la JWKS du realm', async () => {
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);
    const token = jwt.sign(
      { sub: 'user_1', role: 'admin', tenantId: 'lepetitpoucet', amr: ['pwd'] },
      realKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER, keyid: 'kid-real' },
    );

    const provider = new KeycloakAuthProvider();
    const decoded = await provider.verifyIdToken(token);

    expect(decoded.uid).toBe('user_1');
    expect(decoded.role).toBe('admin');
    expect(decoded.tenantId).toBe('lepetitpoucet');
    expect(decoded.mfaUsed).toBe(false);
  });

  it('marque mfaUsed=true quand amr contient un second facteur', async () => {
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);
    const token = jwt.sign(
      { sub: 'user_2', amr: ['pwd', 'otp'] },
      realKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER, keyid: 'kid-real' },
    );

    const provider = new KeycloakAuthProvider();
    const decoded = await provider.verifyIdToken(token);

    expect(decoded.mfaUsed).toBe(true);
  });

  it('🔴 REFUSE un jeton signé par une clé absente de la JWKS du realm (forgé), même avec un rôle élevé', async () => {
    // La JWKS publiée ne contient QUE la clé légitime — pas celle de l'attaquant.
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);

    // Un jeton signé par une clé totalement différente, avec un kid qui ne matche
    // aucune entrée de la JWKS — exactement ce qu'un attaquant produirait en
    // générant sa propre paire de clés puis en se déclarant super-admin.
    const forgedToken = jwt.sign(
      { sub: 'attacker', role: 'mcc_super_admin', tenantId: 'root' },
      attackerKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER, keyid: 'kid-attacker' },
    );

    const provider = new KeycloakAuthProvider();
    await expect(provider.verifyIdToken(forgedToken)).rejects.toThrow(/kid inconnu/);
  });

  it('🔴 REFUSE un jeton dont le kid est connu mais la signature ne correspond pas à cette clé (payload altéré)', async () => {
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);

    // kid légitime, mais signé avec la MAUVAISE clé privée — simule un payload
    // altéré après coup (élévation de rôle) sans re-signature valide.
    const tamperedToken = jwt.sign(
      { sub: 'attacker', role: 'mcc_super_admin' },
      attackerKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER, keyid: 'kid-real' },
    );

    const provider = new KeycloakAuthProvider();
    await expect(provider.verifyIdToken(tamperedToken)).rejects.toThrow(/invalides/);
  });

  it('🔴 REFUSE un jeton expiré', async () => {
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);
    const expiredToken = jwt.sign(
      { sub: 'user_3', role: 'admin' },
      realKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER, keyid: 'kid-real', expiresIn: -60 },
    );

    const provider = new KeycloakAuthProvider();
    await expect(provider.verifyIdToken(expiredToken)).rejects.toThrow(/invalides/);
  });

  it('🔴 REFUSE un jeton avec un issuer différent (rejoué depuis un autre realm)', async () => {
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);
    const wrongIssuerToken = jwt.sign(
      { sub: 'user_4', role: 'admin' },
      realKeyPair.privateKey,
      { algorithm: 'RS256', issuer: 'https://autre-realm.example/realms/autre', keyid: 'kid-real' },
    );

    const provider = new KeycloakAuthProvider();
    await expect(provider.verifyIdToken(wrongIssuerToken)).rejects.toThrow(/invalides/);
  });

  it('rafraîchit la JWKS une fois si le kid est inconnu (rotation de clé), puis accepte si elle apparaît', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      callCount++;
      if (url === `${ISSUER}/protocol/openid-connect/certs`) {
        // Premier appel : JWKS vide (avant rotation). Deuxième appel (refresh forcé) : la clé est là.
        const keys = callCount === 1 ? [] : [toJwk(realKeyPair.publicKey, 'kid-rotated')];
        return { ok: true, json: async () => ({ keys }) } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }));

    const token = jwt.sign(
      { sub: 'user_5', role: 'admin' },
      realKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER, keyid: 'kid-rotated' },
    );

    const provider = new KeycloakAuthProvider();
    const decoded = await provider.verifyIdToken(token);

    expect(decoded.uid).toBe('user_5');
    expect(callCount).toBe(2); // un seul refresh forcé, pas de boucle
  });

  it('🔴 REFUSE un jeton sans kid dans le header', async () => {
    mockJwksEndpoint(ISSUER, [toJwk(realKeyPair.publicKey, 'kid-real')]);
    // jsonwebtoken pose toujours un kid si keyid est fourni ; on simule son absence
    // en signant sans keyid.
    const noKidToken = jwt.sign(
      { sub: 'user_6', role: 'admin' },
      realKeyPair.privateKey,
      { algorithm: 'RS256', issuer: ISSUER },
    );

    const provider = new KeycloakAuthProvider();
    await expect(provider.verifyIdToken(noKidToken)).rejects.toThrow(/kid manquant/);
  });
});
