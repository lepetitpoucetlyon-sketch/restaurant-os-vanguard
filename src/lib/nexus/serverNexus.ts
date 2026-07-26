import 'server-only';
import { Nexus } from './NexusAdapter';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { FirestoreServerAdapter } from '@/infrastructure/adapters/FirestoreServerAdapter';
import { logger } from '@/lib/logger';

let registered = false;

/**
 * Enregistre l'adapter Nexus côté serveur (Admin SDK), une seule fois.
 * Idempotent et TOLÉRANT : si `FIREBASE_SERVICE_ACCOUNT_JSON` est absent (dev sans
 * service account), on ne bloque pas le démarrage — on log un avertissement et on
 * laisse `Nexus.adapter` non enregistré (les routes qui l'utilisent échoueront
 * explicitement au lieu de faire planter tout le serveur au boot).
 *
 * Appelé au démarrage par `src/instrumentation.ts`, et sûr à appeler depuis une
 * route API par précaution.
 */
export function ensureServerNexus(): void {
  if (registered) return;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    logger.warn(
      '[Nexus] FIREBASE_SERVICE_ACCOUNT_JSON absent — adapter serveur NON enregistré. ' +
      'Les routes API utilisant Nexus.adapter renverront une erreur explicite.',
    );
    return;
  }

  initFirebaseAdmin();
  Nexus.registerServerAdapter(new FirestoreServerAdapter());
  registered = true;
}
