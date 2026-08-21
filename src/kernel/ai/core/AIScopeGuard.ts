/**
 * AIScopeGuard — Barrière d'isolation R1.
 *
 * Vérifie que le caller est autorisé à accéder au registre demandé.
 * MCC callers → MCCAIRegistry uniquement.
 * Tenant callers → TenantAIRegistry uniquement.
 *
 * Enforcement basé sur le chemin du fichier appelant.
 */

import { logger } from '@/lib/logger';

/** Patterns de chemins autorisés pour le scope MCC. */
const MCC_ALLOWED_PATTERNS = [
    'app/api/admin/fleet',
    'app/api/admin/mcc',
    'app/(admin)/admin/mcc',
    'shared/eventBus/handlers/SupportTicket',
    'kernel/ai/mcc',
    'kernel/ai/authority',
    'infrastructure/services/fleet',
    'lib/cron',
] as const;

/** Patterns de chemins interdits pour le scope Tenant. */
const TENANT_BLOCKED_PATTERNS = [
    'app/api/admin/fleet',
    'app/api/admin/mcc',
    'kernel/ai/mcc',
] as const;

export class AIScopeGuard {
    /**
     * Asserte que le caller a le droit d'accéder au registre MCC.
     * Throw si le caller est un module tenant (src/modules/, src/app/api/tenant/, etc.).
     */
    static assertMCCScope(callerModule: string): void {
        const normalized = callerModule.replace(/\\/g, '/');

        // Vérifier que le caller matche au moins un pattern MCC autorisé
        const isAllowed = MCC_ALLOWED_PATTERNS.some(pattern =>
            normalized.includes(pattern),
        );

        if (!isAllowed) {
            const msg = `[AIScopeGuard] VIOLATION R1 — Le module "${callerModule}" n'est PAS autorisé à accéder au MCCAIRegistry. Seuls les callers MCC (fleet/admin) y ont accès.`;
            logger.error(msg);
            throw new Error(msg);
        }
    }

    /**
     * Asserte que le caller a le droit d'accéder au registre Tenant.
     * Throw si le caller est un module MCC (fleet admin, kernel/ai/mcc).
     */
    static assertTenantScope(callerModule: string): void {
        const normalized = callerModule.replace(/\\/g, '/');

        const isBlocked = TENANT_BLOCKED_PATTERNS.some(pattern =>
            normalized.includes(pattern),
        );

        if (isBlocked) {
            const msg = `[AIScopeGuard] VIOLATION R1 — Le module "${callerModule}" ne peut PAS accéder au TenantAIRegistry. Les callers MCC doivent utiliser MCCAIRegistry.`;
            logger.error(msg);
            throw new Error(msg);
        }
    }

    /**
     * Détecte le scope naturel d'un caller par son chemin.
     * Utile pour le diagnostic et la télémétrie.
     */
    static detectScope(callerModule: string): 'mcc' | 'tenant' | 'unknown' {
        const normalized = callerModule.replace(/\\/g, '/');
        if (MCC_ALLOWED_PATTERNS.some(p => normalized.includes(p))) return 'mcc';
        if (normalized.includes('modules/') || normalized.includes('app/api/tenant')) return 'tenant';
        return 'unknown';
    }
}
