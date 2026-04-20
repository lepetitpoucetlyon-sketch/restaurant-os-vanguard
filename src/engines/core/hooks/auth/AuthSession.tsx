"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, firebaseApp } from '@/lib/firebase';
import { logger } from '@/lib/axiom';
import { IdentityManager, ROOT_ADMIN, type PersistedSession } from '@/domain/services/IdentityManager';
import { User } from '@/types';

const SESSION_STORAGE_KEY = 'executive_user_session_v2';
const LEGACY_SESSION_KEY = 'executive_user_session';

interface LoginWithPinResponse {
    token: string;
    user: User;
}

export function useAuthSession() {
    // 🛡️ Safe initialization for SSR
    const firebaseFunctions = typeof window !== 'undefined' ? getFunctions(firebaseApp) : null;
    
    const loginWithPinCallable = firebaseFunctions 
        ? httpsCallable<{ userId: string; pin: string }, LoginWithPinResponse>(firebaseFunctions, 'loginWithPin') 
        : null;

    const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
    const [isFirebaseAuthReady, setIsFirebaseAuthReady] = useState(false);
    const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (raw) {
                try {
                    return (JSON.parse(raw) as PersistedSession).userId;
                } catch (e) {}
            }
        }
        return null;
    });
    const sessionUserIdRef = useRef<string | null>(sessionUserId);

    // Initialization
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(LEGACY_SESSION_KEY);
            localStorage.removeItem('role_permissions');
        }

        void setPersistence(auth, browserSessionPersistence).catch((error) => {
            console.error('Unable to enforce browser-session Firebase persistence', error);
        });

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setFirebaseUserId(firebaseUser?.uid ?? null);
            setIsFirebaseAuthReady(true);

            if (!firebaseUser) {
                if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_STORAGE_KEY);
                sessionUserIdRef.current = null;
                setSessionUserId(null);
                return;
            }

            const nextSessionUserId = sessionUserIdRef.current ?? firebaseUser.uid;
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
        localStorage.removeItem(LEGACY_SESSION_KEY);
    };

    const loginWithFirebase = async (token: string) => {
        await signInWithCustomToken(auth, token);
    };

    const logoutFirebase = async () => {
        await signOut(auth);
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
        loginWithPinCallable
    };
}
