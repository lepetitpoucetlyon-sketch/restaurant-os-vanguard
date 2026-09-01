/**
 * ServerAuthProvider — Interface d'abstraction du provider d'authentification serveur.
 *
 * Actuellement : Firebase Admin SDK (démo + prod initiale).
 * Migration future : Keycloak (OVH) ou NextAuth custom JWT (Hostinger).
 *
 * Pour switcher de provider :
 *   1. Implémenter IServerAuthProvider
 *   2. Changer AUTH_PROVIDER env var : 'firebase' | 'keycloak' | 'custom-jwt'
 *   3. Mettre à jour firebase-admin-init.ts si nécessaire
 *
 * Législation française (OVH/Hostinger) :
 *   - Données hébergées en France → SecNumCloud si données de santé, sinon HDS
 *   - OVH Object Storage : S3-compatible, région GRA (Gravelines) ou SBG (Strasbourg)
 *   - PostgreSQL OVH Managed : remplace Firestore côté BDD (adapter Nexus à écrire)
 *   - Keycloak : remplace Firebase Auth (SSO SAML2/OIDC, hébergeable on-premise OVH)
 */

export interface DecodedAuthToken {
    uid:      string;
    email?:   string;
    role?:    string;
    tenantId?: string;
    clientId?: string;
    /** true si la session a été établie avec un second facteur. */
    mfaUsed?: boolean;
}

export interface AuthUser {
    uid: string;
    email?: string;
    displayName?: string;
    customClaims?: Record<string, unknown>;
    /** true si le compte a au moins un second facteur enrôlé. */
    mfaEnrolled?: boolean;
}

export interface IServerAuthProvider {
    readonly name: string;
    verifyIdToken(token: string): Promise<DecodedAuthToken>;
    /** Crée un utilisateur. uid optionnel (auto-généré si absent). password optionnel (ex: login par PIN). */
    createUser(params: { email: string; password?: string; displayName?: string; uid?: string; emailVerified?: boolean }): Promise<{ uid: string }>;
    /** Retourne null si l'utilisateur n'existe pas (ne throw jamais). */
    getUserByEmail(email: string): Promise<AuthUser | null>;
    /** Retourne null si l'uid est inconnu (ne throw jamais). */
    getUser(uid: string): Promise<AuthUser | null>;
    setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void>;
    deleteUser(uid: string): Promise<void>;
}

// ─── Firebase Admin (actuel) ─────────────────────────────────────────────────

export class FirebaseAuthProvider implements IServerAuthProvider {
    readonly name = 'firebase';

    async verifyIdToken(token: string): Promise<DecodedAuthToken> {
        const { getAuth } = await import('firebase-admin/auth');
        const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
        initFirebaseAdmin();
        const decoded = await getAuth().verifyIdToken(token);
        return {
            uid:      decoded.uid,
            email:    decoded.email,
            role:     typeof decoded.role === 'string' ? decoded.role : undefined,
            tenantId: typeof decoded.tenantId === 'string' ? decoded.tenantId : undefined,
            clientId: typeof decoded.clientId === 'string' ? decoded.clientId : undefined,
            mfaUsed:  !!decoded.firebase?.sign_in_second_factor,
        };
    }

    async createUser(params: { email: string; password?: string; displayName?: string; uid?: string; emailVerified?: boolean }) {
        const { getAuth } = await import('firebase-admin/auth');
        const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
        initFirebaseAdmin();
        const { email, password, displayName, uid, emailVerified } = params;
        const user = await getAuth().createUser({
            ...(uid         ? { uid }         : {}),
            ...(password    ? { password }    : {}),
            ...(displayName ? { displayName } : {}),
            email,
            emailVerified: emailVerified ?? false,
        });
        return { uid: user.uid };
    }

    async getUserByEmail(email: string): Promise<AuthUser | null> {
        try {
            const { getAuth } = await import('firebase-admin/auth');
            const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
            initFirebaseAdmin();
            const user = await getAuth().getUserByEmail(email);
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                customClaims: user.customClaims as Record<string, unknown> | undefined,
                mfaEnrolled: (user.multiFactor?.enrolledFactors?.length ?? 0) > 0,
            };
        } catch {
            return null;
        }
    }

    async getUser(uid: string): Promise<AuthUser | null> {
        try {
            const { getAuth } = await import('firebase-admin/auth');
            const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
            initFirebaseAdmin();
            const user = await getAuth().getUser(uid);
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                customClaims: user.customClaims as Record<string, unknown> | undefined,
                mfaEnrolled: (user.multiFactor?.enrolledFactors?.length ?? 0) > 0,
            };
        } catch {
            return null;
        }
    }

    async setCustomClaims(uid: string, claims: Record<string, unknown>) {
        const { getAuth } = await import('firebase-admin/auth');
        const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
        initFirebaseAdmin();
        await getAuth().setCustomUserClaims(uid, claims);
    }

    async deleteUser(uid: string) {
        const { getAuth } = await import('firebase-admin/auth');
        const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
        initFirebaseAdmin();
        await getAuth().deleteUser(uid);
    }
}

import jwt from 'jsonwebtoken';
import { createPublicKey, type KeyObject } from 'crypto';

// ─── Keycloak / OIDC (migration OVH) — squelette à compléter ─────────────────

/**
 * Cache JWKS en mémoire process (firestore.md §12 G.2.1). Un realm Keycloak ne
 * tourne pas ses clés plus d'une fois par heure en pratique ; 10 min de TTL
 * couvre la rotation sans re-fetch à chaque requête.
 */
interface JwksCacheEntry {
    keys: Map<string, KeyObject>;
    fetchedAt: number;
}
const JWKS_CACHE = new Map<string, JwksCacheEntry>();
const JWKS_TTL_MS = 10 * 60 * 1000;

async function fetchJwks(issuer: string, forceRefresh: boolean): Promise<Map<string, KeyObject>> {
    const cached = JWKS_CACHE.get(issuer);
    if (!forceRefresh && cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) {
        return cached.keys;
    }

    const res = await fetch(`${issuer}/protocol/openid-connect/certs`);
    if (!res.ok) {
        throw new Error(`[Keycloak] Échec récupération JWKS (${res.status}) — issuer=${issuer}`);
    }
    const body = await res.json() as { keys?: Array<Record<string, unknown>> };
    const keys = new Map<string, KeyObject>();
    for (const jwk of body.keys ?? []) {
        const kid = jwk.kid;
        if (typeof kid !== 'string') continue;
        // Node >= 15 : construit directement une clé publique depuis un JWK RSA/EC —
        // aucune dépendance externe (jose/jwks-rsa) nécessaire.
        try {
            keys.set(kid, createPublicKey({ key: jwk as unknown as Record<string, string>, format: 'jwk' }));
        } catch {
            // Clé JWK non RSA/EC ou malformée — ignorée plutôt que de faire échouer tout le jeu de clés.
        }
    }
    JWKS_CACHE.set(issuer, { keys, fetchedAt: Date.now() });
    return keys;
}

export class KeycloakAuthProvider implements IServerAuthProvider {
    readonly name = 'keycloak';
    private readonly issuer: string;
    private readonly audience: string | undefined;

    constructor() {
        this.issuer = process.env.KEYCLOAK_ISSUER ?? 'https://auth.restaurant-os.app/realms/restaurantos';
        this.audience = process.env.KEYCLOAK_AUDIENCE;
    }

    /**
     * Vérifie la SIGNATURE du jeton via la JWKS du realm (RFC 7517), pas seulement
     * son contenu. `jwt.decode()` seul ne fait AUCUNE vérification cryptographique —
     * un jeton forgé à la main serait accepté. Voir firestore.md §12 G.2.1.
     */
    async verifyIdToken(token: string): Promise<DecodedAuthToken> {
        const unverifiedHeader = jwt.decode(token, { complete: true })?.header;
        const kid = unverifiedHeader?.kid;
        if (!kid) {
            throw new Error('Invalid Keycloak ID token — kid manquant dans le header');
        }

        let keys = await fetchJwks(this.issuer, false);
        let key = keys.get(kid);
        if (!key) {
            // Rotation de clé possible depuis le dernier cache — un seul refresh forcé, pas de boucle.
            keys = await fetchJwks(this.issuer, true);
            key = keys.get(kid);
        }
        if (!key) {
            throw new Error(`Invalid Keycloak ID token — kid inconnu de la JWKS (${kid})`);
        }

        let decoded: Record<string, unknown>;
        try {
            decoded = jwt.verify(token, key, {
                algorithms: ['RS256', 'ES256'],
                issuer: this.issuer,
                ...(this.audience ? { audience: this.audience } : {}),
            }) as Record<string, unknown>;
        } catch (err) {
            throw new Error(`Invalid Keycloak ID token — signature/claims invalides (${err instanceof Error ? err.message : String(err)})`);
        }

        const amr = Array.isArray(decoded.amr) ? decoded.amr as unknown[] : [];
        return {
            uid:      String(decoded.sub ?? ''),
            email:    typeof decoded.email === 'string' ? decoded.email : undefined,
            role:     typeof decoded.role === 'string' ? decoded.role :
                      (Array.isArray(decoded.roles) ? decoded.roles[0] : undefined),
            tenantId: typeof decoded.tenantId === 'string' ? decoded.tenantId : undefined,
            // amr (Authentication Methods Reference, OIDC standard) contient 'otp'/'mfa' quand un
            // second facteur a été utilisé pour établir la session — équivalent Keycloak de
            // decoded.firebase.sign_in_second_factor côté FirebaseAuthProvider.
            mfaUsed:  amr.some(m => typeof m === 'string' && ['otp', 'mfa', 'hwk'].includes(m)),
        };
    }

    async createUser(_params: { email: string; password?: string; displayName?: string; uid?: string; emailVerified?: boolean }): Promise<{ uid: string }> {
        // Appel API REST Keycloak Admin — à implémenter avec KEYCLOAK_ADMIN_SECRET
        throw new Error('KeycloakAuthProvider.createUser — not yet implemented. Use Keycloak Admin REST API.');
    }

    async getUserByEmail(_email: string): Promise<AuthUser | null> {
        return null;
    }

    async getUser(_uid: string): Promise<AuthUser | null> {
        return null;
    }

    async setCustomClaims(_uid: string, _claims: Record<string, unknown>): Promise<void> {
        // Mapper les claims vers les attributs utilisateur Keycloak
        throw new Error('KeycloakAuthProvider.setCustomClaims — not yet implemented.');
    }

    async deleteUser(_uid: string): Promise<void> {
        throw new Error('KeycloakAuthProvider.deleteUser — not yet implemented.');
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let _provider: IServerAuthProvider | null = null;

export function getServerAuthProvider(): IServerAuthProvider {
    if (_provider) return _provider;
    const name = (process.env.AUTH_PROVIDER ?? 'firebase').toLowerCase();
    if (name === 'firebase')  { _provider = new FirebaseAuthProvider();  return _provider; }
    if (name === 'keycloak')  { _provider = new KeycloakAuthProvider();   return _provider; }
    throw new Error(`AUTH_PROVIDER inconnu : "${name}". Valides : firebase | keycloak`);
}
