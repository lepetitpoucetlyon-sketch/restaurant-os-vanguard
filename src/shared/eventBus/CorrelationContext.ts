/**
 * CorrelationContext — propagation d'un correlationId dans le bus (audit S9).
 *
 * Une cascade de handlers déclenchée par UN event initial (ex: `order.paid` →
 * stock + loyalty + ticketZ + accounting + …) partage le MÊME `correlationId` :
 * on peut ainsi retrouver dans les logs tous les effets liés à un déclencheur.
 *
 * Deux canaux, un point d'entrée (`runWithCorrelation`) — même patron que
 * `ServerTenantStorage` : AsyncLocalStorage (serveur, portée async stricte) +
 * projection en global lu par le bus (pas d'import `node:async_hooks` côté
 * bus/client → bundle Turbopack sain).
 *
 * Fabrique par défaut d'un id court (base36 timestamp+random) suffisant pour
 * la corrélation intra-session ; remplacer par un UUID si besoin de collision-free
 * cross-instances.
 */

export interface CorrelationContext {
    correlationId: string;
    /** id de l'event qui a démarré la cascade — utile pour les logs de handlers indirects */
    rootEventId?: string;
}

const NEXUS_CORRELATION_GLOBAL_KEY = '__nexusCorrelation';

interface CorrelationGlobal {
    [NEXUS_CORRELATION_GLOBAL_KEY]?: CorrelationContext | undefined;
}

let _als: unknown | null = null; // AsyncLocalStorage<CorrelationContext> côté serveur uniquement

async function getAls(): Promise<{ run: <T>(ctx: CorrelationContext, fn: () => T) => T; getStore: () => CorrelationContext | undefined } | null> {
    if (typeof window !== 'undefined') return null;
    if (_als) return _als as never;
    try {
        const mod = await import('node:async_hooks');
        _als = new mod.AsyncLocalStorage<CorrelationContext>();
        return _als as never;
    } catch {
        return null;
    }
}

/** Génère un correlationId court, unique intra-session. */
export function newCorrelationId(): string {
    const t = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 8);
    return `cor_${t}${r}`;
}

/**
 * Retourne le contexte de corrélation courant, s'il existe.
 * Préfère l'ALS (portée async stricte), retombe sur le global (posé par `runWithCorrelation`).
 */
export function getCorrelationContext(): CorrelationContext | undefined {
    const g = globalThis as unknown as CorrelationGlobal;
    return g[NEXUS_CORRELATION_GLOBAL_KEY];
}

/**
 * Exécute `fn` en ayant ancré `ctx` comme contexte de corrélation courant.
 * Sur le serveur : AsyncLocalStorage + projection globale synchronisée.
 * Sur le client : projection globale uniquement.
 */
export async function runWithCorrelation<T>(ctx: CorrelationContext, fn: () => T | Promise<T>): Promise<T> {
    const g = globalThis as unknown as CorrelationGlobal;
    const previous = g[NEXUS_CORRELATION_GLOBAL_KEY];
    g[NEXUS_CORRELATION_GLOBAL_KEY] = ctx;
    try {
        const als = await getAls();
        if (als) return await als.run(ctx, fn as () => T);
        return await fn();
    } finally {
        if (previous === undefined) delete g[NEXUS_CORRELATION_GLOBAL_KEY];
        else g[NEXUS_CORRELATION_GLOBAL_KEY] = previous;
    }
}
