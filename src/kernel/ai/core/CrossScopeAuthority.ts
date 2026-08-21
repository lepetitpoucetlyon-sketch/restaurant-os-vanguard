/**
 * CrossScopeAuthority — Règle R10 (ADR-008).
 *
 * Service dédié pour les cas exceptionnels où un caller a besoin d'accéder
 * aux deux registres (MCC ET Tenant). Ex : StrategyOracle cross-tenant,
 * RappelConso broadcast, VIP guest link palace.
 *
 * ADR-014 (Consolidation fondations) :
 * - Storage PERSISTANT dans Nexus (`mcc/crossScopeTokens/{tokenId}`) —
 *   survit à un reboot, auditable en base.
 * - Audit trail persistant (grant + reveal + revoke = 3 events tracés).
 * - Helper `revealScope(tokenId, callerModule, targetScope)` qui vérifie
 *   ET révèle le contexte (tenant ciblé) au caller.
 * - Cache en mémoire pour perf (5 min TTL, fallback Nexus si miss).
 *
 * Seul ce fichier est autorisé à importer MCCAIRegistry ET TenantAIRegistry.
 */

import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface CrossScopeGrant {
    callerModule: string;
    reason: string;
    ttlSeconds: number;
    /** Scopes / tenants ciblés par ce token (whitelist stricte). */
    targetScopes?: string[];
}

export interface StoredToken {
    tokenId: string;
    callerModule: string;
    reason: string;
    targetScopes: string[];
    grantedAt: number;
    expiresAt: number;
    revealCount: number;
    lastRevealedAt?: number;
    revokedAt?: number;
    revokedReason?: string;
}

interface CacheEntry {
    token: StoredToken;
    cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const TOKENS_PATH_PREFIX = 'mcc/crossScopeTokens';
const AUDIT_PATH_PREFIX = 'mcc/crossScopeAudit';

export class CrossScopeAuthority {
    private static cache: Map<string, CacheEntry> = new Map();

    /**
     * Accorde un token cross-scope. Persiste en Nexus + audit trail.
     */
    static async grant(request: CrossScopeGrant): Promise<string> {
        const tokenId = `cst_${request.callerModule.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const grantedAt = Date.now();
        const expiresAt = grantedAt + request.ttlSeconds * 1000;

        const token: StoredToken = {
            tokenId,
            callerModule: request.callerModule,
            reason: request.reason,
            targetScopes: request.targetScopes ?? [],
            grantedAt,
            expiresAt,
            revealCount: 0,
        };

        try {
            await Nexus.adapter.set(`${TOKENS_PATH_PREFIX}/${tokenId}`, token);
        } catch (err) {
            logger.error('[CrossScopeAuthority] Persistance grant échouée', {
                tokenId,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }

        CrossScopeAuthority.cache.set(tokenId, { token, cachedAt: Date.now() });
        await CrossScopeAuthority.audit('GRANT', tokenId, request.callerModule, {
            reason: request.reason,
            ttlSeconds: request.ttlSeconds,
            targetScopes: request.targetScopes ?? [],
        });

        logger.info(`[CrossScopeAuthority] Token cross-scope accordé : ${tokenId}`, {
            callerModule: request.callerModule,
            reason: request.reason,
            ttlSeconds: request.ttlSeconds,
            targetScopes: request.targetScopes,
            expiresAt: new Date(expiresAt).toISOString(),
        });

        return tokenId;
    }

    /**
     * Vérifie qu'un token est valide (non expiré, non révoqué).
     */
    static async verify(tokenId: string): Promise<boolean> {
        const token = await CrossScopeAuthority.load(tokenId);
        if (!token) return false;
        if (token.revokedAt) return false;
        if (Date.now() > token.expiresAt) return false;
        return true;
    }

    /**
     * Révèle le scope autorisé — le caller reçoit la liste des `targetScopes`.
     * Chaque appel est audité et incrémente `revealCount`.
     * Throw si token invalide ou si callerModule ≠ callerModule du grant.
     */
    static async revealScope(
        tokenId: string,
        callerModule: string,
    ): Promise<string[]> {
        const token = await CrossScopeAuthority.load(tokenId);
        if (!token) {
            throw new Error(`[CrossScopeAuthority] Token "${tokenId}" inconnu`);
        }
        if (token.revokedAt) {
            throw new Error(`[CrossScopeAuthority] Token "${tokenId}" révoqué (${token.revokedReason ?? 'sans motif'})`);
        }
        if (Date.now() > token.expiresAt) {
            throw new Error(`[CrossScopeAuthority] Token "${tokenId}" expiré`);
        }
        if (token.callerModule !== callerModule) {
            throw new Error(
                `[CrossScopeAuthority] callerModule "${callerModule}" ne correspond pas au grant "${token.callerModule}"`,
            );
        }

        const now = Date.now();
        const updated: StoredToken = {
            ...token,
            revealCount: token.revealCount + 1,
            lastRevealedAt: now,
        };
        await Nexus.adapter.set(`${TOKENS_PATH_PREFIX}/${tokenId}`, updated);
        CrossScopeAuthority.cache.set(tokenId, { token: updated, cachedAt: now });
        await CrossScopeAuthority.audit('REVEAL', tokenId, callerModule, {
            revealCount: updated.revealCount,
            targetScopes: token.targetScopes,
        });

        return token.targetScopes;
    }

    /**
     * Révoque un token cross-scope. Persiste + audit.
     */
    static async revoke(tokenId: string, reason?: string): Promise<void> {
        const token = await CrossScopeAuthority.load(tokenId);
        if (!token) return;

        const revoked: StoredToken = {
            ...token,
            revokedAt: Date.now(),
            revokedReason: reason ?? 'manual_revoke',
        };
        await Nexus.adapter.set(`${TOKENS_PATH_PREFIX}/${tokenId}`, revoked);
        CrossScopeAuthority.cache.set(tokenId, { token: revoked, cachedAt: Date.now() });
        await CrossScopeAuthority.audit('REVOKE', tokenId, token.callerModule, {
            reason: reason ?? 'manual_revoke',
        });
        logger.info(`[CrossScopeAuthority] Token révoqué : ${tokenId}`, { reason });
    }

    /** Nettoie les tokens expirés du cache mémoire uniquement (le storage reste pour audit). */
    static cleanup(): number {
        let cleaned = 0;
        const now = Date.now();
        for (const [id, entry] of CrossScopeAuthority.cache) {
            if (now > entry.token.expiresAt) {
                CrossScopeAuthority.cache.delete(id);
                cleaned++;
            }
        }
        return cleaned;
    }

    /** Nombre de tokens en cache mémoire (monitoring). */
    static get activeCount(): number {
        return CrossScopeAuthority.cache.size;
    }

    /** Vide le cache (utile pour tests). */
    static clearCache(): void {
        CrossScopeAuthority.cache.clear();
    }

    // ─── Internes ───────────────────────────────────────────────────────────

    private static async load(tokenId: string): Promise<StoredToken | null> {
        const cached = CrossScopeAuthority.cache.get(tokenId);
        if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
            return cached.token;
        }
        try {
            const raw = await Nexus.adapter.get(`${TOKENS_PATH_PREFIX}/${tokenId}`) as StoredToken | null;
            if (raw && typeof raw === 'object') {
                CrossScopeAuthority.cache.set(tokenId, { token: raw, cachedAt: Date.now() });
                return raw;
            }
            return null;
        } catch (err) {
            logger.warn('[CrossScopeAuthority] Lecture Nexus échouée', {
                tokenId,
                error: err instanceof Error ? err.message : String(err),
            });
            return null;
        }
    }

    private static async audit(
        action: 'GRANT' | 'REVEAL' | 'REVOKE',
        tokenId: string,
        callerModule: string,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        const auditId = `${action.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        try {
            await Nexus.adapter.set(`${AUDIT_PATH_PREFIX}/${auditId}`, {
                auditId,
                action,
                tokenId,
                callerModule,
                timestamp: new Date().toISOString(),
                metadata: metadata ?? {},
            });
        } catch (err) {
            logger.warn('[CrossScopeAuthority] Audit trail échoué (non bloquant)', {
                auditId,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
}
