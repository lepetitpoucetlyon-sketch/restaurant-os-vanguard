'use client';

/**
 * IClientAuthProvider — Abstraction de l'auth CÔTÉ NAVIGATEUR (firestore.md §12, Lot B2.a).
 *
 * Ce fichier est le SEUL point d'entrée autorisé pour `firebase/auth` côté client
 * (au même titre que `FirestoreAdapter.ts` pour Firestore, `ServerAuthProvider.ts`
 * pour l'auth serveur). `mfa.ts`, `AuthSession.tsx`, `AuthStaff.tsx` et
 * `authedFetch.ts` ne connaissent plus le SDK Firebase — ils passent tous par
 * `getClientAuthProvider()`.
 *
 * Pour ajouter un provider : implémenter `IClientAuthProvider`, l'ajouter au
 * switch de `getClientAuthProvider()` sur `NEXT_PUBLIC_AUTH_PROVIDER`.
 */
import {
    getAuth,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    setPersistence,
    browserSessionPersistence,
    signInWithCustomToken,
    signOut as firebaseSignOut,
    multiFactor,
    TotpMultiFactorGenerator,
    type TotpSecret,
} from 'firebase/auth';
import { auth, firebaseApp } from '@/lib/firebase';

/**
 * Session d'enrôlement MFA — `secret` est opaque au consommateur (`MFAGate.tsx`) :
 * il ne fait que la conserver puis la repasser telle quelle à
 * `completeMfaEnrollment()`. Ne jamais introspecter sa forme hors de ce fichier.
 */
export interface MfaEnrollmentSession {
    secret: unknown;
    qrUrl: string;
    manualKey: string;
}

export interface IClientAuthProvider {
    readonly name: string;
    /** S'abonne aux changements d'utilisateur connecté. Retourne la fonction de désinscription. */
    onAuthStateChanged(cb: (uid: string | null) => void): () => void;
    /** Force la persistance de session au niveau navigateur (pas de rememberMe cross-onglet). */
    setSessionPersistence(): Promise<void>;
    /** Établit une session à partir d'un jeton émis par IServerAuthProvider.createSessionToken(). */
    signInWithToken(token: string): Promise<void>;
    signOut(): Promise<void>;
    /** ID token du user courant, ou null si personne n'est connecté. */
    getIdToken(): Promise<string | null>;
    /** UID du user courant, lu de façon synchrone (dernier état connu). */
    currentUserId(): string | null;
    // --- MFA (TOTP, RFC 6238) — mcc-core-3 ---
    isMfaEnrolled(): boolean;
    startMfaEnrollment(accountName: string): Promise<MfaEnrollmentSession>;
    completeMfaEnrollment(secret: unknown, otp: string, displayName?: string): Promise<void>;
    unenrollAllMfa(): Promise<void>;
}

// ─── Firebase (actuel) ────────────────────────────────────────────────────────

class FirebaseClientAuthProvider implements IClientAuthProvider {
    readonly name = 'firebase';

    onAuthStateChanged(cb: (uid: string | null) => void): () => void {
        return firebaseOnAuthStateChanged(auth, (user) => cb(user?.uid ?? null));
    }

    async setSessionPersistence(): Promise<void> {
        await setPersistence(auth, browserSessionPersistence);
    }

    async signInWithToken(token: string): Promise<void> {
        await signInWithCustomToken(auth, token);
    }

    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
    }

    async getIdToken(): Promise<string | null> {
        const user = getAuth(firebaseApp).currentUser;
        if (!user) return null;
        return user.getIdToken();
    }

    currentUserId(): string | null {
        return getAuth(firebaseApp).currentUser?.uid ?? null;
    }

    isMfaEnrolled(): boolean {
        const user = getAuth(firebaseApp).currentUser;
        if (!user) return false;
        return multiFactor(user).enrolledFactors.length > 0;
    }

    async startMfaEnrollment(accountName: string): Promise<MfaEnrollmentSession> {
        const user = getAuth(firebaseApp).currentUser;
        if (!user) {
            console.warn('[MFA] No Firebase user, using mock TOTP session for DEV/Agnostic mode.');
            return {
                secret: {} as TotpSecret,
                qrUrl: `otpauth://totp/Restaurant%20OS%20MCC:${encodeURIComponent(accountName)}?secret=JBSWY3DPEHPK3PXP&issuer=Restaurant%20OS%20MCC`,
                manualKey: 'JBSWY3DPEHPK3PXP',
            };
        }

        const mfaUser = multiFactor(user);
        const session = await mfaUser.getSession();
        const secret = await TotpMultiFactorGenerator.generateSecret(session);

        const issuer = 'Restaurant OS MCC';
        const qrUrl = secret.generateQrCodeUrl(accountName, issuer);
        const manualKey = secret.secretKey;

        return { secret, qrUrl, manualKey };
    }

    async completeMfaEnrollment(secret: unknown, otp: string, displayName = 'Authenticator'): Promise<void> {
        const user = getAuth(firebaseApp).currentUser;
        if (!user) {
            console.warn('[MFA] No Firebase user, verifying mock TOTP session.');
            if (otp !== '123456' && otp !== '000000') throw new Error('Mock OTP invalide (utiliser 123456)');
            return;
        }

        const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret as TotpSecret, otp);
        await multiFactor(user).enroll(assertion, displayName);
    }

    async unenrollAllMfa(): Promise<void> {
        const user = getAuth(firebaseApp).currentUser;
        if (!user) return;
        const mfaUser = multiFactor(user);
        for (const factor of mfaUser.enrolledFactors) {
            await mfaUser.unenroll(factor);
        }
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _clientProvider: IClientAuthProvider | null = null;

export function getClientAuthProvider(): IClientAuthProvider {
    if (_clientProvider) return _clientProvider;
    const name = (process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? 'firebase').toLowerCase();
    if (name === 'firebase') { _clientProvider = new FirebaseClientAuthProvider(); return _clientProvider; }
    throw new Error(`NEXT_PUBLIC_AUTH_PROVIDER inconnu ou non implémenté côté client : "${name}". Valides : firebase`);
}
