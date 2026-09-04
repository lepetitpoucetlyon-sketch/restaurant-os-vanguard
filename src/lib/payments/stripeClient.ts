import Stripe from 'stripe';

/**
 * Fabrique Stripe centralisée (audit S10 — résilience des appels externes).
 *
 * - `timeout: 8000` → « échouer vite » : le défaut du SDK Stripe est 80s, ce qui
 *   bloque un thread serveur très longtemps quand Stripe est lent/indisponible.
 * - `maxNetworkRetries: 1` → un seul retry (backoff intégré Stripe) sur erreur réseau.
 * - `apiVersion` centralisée ici (avant : dupliquée sur ~10 sites d'instanciation).
 *
 * Tout code qui a besoin d'un client Stripe DOIT passer par `getStripe(key)`.
 */
export function getStripe(apiKey: string): Stripe {
    return new Stripe(apiKey, {
        apiVersion: '2026-08-26.dahlia',
        timeout: 8_000,
        maxNetworkRetries: 1,
    });
}
