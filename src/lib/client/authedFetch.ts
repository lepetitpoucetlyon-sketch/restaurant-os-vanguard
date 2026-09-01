'use client';

import { getClientAuthProvider } from '@/lib/auth/clientAuthProvider';
import { MCC_DEV_MODE_CLIENT } from '@/lib/mcc/devMode';
import { DEV_PIN_BYPASS_HEADER } from '@/lib/authConstants';
import { isDevBypassActive } from '@/lib/auth/DevAuthBridge';

/**
 * fetch() authentifié pour les routes /api/admin.
 *
 * Attache le jeton d'auth de l'utilisateur courant (via IClientAuthProvider,
 * agnostique du provider) en header Authorization. Sans token valide côté
 * serveur (adminAuthGuard), la route répond 404 (sémantique « hidden door »).
 *
 * En développement, deux bypass sont acceptés :
 * - `NEXT_PUBLIC_MCC_DEV_MODE=true` (bypass niveau plateforme MCC).
 * - Bypass PIN dev tenant posé par attemptDevLogin (voir `DevAuthBridge` +
 *   useNexusAuthLogic.ts) quand le PIN dev est utilisé côté client.
 * Sans l'un ou l'autre, un throw explicite oblige les callers à gérer.
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const authProvider = getClientAuthProvider();
  const uid = authProvider.currentUserId();

  if (!uid) {
    if (MCC_DEV_MODE_CLIENT || isDevBypassActive()) {
      const headers = new Headers(init.headers);
      headers.set('Authorization', DEV_PIN_BYPASS_HEADER);
      return fetch(input, { ...init, headers });
    }
    throw new Error('[authedFetch] Aucun utilisateur connecté — appel admin refusé côté client.');
  }

  const token = await authProvider.getIdToken();
  if (!token) {
    throw new Error('[authedFetch] Jeton d\'authentification indisponible pour un utilisateur pourtant connecté.');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
