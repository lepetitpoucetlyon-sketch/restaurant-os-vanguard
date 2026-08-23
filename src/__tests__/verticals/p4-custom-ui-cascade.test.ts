/**
 * 🧪 P4 — Custom UI cascade tenant > verticale > défaut.
 *
 * Prouve concrètement :
 *  1. `resolveUIComponent` respecte l'ordre tenant → verticale → undefined.
 *  2. `resolvePreferredLayout` idem sur le layout préféré.
 *  3. `resolveScopedTokens` fusionne les tokens verticale puis tenant (tenant gagne).
 *  4. `TenantUiOverridesSchema` accepte/rejette les entrées attendues.
 *  5. Le blueprint `custom` est bien un canevas vierge (3 capabilities max).
 */

import { describe, it, expect } from 'vitest';

import type React from 'react';

import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';
import {
    resolveUIComponent,
    resolvePreferredLayout,
    resolveScopedTokens,
    type VerticalPluginRegistryLike,
} from '@/shared/plugins/resolveUI';
import {
    TenantUiOverridesSchema,
    tenantUiOverridesPath,
} from '@/shared/plugins/tenantUiOverridesSchema';
import { CUSTOM_BLUEPRINT } from '@/verticals/custom/custom.blueprint';

// ── Helpers ────────────────────────────────────────────────────────────────────

const RestaurantStatCard: React.FC = () => null;
const BakeryStatCard: React.FC = () => null;
const RestaurantPageHeader: React.FC = () => null;

const restaurantPlugin: IVerticalUIPlugin = {
    variant: 'restaurant',
    preferredLayout: 'sidebar',
    components: {
        StatCard: RestaurantStatCard,
        PageHeader: RestaurantPageHeader,
    },
    scopedTokens: {
        '/pos': { '--radius': '0.5rem' },
        '/kds': { '--radius': '0.25rem' },
    },
};

const bakeryPlugin: IVerticalUIPlugin = {
    variant: 'bakery',
    preferredLayout: 'topbar',
    components: { StatCard: BakeryStatCard },
};

function makeRegistry(
    plugins: Partial<Record<string, IVerticalUIPlugin>>,
): VerticalPluginRegistryLike {
    return {
        resolve: (variant) => plugins[variant] ?? null,
    };
}

// ── 1. resolveUIComponent — cascade ────────────────────────────────────────────

describe('resolveUIComponent — cascade tenant > verticale > défaut', () => {
    const registry = makeRegistry({ restaurant: restaurantPlugin, bakery: bakeryPlugin });

    it('sans override tenant → renvoie l\'override de la verticale', () => {
        const c = resolveUIComponent('StatCard', 'restaurant', registry, null);
        expect(c).toBe(RestaurantStatCard);
    });

    it('avec override tenant → emprunte à la verticale source', () => {
        const c = resolveUIComponent('StatCard', 'restaurant', registry, {
            components: { StatCard: 'bakery' },
        });
        expect(c).toBe(BakeryStatCard);
    });

    it('override tenant vers une source sans ce slot → fail-soft sur verticale', () => {
        const c = resolveUIComponent('PageHeader', 'restaurant', registry, {
            components: { PageHeader: 'bakery' }, // bakery n'a pas PageHeader
        });
        expect(c).toBe(RestaurantPageHeader); // fallback sur la verticale
    });

    it('aucun override nulle part → undefined (défaut appelant utilisé)', () => {
        const c = resolveUIComponent('EmptyState', 'restaurant', registry, null);
        expect(c).toBeUndefined();
    });

    it('verticale inconnue + pas de tenant override → undefined', () => {
        const c = resolveUIComponent('StatCard', 'custom', registry, null);
        expect(c).toBeUndefined();
    });

    it('override tenant vers verticale inconnue → fail-soft', () => {
        const c = resolveUIComponent('StatCard', 'restaurant', registry, {
            components: { StatCard: 'gym' }, // gym pas dans le registry
        });
        expect(c).toBe(RestaurantStatCard);
    });
});

// ── 2. resolvePreferredLayout ──────────────────────────────────────────────────

describe('resolvePreferredLayout — cascade', () => {
    const registry = makeRegistry({ restaurant: restaurantPlugin });

    it('tenant override gagne', () => {
        expect(
            resolvePreferredLayout('restaurant', registry, { preferredLayout: 'kiosk' }),
        ).toBe('kiosk');
    });

    it('sinon verticale', () => {
        expect(resolvePreferredLayout('restaurant', registry, null)).toBe('sidebar');
    });

    it('sinon "default"', () => {
        expect(resolvePreferredLayout('custom', registry, null)).toBe('default');
    });
});

// ── 3. resolveScopedTokens — merge ────────────────────────────────────────────

describe('resolveScopedTokens — merge verticale + tenant', () => {
    const registry = makeRegistry({ restaurant: restaurantPlugin });

    it('route la plus longue gagne dans chaque source', () => {
        const merged = resolveScopedTokens('/pos', 'restaurant', registry, null);
        expect(merged).toEqual({ '--radius': '0.5rem' });
    });

    it('tenant écrase verticale sur clé identique', () => {
        const merged = resolveScopedTokens('/pos', 'restaurant', registry, {
            scopedTokens: { '/pos': { '--radius': '1rem' } },
        });
        expect(merged['--radius']).toBe('1rem');
    });

    it('tenant peut ajouter une clé non présente dans la verticale', () => {
        const merged = resolveScopedTokens('/pos', 'restaurant', registry, {
            scopedTokens: { '/pos': { '--custom': '#fff' } },
        });
        expect(merged).toEqual({ '--radius': '0.5rem', '--custom': '#fff' });
    });

    it('aucune route ne matche → objet vide', () => {
        const merged = resolveScopedTokens('/finance', 'restaurant', registry, null);
        expect(merged).toEqual({});
    });
});

// ── 4. TenantUiOverridesSchema ─────────────────────────────────────────────────

describe('TenantUiOverridesSchema', () => {
    it('accepte un doc complet', () => {
        const parsed = TenantUiOverridesSchema.safeParse({
            components: { StatCard: 'bakery', PageHeader: 'restaurant' },
            scopedTokens: { '/pos': { '--radius': '1rem' } },
            preferredLayout: 'kiosk',
            updatedAt: '2026-08-23T12:00:00.000Z',
        });
        expect(parsed.success).toBe(true);
    });

    it('accepte un doc vide', () => {
        expect(TenantUiOverridesSchema.safeParse({}).success).toBe(true);
    });

    it('rejette un slot inconnu', () => {
        const parsed = TenantUiOverridesSchema.safeParse({
            components: { NotAnOverrideableSlot: 'restaurant' },
        });
        expect(parsed.success).toBe(false);
    });

    it('rejette une source variant hors enum', () => {
        const parsed = TenantUiOverridesSchema.safeParse({
            components: { StatCard: 'not_a_variant' },
        });
        expect(parsed.success).toBe(false);
    });

    it('rejette un preferredLayout inconnu', () => {
        const parsed = TenantUiOverridesSchema.safeParse({ preferredLayout: 'nope' });
        expect(parsed.success).toBe(false);
    });

    it('path Nexus est canonique', () => {
        expect(tenantUiOverridesPath('t_1')).toBe('tenants/t_1/uiOverrides');
    });
});

// ── 5. CUSTOM_BLUEPRINT — canevas vierge ───────────────────────────────────────

describe('CUSTOM_BLUEPRINT — canevas vierge (P4)', () => {
    it('n\'active que les 3 capabilities socle : dashboard, settings, brand_basic', () => {
        const active = Object.entries(CUSTOM_BLUEPRINT.capabilities)
            .filter(([, v]) => v === true)
            .map(([k]) => k)
            .sort();
        expect(active).toEqual(['mod_brand_basic', 'mod_dashboard', 'mod_settings']);
    });

    it('n\'a ni routes ni events pré-définis (l\'opérateur compose)', () => {
        expect(CUSTOM_BLUEPRINT.routes).toEqual([]);
        expect(CUSTOM_BLUEPRINT.events).toEqual([]);
    });

    it('n\'impose aucun matériel par défaut', () => {
        expect(CUSTOM_BLUEPRINT.hardware).toEqual([]);
    });

    it('reste en profondeur L0 (le tier monte via CalibratedTenantConfig)', () => {
        expect(CUSTOM_BLUEPRINT.precision).toBe('L0');
    });
});
