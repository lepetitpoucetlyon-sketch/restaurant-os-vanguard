import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexte tenant serveur ancré PAR REQUÊTE.
 *
 * Deux canaux, un seul point d'entrée (`runWith`) :
 *  1. AsyncLocalStorage : source de vérité stricte, portée à la callback.
 *     Utilisé côté serveur pour tout ce qui peut appeler `getStore()`.
 *  2. `globalThis.__nexusServerTenant` : projection en variable globale,
 *     lue par `NexusManager.activeTenant` (getter synchrone qui ne peut PAS
 *     importer `node:async_hooks` sans polluer le bundle client Turbopack —
 *     cf. échec build /_not-found/page avec async_hooks external non supporté).
 *
 * L'entrée du contexte est atomique : les deux canaux voient la même chose.
 * `import 'server-only'` garantit qu'aucun composant client ne peut aspirer
 * ce module par erreur.
 */

export interface ServerTenantContext {
  tenantId: string;
  role?: string;
  userId?: string;
  isMcc?: boolean;
}

const storage = new AsyncLocalStorage<ServerTenantContext>();

// Projection en global lu par NexusAdapter (client-safe : la valeur reste undefined
// dans le bundle client car aucun code client ne peut poser cette clé).
const NEXUS_TENANT_GLOBAL_KEY = '__nexusServerTenant';

interface NexusTenantGlobal {
  [NEXUS_TENANT_GLOBAL_KEY]?: ServerTenantContext | undefined;
}

/**
 * Exécute `fn` en ayant ancré `context` comme tenant courant serveur.
 * À utiliser dans un middleware d'auth / au tout début d'un route handler.
 */
export function runWithServerTenant<T>(context: ServerTenantContext, fn: () => T): T {
  const g = globalThis as unknown as NexusTenantGlobal;
  const previous = g[NEXUS_TENANT_GLOBAL_KEY];
  g[NEXUS_TENANT_GLOBAL_KEY] = context;
  try {
    return storage.run(context, fn);
  } finally {
    // Restauration du precedent (nested runWith supporté)
    if (previous === undefined) delete g[NEXUS_TENANT_GLOBAL_KEY];
    else g[NEXUS_TENANT_GLOBAL_KEY] = previous;
  }
}

/**
 * Retourne le contexte courant si dans une callback `runWithServerTenant`.
 * Préfère l'AsyncLocalStorage (portée stricte), retombe sur le global si
 * l'appelant est en dehors d'un stack async lié (rare, mais possible).
 */
export function getServerTenantContext(): ServerTenantContext | undefined {
  const fromAls = storage.getStore();
  if (fromAls) return fromAls;
  const g = globalThis as unknown as NexusTenantGlobal;
  return g[NEXUS_TENANT_GLOBAL_KEY];
}

/**
 * @deprecated Ancienne API. Utiliser `runWithServerTenant` / `getServerTenantContext`.
 * Conservé pour compat avec `Nexus.activeTenant` qui ne peut pas importer
 * node:async_hooks sans casser le bundle client.
 */
export const ServerTenantStorage = {
  getStore: getServerTenantContext,
  run: runWithServerTenant,
};
