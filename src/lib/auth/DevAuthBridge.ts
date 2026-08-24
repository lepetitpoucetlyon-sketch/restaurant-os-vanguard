/**
 * DevAuthBridge — surface unique pour le bypass PIN dev tenant.
 *
 * Le flag `DEV_PIN_BYPASS_KEY` en sessionStorage est posé par `attemptDevLogin`
 * (useNexusAuthLogic) quand le PIN dev `9999` (ou un PIN utilisateur matché
 * localement) est validé. Il permet ensuite à `AuthSession.onAuthStateChanged`
 * de ne PAS purger la session côté null-user branch (Firebase absent), et à
 * `authedFetch` d'attacher le header `mcc-dev-bypass` sur les appels admin.
 *
 * Toutes les opérations sont no-op :
 *   - hors `NODE_ENV === 'development'` (pour les lectures/écritures de flag),
 *   - côté serveur (`typeof window === 'undefined'`).
 *
 * `clearDevBypass` est volontairement autorisé en prod aussi : un flag résiduel
 * (build downgrade, cross-env) doit toujours pouvoir être purgé.
 */
import { DEV_PIN_BYPASS_KEY } from '@/lib/authConstants';

const isDev = () => process.env.NODE_ENV === 'development';
const hasWindow = () => typeof window !== 'undefined';

/** Marque une session dev active (appelée par attemptDevLogin). */
export function markDevBypassActive(userId: string): void {
  if (!isDev() || !hasWindow()) return;
  window.sessionStorage.setItem(DEV_PIN_BYPASS_KEY, userId);
}

/** Retire le marqueur (logout, wipe session, purge résiduelle). */
export function clearDevBypass(): void {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(DEV_PIN_BYPASS_KEY);
}

/** Vérifie si un bypass dev est actif (dev + client only). */
export function isDevBypassActive(): boolean {
  if (!isDev() || !hasWindow()) return false;
  return window.sessionStorage.getItem(DEV_PIN_BYPASS_KEY) !== null;
}
