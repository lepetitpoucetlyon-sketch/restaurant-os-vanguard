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

/**
 * Schéma de LECTURE — plus strict que le schéma d'écriture.
 *
 * `PublicAccessConfigSchema` applique `.default(true)` aux deux interrupteurs : pratique
 * pour valider un PATCH partiel côté API, mais dangereux en lecture — un document corrompu
 * (ex. `{ garbage: 'x' }`) passerait la validation et ressortirait « plateforme grand
 * ouverte », annulant silencieusement le kill-switch.
 *
 * En lecture, un document stocké DOIT donc porter explicitement les deux booléens.
 */
const StoredPublicAccessSchema = z.object({
    landingEnabled: z.boolean(),
    signupEnabled: z.boolean(),
    disabledMessage: z.string().max(500).optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
});

export const PUBLIC_ACCESS_CONFIG_PATH = 'mcc/publicAccess/config';

export const DEFAULT_PUBLIC_ACCESS: PublicAccessConfig = {
    landingEnabled: true,
    signupEnabled: true,
};

const CACHE_TTL_MS = 30_000;
let cached: { value: PublicAccessConfig; at: number } | null = null;

/**
 * Dernière valeur lue AVEC SUCCÈS depuis Nexus.
 * Survit aux erreurs et à l'invalidation du cache TTL : c'est ce qui permet au
 * kill-switch de rester fermé pendant une panne Nexus.
 */
let lastKnownGood: PublicAccessConfig | null = null;

/**
 * Lit la config d'accès public (cache 30s).
 *
 * Stratégie de repli — « last known good », pas « fail-open aveugle » :
 *  1. Lecture Nexus réussie          → valeur lue (mémorisée comme last known good)
 *  2. Aucune entrée en base          → DEFAULT (ouvert) — plateforme jamais configurée
 *  3. Erreur Nexus / config invalide → dernière valeur connue si elle existe,
 *                                      sinon DEFAULT (ouvert)
 *
 * Pourquoi : un kill-switch qui se rouvre dès que Nexus tousse ne protège plus au
 * moment précis où on en a besoin (incident, abus, saturation). À l'inverse, fermer
 * la plateforme sur une erreur transitoire coûterait de la disponibilité. Le repli
 * sur la dernière valeur connue préserve les deux : l'intention de l'admin MCC est
 * conservée, et une plateforme jamais configurée reste ouverte.
 *
 * Ne throw jamais.
 */
export async function getPublicAccessConfig(): Promise<PublicAccessConfig> {
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return cached.value;
    }
    try {
        const raw = await Nexus.adapter.get(PUBLIC_ACCESS_CONFIG_PATH);
        if (raw && typeof raw === 'object') {
            const parsed = StoredPublicAccessSchema.safeParse(raw);
            if (parsed.success) {
                lastKnownGood = parsed.data;
                cached = { value: parsed.data, at: Date.now() };
                return parsed.data;
            }
            // Config présente mais invalide : ne jamais la laisser rouvrir la plateforme
            // silencieusement — on conserve la dernière valeur saine si on en a une.
            logger.error('[PublicAccessConfig] Config Nexus invalide (schéma Zod)', {
                fallback: lastKnownGood ? 'last known good' : 'DEFAULT (ouvert)',
            });
            const fallback = lastKnownGood ?? DEFAULT_PUBLIC_ACCESS;
            cached = { value: fallback, at: Date.now() };
            return fallback;
        }
        // Pas d'entrée en base = plateforme jamais configurée → ouvert, c'est légitime.
        lastKnownGood = DEFAULT_PUBLIC_ACCESS;
        cached = { value: DEFAULT_PUBLIC_ACCESS, at: Date.now() };
        return DEFAULT_PUBLIC_ACCESS;
    } catch (err) {
        const fallback = lastKnownGood ?? DEFAULT_PUBLIC_ACCESS;
        logger.warn('[PublicAccessConfig] Lecture Nexus échouée', {
            error: err instanceof Error ? err.message : String(err),
            fallback: lastKnownGood ? 'last known good (état admin conservé)' : 'DEFAULT (ouvert)',
        });
        // Ne PAS mettre le repli en cache TTL : sinon un hoquet Nexus fige l'état
        // dégradé 30 s alors que la base est peut-être déjà rétablie.
        return fallback;
    }
}

/** Invalide le cache TTL (à appeler après un POST). Conserve le last known good. */
export function invalidatePublicAccessCache(): void {
    cached = null;
}

/**
 * Réinitialise complètement l'état (cache TTL + last known good).
 * Réservé aux tests — jamais appelé en production.
 */
export function __resetPublicAccessStateForTests(): void {
    cached = null;
    lastKnownGood = null;
}
