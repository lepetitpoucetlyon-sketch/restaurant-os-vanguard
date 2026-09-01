"use client";

import { useState, useEffect, useRef } from 'react';
import { getClientAuthProvider } from '@/lib/auth/clientAuthProvider';
import type { PersistedSession } from '@/lib/IdentityManager';
import type { User } from '@nexus/contracts';
import { clearDevBypass, isDevBypassActive } from '@/lib/auth/DevAuthBridge';
import { logger } from '@/lib/logger';

const SESSION_STORAGE_KEY = 'executive_user_session_v2';
const LEGACY_SESSION_KEY = 'executive_user_session';

interface LoginWithPinResponse {
    token: string;
    user: User;
}

function readInitialSessionUserId(): string | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
        return (JSON.parse(raw) as PersistedSession).userId;
    } catch (_e) {
        return null;
    }
}

function resolveDevBypassUserId(): string | null {
    if (!isDevBypassActive() || typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
        return (JSON.parse(raw) as PersistedSession).userId;
    } catch (_e) {
        return null;
    }
}

export function useAuthSession() {
    const authProvider = getClientAuthProvider();

    const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
    const [isFirebaseAuthReady, setIsFirebaseAuthReady] = useState(false);
    const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(readInitialSessionUserId);
    const sessionUserIdRef = useRef<string | null>(sessionUserId);

    // Initialization
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(LEGACY_SESSION_KEY);
            localStorage.removeItem('role_permissions');
        }

        void authProvider.setSessionPersistence().catch((error) => {
            logger.error('Unable to enforce browser-session auth persistence', error);
        });

        const unsubscribe = authProvider.onAuthStateChanged((uid) => {
            setFirebaseUserId(uid);
            setIsFirebaseAuthReady(true);

            if (!uid) {
                const devBypassUserId = resolveDevBypassUserId();
                if (devBypassUserId) {
                    sessionUserIdRef.current = devBypassUserId;
                    setSessionUserId(devBypassUserId);
                    return;
                }
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                }
                clearDevBypass();
                sessionUserIdRef.current = null;
                setSessionUserId(null);
                return;
            }

            const nextSessionUserId = sessionUserIdRef.current ?? uid;
            sessionUserIdRef.current = nextSessionUserId;
            setSessionUserId(nextSessionUserId);

            if (typeof window !== 'undefined') {
                const payload: PersistedSession = { userId: nextSessionUserId, lastAuthenticatedAt: new Date().toISOString() };
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
            }
        });

        return unsubscribe;
    }, []);

    const persistSession = (userId: string) => {
        if (typeof window === 'undefined') return;
        const payload: PersistedSession = { userId, lastAuthenticatedAt: new Date().toISOString() };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    };

    const clearPersistedSession = () => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        clearDevBypass();
        localStorage.removeItem(LEGACY_SESSION_KEY);
    };

    const loginWithFirebase = async (token: string) => {
        await authProvider.signInWithToken(token);
    };

    const logoutFirebase = async () => {
        await authProvider.signOut();
    };

    /**
     * Remplace l'ancien loginWithPinCallable (httpsCallable Cloud Function) par
     * un appel à /api/auth/login-pin (firestore.md §12 Lot B2.b/B2.e).
     */
    const loginWithPin = async (userId: string, pin: string): Promise<LoginWithPinResponse> => {
        const res = await fetch('/api/auth/login-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pin }),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({} as { error?: string }));
            throw new Error(body?.error ?? `login-pin a échoué (${res.status})`);
        }
        return res.json() as Promise<LoginWithPinResponse>;
    };

    return {
        firebaseUserId,
        isFirebaseAuthReady,
        isTwoFactorVerified,
        setIsTwoFactorVerified,
        sessionUserId,
        setSessionUserId,
        sessionUserIdRef,
        persistSession,
        clearPersistedSession,
        loginWithFirebase,
        logoutFirebase,
        loginWithPin,
    };
}
