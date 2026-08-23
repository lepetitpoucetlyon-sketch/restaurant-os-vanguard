'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { useVerticalUIContext } from '@/shared/providers/VerticalUIProvider';
import { VerticalUIRegistry } from '@/shared/plugins/VerticalUIRegistry';
import { resolveUIComponent } from '@/shared/plugins/resolveUI';
import type { OverrideableComponent } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * useVerticalComponent — cascade 3 étages (P4).
 *
 * Résout le composant à utiliser pour un slot donné en appliquant :
 *   1. override TENANT   (Nexus `tenants/{id}/uiOverrides`)
 *   2. override VERTICALE (`IVerticalUIPlugin.components`)
 *   3. défaut fourni par l'appelant
 *
 * Signature inchangée depuis Phase G — les callers existants (StatCard,
 * PageHeader…) restent compatibles ; ils bénéficient automatiquement du 3ᵉ
 * étage sans modification.
 *
 * @example
 *   const StatCard = useVerticalComponent('StatCard', DefaultStatCard);
 *   return <StatCard label="CA" value="12 450 €" />;
 */
export function useVerticalComponent<P extends object>(
    name: OverrideableComponent,
    defaultComponent: React.ComponentType<P>
): React.ComponentType<P> {
    const variant = useAtomValue(tenantVariantAtom);
    const { tenantOverrides } = useVerticalUIContext();
    const resolved = resolveUIComponent<P>(name, variant, VerticalUIRegistry, tenantOverrides);
    return resolved ?? defaultComponent;
}

/**
 * withVerticalOverride — HOC transparent, même cascade que `useVerticalComponent`.
 *
 * @example
 *   export const StatCard = withVerticalOverride('StatCard', StatCardBase);
 */
export function withVerticalOverride<P extends object>(
    name: OverrideableComponent,
    DefaultComponent: React.ComponentType<P>
): React.ComponentType<P> {
    function VerticalAwareComponent(props: P) {
        const variant = useAtomValue(tenantVariantAtom);
        const { tenantOverrides } = useVerticalUIContext();
        const Override = resolveUIComponent<P>(
            name,
            variant,
            VerticalUIRegistry,
            tenantOverrides,
        );
        if (Override) return React.createElement(Override, props);
        return React.createElement(DefaultComponent, props);
    }
    VerticalAwareComponent.displayName = `WithVerticalOverride(${name})`;
    return VerticalAwareComponent;
}
