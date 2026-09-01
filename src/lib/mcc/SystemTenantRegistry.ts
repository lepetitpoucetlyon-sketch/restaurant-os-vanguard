/**
 * 🏛️ SystemTenantRegistry — Registre des 36 tenants système
 *
 * Chaque verticale dispose de 3 tiers permanents :
 *   _demo_V      — vitrine prospect (Simulacra Mode, lecture seule store)
 *   _test_V      — bac à sable dev (écriture libre, reset à la demande)
 *   _ref_V       — maître cloneable (write bloqué sauf promotion MCC)
 *
 * Les tenantIds clients suivent la convention : `tenant_{siret}`
 */

import { PLATFORM_VARIANTS, type PlatformVariant } from '@/kernel/contracts';

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

/**
 * Sous-domaine démo court par verticale — typé `Record<PlatformVariant, string>` :
 * l'exhaustivité est garantie par tsc, impossible d'oublier une verticale (Track 3.2).
 */
export const DEMO_SUBDOMAIN_BY_VARIANT: Record<PlatformVariant, string> = {
    restaurant: 'demo',
    hotel:      'demo-hotel',
    bakery:     'demo-bakery',
    garage:     'demo-garage',
    salon:      'demo-salon',
    clinic:     'demo-clinic',
    retail:     'demo-retail',
    custom:     'demo-custom',
    gym:        'demo-gym',
    coworking:  'demo-coworking',
    veterinary: 'demo-veterinary',
    florist:    'demo-florist',
};

/** Vue dérivée (sous-domaine court → tenantId système) — dérivée de DEMO_SUBDOMAIN_BY_VARIANT, ne peut pas diverger. */
export const DEMO_SUBDOMAIN_MAP: Record<string, string> = Object.fromEntries(
    (Object.entries(DEMO_SUBDOMAIN_BY_VARIANT) as [PlatformVariant, string][]).map(
        ([variant, subdomain]) => [subdomain, getSystemTenantId(variant, 'DEMO')]
    )
);

/** Retourne tous les tenantIds système (36 au total) */
export function getAllSystemTenantIds(): string[] {
    return Object.values(SYSTEM_TENANTS).flatMap(map => Object.values(map));
}

/** Source de vérité : itérer sur PLATFORM_VARIANTS (pas getAvailableVariants) */
export const SYSTEM_VARIANTS: readonly PlatformVariant[] = PLATFORM_VARIANTS;
