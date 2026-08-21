/**
 * PublicAccessConfig — Kill-switch MCC pour l'accès public (landing + signup).
 *
 * Cette config est SINGLETON (une seule entrée par plateforme, pas par tenant)
 * et vit dans `mcc/publicAccess/config`.
 *
 * Usage :
 *   - Lecture serveur : getPublicAccessConfig() (avec cache 30s)
 *   - Écriture RBAC   : /api/admin/fleet/public-access POST (mcc_super_admin)
 *   - Contrôle client : <PublicAccessGate feature="landing"> ou "signup"
 */

import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export const PublicAccessConfigSchema = z.object({
    /** La landing publique est-elle accessible aux visiteurs anonymes ? */
    landingEnabled: z.boolean().default(true),
    /** Le signup autonome (formulaire + Stripe) est-il ouvert ? */
    signupEnabled: z.boolean().default(true),
    /** Message custom affiché aux visiteurs quand une feature est OFF. */
    disabledMessage: z.string().max(500).optional(),
    /** Timestamp ISO de la dernière modif. */
    updatedAt: z.string().optional(),
    /** UID de l'auteur MCC du dernier changement. */
    updatedBy: z.string().optional(),
});

export type PublicAccessConfig = z.infer<typeof PublicAccessConfigSchema>;

export const PUBLIC_ACCESS_CONFIG_PATH = 'mcc/publicAccess/config';

export const DEFAULT_PUBLIC_ACCESS: PublicAccessConfig = {
    landingEnabled: true,
    signupEnabled: true,
};

const CACHE_TTL_MS = 30_000;
let cached: { value: PublicAccessConfig; at: number } | null = null;

/**
 * Lit la config d'accès public (avec cache 30s).
 * Fallback = DEFAULT_PUBLIC_ACCESS (ouvert) si aucune entrée.
 * Ne throw jamais — on veut fail-open pour ne pas fermer la plateforme
 * si Nexus est down.
 */
export async function getPublicAccessConfig(): Promise<PublicAccessConfig> {
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return cached.value;
    }
    try {
        const raw = await Nexus.adapter.get(PUBLIC_ACCESS_CONFIG_PATH);
        if (raw && typeof raw === 'object') {
            const parsed = PublicAccessConfigSchema.safeParse(raw);
            const value = parsed.success ? parsed.data : DEFAULT_PUBLIC_ACCESS;
            cached = { value, at: Date.now() };
            return value;
        }
    } catch (err) {
        logger.warn('[PublicAccessConfig] Lecture Nexus échouée — fallback ouvert', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
    cached = { value: DEFAULT_PUBLIC_ACCESS, at: Date.now() };
    return DEFAULT_PUBLIC_ACCESS;
}

/** Invalide le cache (à appeler après un POST). */
export function invalidatePublicAccessCache(): void {
    cached = null;
}
