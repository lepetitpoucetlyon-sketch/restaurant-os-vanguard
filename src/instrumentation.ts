/**
 * Next.js instrumentation — exécuté une seule fois au démarrage du serveur,
 * AVANT tout traitement de requête.
 *
 * On y enregistre l'adapter Nexus côté serveur (Admin SDK) pour que les ~75 routes
 * API qui appellent `Nexus.adapter` disposent d'un adapter fonctionnel. Uniquement
 * dans le runtime Node.js (firebase-admin n'existe pas sur l'Edge runtime).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureServerNexus } = await import('@/lib/nexus/serverNexus');
    ensureServerNexus();
  }
}
