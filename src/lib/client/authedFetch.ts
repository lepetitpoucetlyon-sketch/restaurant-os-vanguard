'use client';

import { auth } from '@/lib/firebase';
import { MCC_DEV_MODE_CLIENT } from '@/lib/mcc/devMode';
import { DEV_PIN_BYPASS_KEY, DEV_PIN_BYPASS_HEADER } from '@/lib/authConstants';

/**
 * fetch() authentifié pour les routes /api/admin.
 *
 * Attache le JWT Firebase de l'utilisateur courant en header Authorization.
 * Sans token valide côté serveur (adminAuthGuard), la route répond 404
 * (sémantique « hidden door »).
 *
 * En développement, deux bypass sont acceptés :
 * - `NEXT_PUBLIC_MCC_DEV_MODE=true` (bypass niveau plateforme MCC).
 * - Flag sessionStorage `DEV_PIN_BYPASS_KEY` posé par attemptDevLogin
 *   quand le PIN dev tenant est utilisé (voir useNexusAuthLogic.ts).
 * Sans l'un ou l'autre, un throw explicite oblige les callers à gérer.
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    const hasDevPinBypass =
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(DEV_PIN_BYPASS_KEY) !== null;

    if (MCC_DEV_MODE_CLIENT || hasDevPinBypass) {
      const headers = new Headers(init.headers);
      headers.set('Authorization', DEV_PIN_BYPASS_HEADER);
      return fetch(input, { ...init, headers });
    }
    throw new Error('[authedFetch] Aucun utilisateur connecté — appel admin refusé côté client.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
