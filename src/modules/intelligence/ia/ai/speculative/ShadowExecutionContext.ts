/**
 * ⚡ ShadowExecutionContext — Speculative Execution Worker & Promise Cache
 * 
 * Exécute les requêtes d'outils spéculatives en tâche de fond isolée pendant
 * que le modèle continue d'émettre des tokens.
 * Met en cache les promesses en vol pour une résolution instantanée à l'arrivée.
 */

import { logger } from '@/lib/logger';
import { SovereignToolMembrane } from './SovereignToolMembrane';

export interface SpeculativeExecutionResult<T = unknown> {
  toolId: string;
  params: Record<string, unknown>;
  data: T;
  executionDurationMs: number;
  speculativeLeadTimeMs: number; // Temps d'avance gagné par rapport à la fin du stream
  wasSpeculated: boolean;
}

interface CachedPromiseEntry {
  toolId: string;
  params: Record<string, unknown>;
  paramsKey: string;
  promise: Promise<unknown>;
  launchedAt: number;
  expiresAt: number;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  result?: unknown;
  error?: Error;
}

export type ToolExecutorFunction = (toolId: string, params: Record<string, unknown>) => Promise<unknown>;

export class ShadowExecutionContext {
  private static readonly DEFAULT_TTL_MS = 10000;
  private cache = new Map<string, CachedPromiseEntry>();
  private executor: ToolExecutorFunction;

  constructor(customExecutor: ToolExecutorFunction) {
    this.executor = customExecutor;
  }

  /**
   * Génère une clé de cache déterministe pour un appel d'outil et ses paramètres.
   */
  private generateKey(toolId: string, params: Record<string, unknown>): string {
    const sortedKeys = Object.keys(params).sort();
    const sortedParams = sortedKeys.reduce((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {} as Record<string, unknown>);
    return `${toolId}::${JSON.stringify(sortedParams)}`;
  }

  /**
   * Lance spéculativement un outil si la membrane de sécurité le permet.
   * Retourne true si lancé, false si déjà en vol ou rejeté par sécurité.
   */
  public launchSpeculative(toolId: string, params: Record<string, unknown>): boolean {
    const safety = SovereignToolMembrane.evaluateTool(toolId);
    if (!safety.isSafeForSpeculation) {
      logger.warn(`[ShadowExecutionContext] Spéculation refusée pour ${toolId} : ${safety.reason}`);
      return false;
    }

    const key = this.generateKey(toolId, params);
    const existing = this.cache.get(key);

    // Si déjà en cours et non expiré, réutiliser
    if (existing && existing.expiresAt > Date.now()) {
      return false;
    }

    const now = Date.now();
    const entry: CachedPromiseEntry = {
      toolId,
      params,
      paramsKey: key,
      launchedAt: now,
      expiresAt: now + ShadowExecutionContext.DEFAULT_TTL_MS,
      status: 'PENDING',
      promise: Promise.resolve(),
    };

    entry.promise = this.executor(toolId, params)
      .then((res) => {
        entry.status = 'RESOLVED';
        entry.result = res;
        return res;
      })
      .catch((err) => {
        entry.status = 'REJECTED';
        entry.error = err instanceof Error ? err : new Error(String(err));
        throw err;
      });

    this.cache.set(key, entry);
    return true;
  }

  /**
   * Recherche une promesse spéculée compatible dans le cache.
   */
  private findMatchingEntry(toolId: string, params: Record<string, unknown>): { key: string; entry: CachedPromiseEntry } | null {
    const directKey = this.generateKey(toolId, params);
    const direct = this.cache.get(directKey);
    if (direct && direct.expiresAt > Date.now()) {
      return { key: directKey, entry: direct };
    }

    // Recherche tolérante par correspondance de sous-paramètres
    for (const [k, entry] of this.cache.entries()) {
      if (entry.toolId === toolId && entry.expiresAt > Date.now()) {
        const matches = Object.entries(params).every(([pk, pv]) => entry.params[pk] === pv);
        if (matches) {
          return { key: k, entry };
        }
      }
    }

    return null;
  }

  /**
   * Résout le résultat d'un outil :
   * Si l'outil a été spéculé → retourne la promesse déjà en cours (ou déjà finie).
   * Sinon → exécute l'outil à la demande (fallback synchrone).
   */
  public async resolveTool<T>(toolId: string, params: Record<string, unknown>): Promise<SpeculativeExecutionResult<T>> {
    const match = this.findMatchingEntry(toolId, params);
    const requestTime = Date.now();

    if (match) {
      const { key, entry } = match;
      const leadTime = requestTime - entry.launchedAt;
      const data = (await entry.promise) as T;
      const duration = Date.now() - entry.launchedAt;

      // Nettoyer après consommation
      this.cache.delete(key);

      return {
        toolId,
        params,
        data,
        executionDurationMs: duration,
        speculativeLeadTimeMs: leadTime,
        wasSpeculated: true,
      };
    }

    // Fallback : exécution directe (non spéculée)
    const start = Date.now();
    const data = (await this.executor(toolId, params)) as T;
    const duration = Date.now() - start;

    return {
      toolId,
      params,
      data,
      executionDurationMs: duration,
      speculativeLeadTimeMs: 0,
      wasSpeculated: false,
    };
  }

  /**
   * Nettoie les promesses expirées du cache.
   */
  public purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  public getActiveSpeculationsCount(): number {
    this.purgeExpired();
    return this.cache.size;
  }
}
