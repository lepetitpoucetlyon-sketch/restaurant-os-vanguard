import 'server-only';
import { Nexus } from './NexusAdapter';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { createServerAdapter } from './providerFactory';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

let registered = false;

/**
 * Enregistre l'adapter Nexus côté serveur (Admin SDK / Memory / Mock), une seule fois.
 */
export async function ensureServerNexus(): Promise<void> {
  if (registered) return;

  try {
    const adapter = await createServerAdapter();
    if (adapter) {
      if (process.env.DB_PROVIDER === 'firestore' || !process.env.DB_PROVIDER) {
        initFirebaseAdmin();
      }
      Nexus.registerServerAdapter(adapter);
      registered = true;
    } else {
      logger.warn(
        '[Nexus] Adapter serveur NON enregistré. ' +
        'Les routes API utilisant Nexus.adapter renverront une erreur explicite.',
      );
    }
  } catch (err) {
    logger.warn('[Nexus] Erreur enregistrement adapter serveur', { error: toError(err).message });
  }
}
