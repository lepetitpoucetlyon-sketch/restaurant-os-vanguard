/**
 * 🏛️ SystemTenantRegistry — Registre des 24 tenants système
 *
 * Chaque verticale dispose de 3 tiers permanents :
 *   _demo_V      — vitrine prospect (Simulacra Mode, lecture seule store)
 *   _test_V      — bac à sable dev (écriture libre, reset à la demande)
 *   _ref_V       — maître cloneable (write bloqué sauf promotion MCC)
 *
 * Les tenantIds clients suivent la convention : `tenant_{siret}`
 */

import { PLATFORM_VARIANTS } from '@/modules/system';
import type { PlatformVariant } from '@/modules/system';

export type SystemTier = 'DEMO' | 'TEST' | 'REFERENCE';

type SystemTenantMap = Record<SystemTier, string>;

const SYSTEM_TENANTS: Record<PlatformVariant, SystemTenantMap> = {
    restaurant: { DEMO: '_demo_restaurant', TEST: '_test_restaurant', REFERENCE: '_ref_restaurant' },
    hotel:      { DEMO: '_demo_hotel',      TEST: '_test_hotel',      REFERENCE: '_ref_hotel'      },
    bakery:     { DEMO: '_demo_bakery',     TEST: '_test_bakery',     REFERENCE: '_ref_bakery'     },
    garage:     { DEMO: '_demo_garage',     TEST: '_test_garage',     REFERENCE: '_ref_garage'     },
    salon:      { DEMO: '_demo_salon',      TEST: '_test_salon',      REFERENCE: '_ref_salon'      },
    clinic:     { DEMO: '_demo_clinic',     TEST: '_test_clinic',     REFERENCE: '_ref_clinic'     },
    retail:     { DEMO: '_demo_retail',     TEST: '_test_retail',     REFERENCE: '_ref_retail'     },
    custom:     { DEMO: '_demo_custom',     TEST: '_test_custom',     REFERENCE: '_ref_custom'     },
    gym:        { DEMO: '_demo_gym',        TEST: '_test_gym',        REFERENCE: '_ref_gym'        },
    coworking:  { DEMO: '_demo_coworking',  TEST: '_test_coworking',  REFERENCE: '_ref_coworking'  },
    veterinary: { DEMO: '_demo_veterinary', TEST: '_test_veterinary', REFERENCE: '_ref_veterinary' },
    florist:    { DEMO: '_demo_florist',    TEST: '_test_florist',    REFERENCE: '_ref_florist'    },
};

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getSystemTenantId(variant: PlatformVariant, tier: SystemTier): string {
    return SYSTEM_TENANTS[variant][tier];
}

export function isSystemTenant(tenantId: string): boolean {
    return tenantId.startsWith('_demo_') ||
           tenantId.startsWith('_test_') ||
           tenantId.startsWith('_ref_');
}

export function getSystemTenantTier(tenantId: string): SystemTier | null {
    if (tenantId.startsWith('_demo_')) return 'DEMO';
    if (tenantId.startsWith('_test_')) return 'TEST';
    if (tenantId.startsWith('_ref_'))  return 'REFERENCE';
    return null;
}

/**
 * Seul _test_* accepte les écritures directes.
 * _demo_ → Simulacra Mode (intercepté avant d'arriver ici).
 * _ref_  → écriture bloquée, promotion via MCC uniquement.
 */
export function isWritable(tenantId: string): boolean {
    const tier = getSystemTenantTier(tenantId);
    if (!tier) return true;       // CLIENT → toujours writable
    return tier === 'TEST';       // seul TEST est libre
}

/** Filtre la fleet : les tenants système n'apparaissent pas dans la fleet cliente */
export function isFleetVisible(tenantId: string): boolean {
    return !isSystemTenant(tenantId);
}

/** Mapping sous-domaine court → tenantId système (Option A du plan) */
export const DEMO_SUBDOMAIN_MAP: Record<string, string> = {
    'demo':            '_demo_restaurant',
    'demo-hotel':      '_demo_hotel',
    'demo-bakery':     '_demo_bakery',
    'demo-garage':     '_demo_garage',
    'demo-salon':      '_demo_salon',
    'demo-clinic':     '_demo_clinic',
    'demo-retail':     '_demo_retail',
    'demo-custom':     '_demo_custom',
};

/** Retourne tous les tenantIds système (24 au total) */
export function getAllSystemTenantIds(): string[] {
    return Object.values(SYSTEM_TENANTS).flatMap(map => Object.values(map));
}

/** Source de vérité : itérer sur PLATFORM_VARIANTS (pas getAvailableVariants) */
export const SYSTEM_VARIANTS: readonly PlatformVariant[] = PLATFORM_VARIANTS;
