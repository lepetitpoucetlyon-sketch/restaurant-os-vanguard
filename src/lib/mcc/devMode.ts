/**
 * MCC_DEV_MODE — source unique de vérité pour le bypass développeur MCC.
 *
 * Côté client  : NEXT_PUBLIC_MCC_DEV_MODE=true dans .env.local
 * Côté serveur : MCC_DEV_MODE=true dans .env.local
 *
 * Ces variables remplacent l'ancienne NEXT_PUBLIC_MCC_DEV_BYPASS.
 * Ne jamais positionner à true sur un environnement partagé ou en production.
 */

/** Bypass client (composants React, hooks, providers). */
export const MCC_DEV_MODE_CLIENT =
  process.env.NEXT_PUBLIC_MCC_DEV_MODE === 'true';

/** Bypass serveur (route handlers, guards). Toujours faux hors Node.js. */
export const MCC_DEV_MODE_SERVER =
  process.env.MCC_DEV_MODE === 'true';
