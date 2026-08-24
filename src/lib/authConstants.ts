/**
 * Constantes partagées entre le client (attemptDevLogin, AuthSession, authedFetch)
 * et le serveur (requireAnyAuth, adminAuthGuard) pour le bypass PIN dev tenant.
 * NE PAS RENOMMER SANS METTRE À JOUR LES CALL SITES.
 */
export const DEV_PIN_BYPASS_KEY = 'executive_dev_bypass_active';
export const DEV_PIN_BYPASS_HEADER = 'Bearer mcc-dev-bypass';
