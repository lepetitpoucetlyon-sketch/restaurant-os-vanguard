/**
 * 🎨 TenantUiOverrides — surcharges UI persistées par tenant (P4 Custom UI).
 *
 * Complète le niveau 1 (verticale, cf. `IVerticalUIPlugin.components`) en offrant
 * un troisième étage de cascade :
 *
 *   Slot demandé → 1. override TENANT ici → 2. override VERTICALE → 3. défaut partagé
 *
 * Persisté dans Nexus à `tenants/{tenantId}/uiOverrides`. Étant donné qu'un
 * composant React n'est pas sérialisable, un override tenant désigne une SOURCE
 * (un `PlatformVariant` déjà enregistré dans `VerticalUIRegistry`) dont on
 * emprunte la version du slot. Cela permet à un tenant restaurant d'utiliser la
 * `StatCard` de la verticale bakery, par exemple, sans écrire un composant.
 *
 * Deux autres registres tenant sont exposés ici :
 *  - `scopedTokens` : mêmes CSS vars par route que la verticale, mais tenant.
 *  - `preferredLayout` : override du layout par défaut de la verticale.
 *
 * Rien ici ne remplace `mod_brand_basic` ou `BrandingService` — ces outils
 * gèrent les tokens globaux (primaryColor, logoUrl, font). `TenantUiOverrides`
 * gère la composition (quel composant pour quel slot).
 */

import { z } from 'zod';

import type { PlatformVariant } from '@/modules/system';
import { PlatformVariantSchema } from '@/modules/system';

// ── Slots ──────────────────────────────────────────────────────────────────────

/**
 * Slots surchargeables — dupliqués ici volontairement pour offrir une frontière
 * runtime Zod (le type TS live dans `IVerticalUIPlugin.ts`). Garder les deux
 * listes alignées.
 */
export const OVERRIDEABLE_COMPONENT_SLOTS = [
    'StatCard',
    'PageHeader',
    'EmptyState',
    'FilterBar',
    'ActionToolbar',
    'ContentSection',
    'SectionHeader',
    'LoadingState',
    'StatusBadge',
    'SupportHelpWidget',
] as const;

export const OverrideableComponentSchema = z.enum(OVERRIDEABLE_COMPONENT_SLOTS);
export type OverrideableComponentKey = z.infer<typeof OverrideableComponentSchema>;

// ── Schéma racine ──────────────────────────────────────────────────────────────

export const TenantUiOverridesSchema = z.object({
    /**
     * Map slot → verticale source dont on emprunte le composant.
     * Exemple : `{ StatCard: 'bakery' }` fait pointer le tenant vers
     * `VerticalUIRegistry.resolve('bakery').components?.StatCard`.
     * Si la source ne définit pas ce slot, on retombe sur le niveau verticale
     * courant puis sur le défaut partagé (fail-soft).
     *
     * Utilise `z.record(z.string(), …)` + `.refine()` (au lieu de `z.record(enum, …)`)
     * car Zod exige toutes les clés d'un enum en record — ici on veut du partiel
     * (le tenant peut n'overrider qu'un seul slot).
     */
    components: z
        .record(z.string(), PlatformVariantSchema)
        .refine(
            (v) =>
                Object.keys(v).every((k) =>
                    (OVERRIDEABLE_COMPONENT_SLOTS as readonly string[]).includes(k),
                ),
            { message: 'unknown component slot' },
        )
        .optional(),

    /**
     * CSS vars scoped par route, appliquées sur le wrapper DOM après celles de
     * la verticale (donc plus prioritaires). Route la plus longue gagne.
     */
    scopedTokens: z.record(z.string(), z.record(z.string(), z.string())).optional(),

    /**
     * Layout préféré — override du `preferredLayout` de la verticale, consommé
     * par `LayoutResolver` comme dernier fallback avant le layout par défaut.
     */
    preferredLayout: z
        .enum(['sidebar', 'topbar', 'kiosk', 'fullscreen', 'default'])
        .optional(),

    /** ISO timestamp de la dernière mise à jour (audit trail). */
    updatedAt: z.string().datetime().optional(),
});

/**
 * Type inféré. On surcharge `components` en `Partial<Record<...>>` :
 * Zod produit `Record<K, V>` (toutes clés obligatoires) alors que la sémantique
 * réelle est partielle (un tenant peut n'overrider que StatCard).
 */
export type TenantUiOverrides = Omit<
    z.infer<typeof TenantUiOverridesSchema>,
    'components'
> & {
    components?: Partial<Record<OverrideableComponentKey, PlatformVariant>>;
};

/**
 * Path Nexus canonique des overrides UI d'un tenant.
 * Le SovereignGuard exige la préfixe `tenants/{tenantId}/`.
 */
export function tenantUiOverridesPath(tenantId: string): string {
    return `tenants/${tenantId}/uiOverrides`;
}
