import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexte tenant serveur ancré PAR REQUÊTE.
 *
 * Un seul contexte, deux surfaces de lecture :
 *  1. AsyncLocalStorage : source de vérité stricte, portée à la callback.
 *  2. `globalThis.__nexusServerTenant` : accesseur synchrone compatible avec
 *     `NexusAdapter`, qui ne peut pas importer `node:async_hooks` sans polluer
 *     le bundle client Turbopack.
 *
 * La propriété globale est un GETTER, pas une valeur mutable. Lorsqu'un module
 * client-safe la lit côté serveur, le getter consulte l'AsyncLocalStorage de la
 * requête en cours. Deux requêtes concurrentes ne peuvent donc pas s'écraser.
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

// Accesseur global lu par NexusAdapter. Le module est server-only : le getter n'est
// jamais installé dans un bundle client.
const NEXUS_TENANT_GLOBAL_KEY = '__nexusServerTenant';

interface NexusTenantGlobal {
  [NEXUS_TENANT_GLOBAL_KEY]?: ServerTenantContext | undefined;
}

function installTenantContextAccessor(): void {
  const g = globalThis as unknown as NexusTenantGlobal;
  const descriptor = Object.getOwnPropertyDescriptor(g, NEXUS_TENANT_GLOBAL_KEY);

  // Ce module peut être réévalué en développement. On conserve l'accesseur déjà
  // installé plutôt que de remplacer une propriété non configurable d'un hôte.
  if (descriptor?.get || descriptor?.configurable === false) return;

  Object.defineProperty(g, NEXUS_TENANT_GLOBAL_KEY, {
    configurable: true,
    enumerable: false,
    get: (): ServerTenantContext | undefined => storage.getStore(),
  });
}

installTenantContextAccessor();

/**
 * Exécute `fn` en ayant ancré `context` comme tenant courant serveur.
 * À utiliser dans un middleware d'auth / au tout début d'un route handler.
 */
export function runWithServerTenant<T>(context: ServerTenantContext, fn: () => T): T {
  return storage.run(context, fn);
}

/**
 * Ancre le contexte dans la chaîne asynchrone courante.
 *
 * Les gardes d'authentification l'appellent après avoir validé le JWT et résolu
 * le tenant. `enterWith` est nécessaire ici : la route poursuit son exécution
 * APRÈS le `await requireTenant…()`, donc elle ne peut pas être enveloppée par
 * la callback synchrone de la garde. Chaque requête garde néanmoins son propre
 * store AsyncLocalStorage, y compris après des `await` successifs.
 */
export function bindServerTenantContext(context: ServerTenantContext): void {
  storage.enterWith(context);
}

/**
 * Retourne le contexte courant si dans une callback `runWithServerTenant`.
 * Préfère l'AsyncLocalStorage (portée stricte), retombe sur le global si
 * l'appelant est en dehors d'un stack async lié (rare, mais possible).
 */
export function getServerTenantContext(): ServerTenantContext | undefined {
  return storage.getStore();
}

/**
 * @deprecated Ancienne API. Utiliser `runWithServerTenant` / `getServerTenantContext`.
 * Conservé pour compat avec `Nexus.activeTenant` qui ne peut pas importer
 * node:async_hooks sans casser le bundle client.
 */
export const ServerTenantStorage = {
  getStore: getServerTenantContext,
  run: runWithServerTenant,
  bind: bindServerTenantContext,
};
