/**
 * 🔍 resolveUI — cascade de résolution UI en 3 étages (P4 Custom UI).
 *
 *   1. TENANT override   (`TenantUiOverrides.components[slot]` → verticale source)
 *   2. VERTICALE override (`IVerticalUIPlugin.components[slot]`)
 *   3. Défaut partagé    (renvoie `undefined` — l'appelant utilise sa version bundled)
 *
 * Fonction pure : ne touche à aucun store / provider. Reçoit le registry en
 * argument pour rester testable sans monter React ni Nexus.
 */

import type React from 'react';

import type { PlatformVariant } from '@/modules/system';
import type { IVerticalUIPlugin, OverrideableComponent } from '@/shared/plugins/IVerticalUIPlugin';
import type { TenantUiOverrides } from '@/shared/plugins/tenantUiOverridesSchema';

// Interface minimale exposée par un registry consommable par `resolveUI`.
// (Ne dépend pas de l'implémentation concrète pour permettre les mocks de test.)
export interface VerticalPluginRegistryLike {
    resolve(variant: PlatformVariant): IVerticalUIPlugin | null;
}

/**
 * Résout le composant à utiliser pour un slot donné en tenant compte des
 * overrides tenant + verticale.
 *
 * @param slot           nom du slot demandé (StatCard, PageHeader, …)
 * @param variant        variante courante du tenant
 * @param registry       registry verticale (VerticalUIRegistry en prod)
 * @param tenantOverrides overrides tenant (null si non chargés → skip étage 1)
 * @returns le composant à utiliser, ou `undefined` si aucun override → défaut
 */
export function resolveUIComponent<P extends object>(
    slot: OverrideableComponent,
    variant: PlatformVariant,
    registry: VerticalPluginRegistryLike,
    tenantOverrides: TenantUiOverrides | null,
): React.ComponentType<P> | undefined {
    // Étage 1 — override tenant (emprunt à une verticale source)
    const tenantSourceVariant = tenantOverrides?.components?.[slot];
    if (tenantSourceVariant) {
        const sourcePlugin = registry.resolve(tenantSourceVariant);
        const borrowed = sourcePlugin?.components?.[slot] as
            | React.ComponentType<P>
            | undefined;
        if (borrowed) return borrowed;
        // fail-soft : la source ne définit pas ce slot → étage 2
    }

    // Étage 2 — override de la verticale courante
    const ownPlugin = registry.resolve(variant);
    const own = ownPlugin?.components?.[slot] as React.ComponentType<P> | undefined;
    if (own) return own;

    // Étage 3 — aucun override, l'appelant utilise son composant par défaut
    return undefined;
}

/**
 * Résout le layout préféré en cascade tenant > verticale > 'default'.
 * Consommé par `LayoutResolver`.
 */
export function resolvePreferredLayout(
    variant: PlatformVariant,
    registry: VerticalPluginRegistryLike,
    tenantOverrides: TenantUiOverrides | null,
): NonNullable<IVerticalUIPlugin['preferredLayout']> {
    if (tenantOverrides?.preferredLayout) return tenantOverrides.preferredLayout;
    const plugin = registry.resolve(variant);
    return plugin?.preferredLayout ?? 'default';
}

/**
 * Résout les scopedTokens à injecter pour un pathname donné.
 * Merge : tokens verticale + tokens tenant (tenant écrase verticale sur clé identique).
 * Route la plus longue gagne dans chaque source.
 */
export function resolveScopedTokens(
    pathname: string,
    variant: PlatformVariant,
    registry: VerticalPluginRegistryLike,
    tenantOverrides: TenantUiOverrides | null,
): Record<string, string> {
    const merged: Record<string, string> = {};

    const verticalePlugin = registry.resolve(variant);
    if (verticalePlugin?.scopedTokens) {
        Object.assign(merged, pickMostSpecificRoute(pathname, verticalePlugin.scopedTokens));
    }

    if (tenantOverrides?.scopedTokens) {
        Object.assign(merged, pickMostSpecificRoute(pathname, tenantOverrides.scopedTokens));
    }

    return merged;
}

function pickMostSpecificRoute(
    pathname: string,
    scoped: Record<string, Record<string, string>>,
): Record<string, string> {
    const matched = Object.keys(scoped)
        .filter((route) => pathname.startsWith(route))
        .sort((a, b) => b.length - a.length)[0];
    return matched ? scoped[matched] : {};
}
