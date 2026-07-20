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
}

export interface IServerAuthProvider {
    readonly name: string;
    verifyIdToken(token: string): Promise<DecodedAuthToken>;
    createUser(params: { email: string; password: string; displayName?: string }): Promise<{ uid: string }>;
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
        };
    }

    async createUser(params: { email: string; password: string; displayName?: string }) {
        const { getAuth } = await import('firebase-admin/auth');
        const { initFirebaseAdmin } = await import('@/lib/firebase-admin-init');
        initFirebaseAdmin();
        const user = await getAuth().createUser(params);
        return { uid: user.uid };
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

// ─── Keycloak / OIDC (migration OVH) — squelette à compléter ─────────────────

export class KeycloakAuthProvider implements IServerAuthProvider {
    readonly name = 'keycloak';
    private readonly issuer: string;

    constructor() {
        this.issuer = process.env.KEYCLOAK_ISSUER ?? 'https://auth.restaurant-os.app/realms/restaurantos';
    }

    async verifyIdToken(token: string): Promise<DecodedAuthToken> {
        // Vérification JWT OIDC via jose (npm i jose)
        const { createRemoteJWKSet, jwtVerify } = await import('jose' as string) as {
            createRemoteJWKSet: (url: URL) => unknown;
            jwtVerify: (token: string, jwks: unknown) => Promise<{ payload: Record<string, unknown> }>;
        };
        const JWKS = createRemoteJWKSet(new URL(`${this.issuer}/protocol/openid-connect/certs`));
        const { payload } = await jwtVerify(token, JWKS);
        return {
            uid:      String(payload.sub ?? ''),
            email:    typeof payload.email === 'string' ? payload.email : undefined,
            role:     typeof payload.role === 'string' ? payload.role :
                      (Array.isArray(payload.roles) ? payload.roles[0] : undefined),
            tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
        };
    }

    async createUser(_params: { email: string; password: string; displayName?: string }): Promise<{ uid: string }> {
        // Appel API REST Keycloak Admin — à implémenter avec KEYCLOAK_ADMIN_SECRET
        throw new Error('KeycloakAuthProvider.createUser — not yet implemented. Use Keycloak Admin REST API.');
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
