/**
 * CrossScopeAuthority — Règle R10.
 *
 * Service dédié pour les cas exceptionnels où un caller a besoin d'accéder
 * aux deux registres (MCC ET Tenant). Ex: StrategyOracle cross-tenant.
 *
 * Chaque accès cross-scope est explicitement loggué avec :
 * - callerModule : qui demande
 * - reason : pourquoi
 * - ttlSeconds : durée de validité du token
 *
 * Seul ce fichier est autorisé à importer MCCAIRegistry ET TenantAIRegistry.
 */

import { logger } from '@/lib/logger';

export interface CrossScopeGrant {
    callerModule: string;
    reason: string;
    ttlSeconds: number;
}

interface ActiveToken {
    grant: CrossScopeGrant;
    expiresAt: number;
}

export class CrossScopeAuthority {
    private static activeTokens: Map<string, ActiveToken> = new Map();

    /**
     * Accorde un token cross-scope temporaire.
     * Le token est identifié par callerModule et expire après ttlSeconds.
     */
    static grant(request: CrossScopeGrant): string {
        const tokenId = `cst_${request.callerModule}_${Date.now()}`;
        const expiresAt = Date.now() + request.ttlSeconds * 1000;

        CrossScopeAuthority.activeTokens.set(tokenId, {
            grant: request,
            expiresAt,
        });

        logger.info(
            `[CrossScopeAuthority] Token cross-scope accordé : ${tokenId}`,
            {
                callerModule: request.callerModule,
                reason: request.reason,
                ttlSeconds: request.ttlSeconds,
                expiresAt: new Date(expiresAt).toISOString(),
            },
        );

        return tokenId;
    }

    /**
     * Vérifie qu'un token cross-scope est encore valide.
     */
    static verify(tokenId: string): boolean {
        const token = CrossScopeAuthority.activeTokens.get(tokenId);
        if (!token) return false;

        if (Date.now() > token.expiresAt) {
            CrossScopeAuthority.activeTokens.delete(tokenId);
            logger.info(`[CrossScopeAuthority] Token expiré et supprimé : ${tokenId}`);
            return false;
        }

        return true;
    }

    /**
     * Révoque un token cross-scope.
     */
    static revoke(tokenId: string): void {
        CrossScopeAuthority.activeTokens.delete(tokenId);
        logger.info(`[CrossScopeAuthority] Token révoqué : ${tokenId}`);
    }

    /**
     * Nettoie les tokens expirés (appelé périodiquement ou au besoin).
     */
    static cleanup(): number {
        let cleaned = 0;
        const now = Date.now();
        for (const [id, token] of CrossScopeAuthority.activeTokens) {
            if (now > token.expiresAt) {
                CrossScopeAuthority.activeTokens.delete(id);
                cleaned++;
            }
        }
        return cleaned;
    }

    /** Nombre de tokens actifs (pour monitoring). */
    static get activeCount(): number {
        return CrossScopeAuthority.activeTokens.size;
    }
}
