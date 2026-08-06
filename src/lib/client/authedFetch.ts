'use client';

import { auth } from '@/lib/firebase';
import { MCC_DEV_MODE_CLIENT } from '@/lib/mcc/devMode';

/**
 * fetch() authentifié pour les routes /api/admin.
 *
 * Attache le JWT Firebase de l'utilisateur courant en header Authorization.
 * Sans token valide côté serveur (adminAuthGuard), la route répond 404
 * (sémantique « hidden door »).
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    if (MCC_DEV_MODE_CLIENT) {
      const headers = new Headers(init.headers);
      headers.set('Authorization', 'Bearer mcc-dev-bypass');
      return fetch(input, { ...init, headers });
    }
    throw new Error('[authedFetch] Aucun utilisateur connecté — appel admin refusé côté client.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
